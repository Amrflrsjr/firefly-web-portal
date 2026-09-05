import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import axios from "axios";
import type {
  CreateQuotationDto,
  QuotationItemDto,
} from "../../types/quotation";
import type { Customer, CustomerContact } from "../../types/customer";
import type {
  Product,
  ProductVariant,
  CreateProductDto,
} from "../../types/product";
import {
  X,
  Plus,
  Trash2,
  UserPlus,
  Search,
  ChevronRight,
  Mail,
  AlertCircle,
  Calculator,
  PackagePlus,
  Sparkles,
  RefreshCw,
  Copy,
  Calendar,
  ChevronDown,
  Building2,
} from "lucide-react";
import { CreateProductModal } from "../products/CreateProductModal";
import { ProductVariantsModal } from "../products/ProductVariantsModal";

interface CreateQuotationModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateQuotationDto) => void;
  onSubmitAndSend?: (dto: CreateQuotationDto) => void;
  onTriggerAddCustomer: () => void;
  onTriggerAddContact: (customer: Customer) => void;
  refreshTrigger?: number;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  saving,
  error: externalError,
  onClose,
  onSubmit,
  onSubmitAndSend,
  onTriggerAddCustomer,
  onTriggerAddContact,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedContactId, setSelectedContactId] = useState<number>(0);

  // Search states for Customer and Contact Person
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);

  const [vatType, setVatType] = useState<string>("Exclusive");
  const [validityDays, setValidityDays] = useState<number>(7);
  const [notes, setNotes] = useState("");
  const [contactNameSnapshot, setContactNameSnapshot] = useState("");
  const [contactEmailSnapshot, setContactEmailSnapshot] = useState("");

  const [items, setItems] = useState<QuotationItemDto[]>([
    { productVariantId: null, description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: Product | null;
  }>({});

  const [activeProductSearchIndex, setActiveProductSearchIndex] = useState<
    number | null
  >(null);
  const [activeVariantSearchIndex, setActiveVariantSearchIndex] = useState<
    number | null
  >(null);

  const [productSearchQueries, setProductSearchQueries] = useState<{
    [key: number]: string;
  }>({});
  const [variantSearchQueries, setVariantSearchQueries] = useState<{
    [key: number]: string;
  }>({});

  // On-the-fly product creation modal state
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductTargetIndex, setQuickProductTargetIndex] = useState<
    number | null
  >(null);

  // Variant management modal state for existing products
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [targetProductForVariants, setTargetProductForVariants] =
    useState<Product | null>(null);
  const [variantModalTargetIndex, setVariantModalTargetIndex] = useState<
    number | null
  >(null);

  const searchRef = useRef<HTMLFormElement>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "draft" | "create" | "send" | null
  >(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const activeError = localError || externalError;

  // Helper to safely format variant attributes without stray slashes
  const formatVariantLabel = (color?: string, size?: string) => {
    const parts = [color, size].filter((p) => p && p.trim() !== "");
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  const getErrorMessage = (err: unknown, defaultMsg: string): string => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { message?: string } | undefined;
      return data?.message || defaultMsg;
    }
    return defaultMsg;
  };

  const fetchProducts = useCallback(async () => {
    try {
      const prodRes = await api.get<Product[]>("/products");
      setProducts(prodRes.data);
      return prodRes.data;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load products."));
      return [];
    }
  }, []);

  const fetchAllCustomers = useCallback(async () => {
    try {
      const res = await api.get<Customer[]>("/customers");
      setAllCustomers(res.data);
      setSearchedCustomers(res.data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load customers."));
    }
  }, []);

  const loadCustomerDetails = useCallback(async (customerId: number) => {
    if (!customerId) return;
    try {
      const res = await api.get<Customer>(`/customers/${customerId}`);
      const fullCustomer = res.data;

      if (
        fullCustomer &&
        fullCustomer.contacts &&
        fullCustomer.contacts.length > 0
      ) {
        const primaryContact =
          fullCustomer.contacts.find((c) => c.isPrimary) ||
          fullCustomer.contacts[0];
        if (primaryContact) {
          setSelectedContactId(primaryContact.contactId ?? 0);
          setContactNameSnapshot(primaryContact.name || "");
          setContactEmailSnapshot(primaryContact.email || "");
          setContactSearchQuery(primaryContact.name || "");
        }
      } else {
        setSelectedContactId(0);
        setContactNameSnapshot(fullCustomer?.companyName || "");
        setContactEmailSnapshot("");
        setContactSearchQuery(fullCustomer?.companyName || "");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to reload customer contacts."));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      await Promise.all([fetchProducts(), fetchAllCustomers()]);
      if (!isMounted) return;
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchProducts, fetchAllCustomers]);

  useEffect(() => {
    let isMounted = true;

    if (refreshTrigger > 0) {
      const reloadData = async () => {
        await fetchAllCustomers();
        if (selectedCustomerId > 0) {
          await loadCustomerDetails(selectedCustomerId);
        }
        if (!isMounted) return;
      };

      void reloadData();
    }

    return () => {
      isMounted = false;
    };
  }, [
    refreshTrigger,
    selectedCustomerId,
    loadCustomerDetails,
    fetchAllCustomers,
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setActiveProductSearchIndex(null);
        setActiveVariantSearchIndex(null);
        setIsCustomerSearchOpen(false);
        setIsContactSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSearchedCustomers = async () => {
      if (!customerSearchQuery.trim()) {
        setSearchedCustomers(allCustomers);
        return;
      }

      try {
        setIsSearchingCustomers(true);
        const response = await api.get<Customer[]>("/customers", {
          params: { search: customerSearchQuery },
        });
        setSearchedCustomers(response.data);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to search customers."));
      } finally {
        setIsSearchingCustomers(false);
      }
    };

    const timer = setTimeout(fetchSearchedCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery, allCustomers]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomerId(customer.customerId);
    setCustomerSearchQuery(customer.companyName);
    setIsCustomerSearchOpen(false);
    await loadCustomerDetails(customer.customerId);
  };

  const handleSelectContactByPerson = (
    contact: CustomerContact,
    parentCustomer: Customer,
  ) => {
    setSelectedCustomerId(parentCustomer.customerId);
    setCustomerSearchQuery(parentCustomer.companyName);
    setSelectedContactId(contact.contactId ?? 0);
    setContactNameSnapshot(contact.name || "");
    setContactEmailSnapshot(contact.email || "");
    setContactSearchQuery(contact.name || "");
    setIsContactSearchOpen(false);
    loadCustomerDetails(parentCustomer.customerId);
  };

  // Flatten all contacts from all loaded customers for secondary searching
  const allAvailableContacts = allCustomers.flatMap((cust) =>
    (cust.contacts || []).map((contact) => ({
      contact,
      customer: cust,
    })),
  );

  const filteredContacts = allAvailableContacts.filter(({ contact }) =>
    contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()),
  );

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemDto,
    value: string | number | null,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSelectProduct = (index: number, product: Product) => {
    const updatedProducts = { ...selectedProducts, [index]: product };
    setSelectedProducts(updatedProducts);
    setActiveProductSearchIndex(null);
    setProductSearchQueries({ ...productSearchQueries, [index]: product.name });
    setActiveVariantSearchIndex(index);
  };

  const handleSelectVariant = (
    index: number,
    product: Product,
    variant: ProductVariant,
  ) => {
    const variantLabel = formatVariantLabel(variant.color, variant.size);
    const skuLabel =
      variant.sku && variant.sku.trim() !== "" ? ` - SKU: ${variant.sku}` : "";
    const descSuffix = variantLabel ? ` - ${variantLabel}` : "";
    const skuSuffix =
      variant.sku && variant.sku.trim() !== "" ? ` (${variant.sku})` : "";

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productVariantId: variant.productVariantId ?? null,
      description: `${product.name}${descSuffix}${skuSuffix}`,
      unitPrice: variant.unitPrice,
    };
    setItems(updated);
    setActiveVariantSearchIndex(null);
    setVariantSearchQueries({
      ...variantSearchQueries,
      [index]: `${variantLabel || "Standard Variant"}${skuLabel}`,
    });
  };

  const handleQuickSaveProduct = async (dto: CreateProductDto) => {
    try {
      const response = await api.post<Product>("/products", dto);
      const newProduct = response.data;
      toast.success("Product created and added to catalog!");

      const freshProducts = await fetchProducts();
      const createdProd =
        freshProducts.find((p) => p.productId === newProduct.productId) ||
        newProduct;

      if (quickProductTargetIndex !== null) {
        handleSelectProduct(quickProductTargetIndex, createdProd);
        const firstVariant = createdProd.variants?.[0];
        if (firstVariant) {
          handleSelectVariant(
            quickProductTargetIndex,
            createdProd,
            firstVariant,
          );
        }
      }

      setIsQuickProductModalOpen(false);
      setQuickProductTargetIndex(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to create product."));
    }
  };

  const handleAddVariantFromModal = async (
    productId: number,
    variant: ProductVariant,
  ) => {
    try {
      await api.post(`/products/${productId}/variants`, variant);
      toast.success("New variant added to catalog!");

      const freshProducts = await fetchProducts();
      const refreshedProd = freshProducts.find(
        (p) => p.productId === productId,
      );

      if (refreshedProd && variantModalTargetIndex !== null) {
        const latestVariant =
          refreshedProd.variants[refreshedProd.variants.length - 1];
        handleSelectVariant(
          variantModalTargetIndex,
          refreshedProd,
          latestVariant,
        );
      }

      setIsVariantModalOpen(false);
      setTargetProductForVariants(null);
      setVariantModalTargetIndex(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to add variant."));
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productVariantId: null, description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const duplicateItemRow = (index: number) => {
    const targetItem = items[index];
    const duplicatedItem = { ...targetItem };
    const updatedItems = [...items];
    updatedItems.splice(index + 1, 0, duplicatedItem);
    setItems(updatedItems);

    if (selectedProducts[index]) {
      setSelectedProducts({
        ...selectedProducts,
        [index + 1]: selectedProducts[index],
      });
    }
    if (productSearchQueries[index]) {
      setProductSearchQueries({
        ...productSearchQueries,
        [index + 1]: productSearchQueries[index],
      });
    }
    if (variantSearchQueries[index]) {
      setVariantSearchQueries({
        ...variantSearchQueries,
        [index + 1]: variantSearchQueries[index],
      });
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      setLocalError("Quotation must have at least one item.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const rawSubtotal = items.reduce(
    (acc, item) =>
      acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );

  let calculatedSubtotal = rawSubtotal;
  let calculatedVat = 0;
  let calculatedTotal = rawSubtotal;

  if (vatType === "Inclusive") {
    calculatedTotal = rawSubtotal;
    calculatedSubtotal = Math.round((rawSubtotal / 1.12) * 100) / 100;
    calculatedVat =
      Math.round((calculatedTotal - calculatedSubtotal) * 100) / 100;
  } else if (vatType === "Exclusive") {
    calculatedSubtotal = rawSubtotal;
    calculatedVat = Math.round(rawSubtotal * 0.12 * 100) / 100;
    calculatedTotal =
      Math.round((calculatedSubtotal + calculatedVat) * 100) / 100;
  }

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + validityDays);

  const buildDto = (statusOverride?: string): CreateQuotationDto => {
    const formattedItems: QuotationItemDto[] = items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      productVariantId:
        item.productVariantId === 0 ? null : item.productVariantId,
    }));

    return {
      customerId: selectedCustomerId,
      contactId: selectedContactId > 0 ? selectedContactId : null,
      contactNameSnapshot,
      contactEmailSnapshot: contactEmailSnapshot.trim(),
      validUntil: validUntilDate.toISOString(),
      vatType,
      noteToCustomer: notes.trim() || undefined,
      status: statusOverride,
      items: formattedItems,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setLocalError("Please select a customer.");
      return;
    }
    if (
      items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice < 0)
    ) {
      setLocalError(
        "Please ensure all items have a description, valid quantity, and price.",
      );
      return;
    }

    setLocalError(null);

    const isDraft = submittingAction === "draft";
    const statusToSend = isDraft ? "Draft" : "Created";
    const dto = buildDto(statusToSend);

    if (submittingAction === "send" && onSubmitAndSend) {
      onSubmitAndSend(dto);
    } else {
      onSubmit(dto);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-335 overflow-hidden my-auto flex flex-col max-h-[95vh]">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Create New Quotation
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  Build client proposals with dynamic inventory mapping
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200/60">
                {items.length} {items.length === 1 ? "item" : "items"} •{" "}
                <span className="text-amber-600 font-extrabold">
                  {currency(calculatedTotal)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Body - 9 / 3 Split Ratio Layout */}
          <form
            id="create-quotation-form"
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/40 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
            ref={searchRef}
          >
            {activeError && (
              <div className="lg:col-span-12 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-sm shadow-2xs">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Expanded Main Column (9 Cols) */}
            <div className="lg:col-span-9 space-y-5 sm:space-y-6">
              {/* Proposal & Customer Details */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Proposal & Customer Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Customer Searchable Dropdown with + Add New option */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Customer <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Search or select customer..."
                        value={customerSearchQuery}
                        onFocus={() => setIsCustomerSearchOpen(true)}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setIsCustomerSearchOpen(true);
                          if (!e.target.value) {
                            setSelectedCustomerId(0);
                            setSelectedContactId(0);
                          }
                        }}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsCustomerSearchOpen(!isCustomerSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {isCustomerSearchOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                        <div
                          onClick={() => {
                            setIsCustomerSearchOpen(false);
                            onTriggerAddCustomer();
                          }}
                          className="px-3.5 py-3 text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 cursor-pointer flex items-center gap-2 border-b border-amber-200 shrink-0 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-[#F9B53F]" />
                          <span>+ Add New Customer</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          {isSearchingCustomers ? (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium flex items-center justify-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F9B53F]" />
                              Searching...
                            </div>
                          ) : searchedCustomers.length > 0 ? (
                            searchedCustomers.map((c) => (
                              <div
                                key={c.customerId}
                                onClick={() => handleSelectCustomer(c)}
                                className="px-3.5 py-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                              >
                                <span className="font-bold text-slate-800">
                                  {c.companyName}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                              No customers found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Searchable Contact Person Field */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Contact Person
                      </label>
                      {selectedCustomerId > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentCust = allCustomers.find(
                              (c) => c.customerId === selectedCustomerId,
                            );
                            if (currentCust) onTriggerAddContact(currentCust);
                          }}
                          className="text-[10px] font-bold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <UserPlus className="w-3 h-3" /> + Add
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search contact person..."
                        value={contactSearchQuery}
                        onFocus={() => setIsContactSearchOpen(true)}
                        onChange={(e) => {
                          setContactSearchQuery(e.target.value);
                          setIsContactSearchOpen(true);
                          if (!e.target.value) {
                            setSelectedContactId(0);
                            setContactNameSnapshot("");
                            setContactEmailSnapshot("");
                          }
                        }}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsContactSearchOpen(!isContactSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isContactSearchOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-48">
                          <div className="overflow-y-auto">
                            {filteredContacts.length > 0 ? (
                              filteredContacts.map(({ contact, customer }) => (
                                <div
                                  key={contact.contactId}
                                  onClick={() =>
                                    handleSelectContactByPerson(
                                      contact,
                                      customer,
                                    )
                                  }
                                  className="px-3.5 py-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800">
                                      {contact.name}
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      Company: {customer.companyName}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                                No contact persons found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Contact Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={contactEmailSnapshot}
                        disabled
                        placeholder="contact@company.com"
                        className="w-full border rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 cursor-not-allowed border-slate-200"
                      />
                    </div>
                  </div>

                  {/* VAT Computation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      VAT Computation
                    </label>
                    <select
                      value={vatType}
                      onChange={(e) => setVatType(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Exclusive">VAT Exclusive (12%)</option>
                      <option value="Inclusive">VAT Inclusive (12%)</option>
                      <option value="ZeroRated">VAT Exempt / Zero-Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Line Items & Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Line Items & Products
                  </h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F9B53F]" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const prodQuery = productSearchQueries[idx] || "";
                    const variantQuery = variantSearchQueries[idx] || "";
                    const selectedProd = selectedProducts[idx];

                    const filteredProducts = products.filter((p) =>
                      p.name.toLowerCase().includes(prodQuery.toLowerCase()),
                    );

                    const filteredVariants = (
                      selectedProd?.variants || []
                    ).filter(
                      (v) =>
                        (v.sku &&
                          v.sku
                            .toLowerCase()
                            .includes(variantQuery.toLowerCase())) ||
                        (v.color &&
                          v.color
                            .toLowerCase()
                            .includes(variantQuery.toLowerCase())) ||
                        (v.size &&
                          v.size
                            .toLowerCase()
                            .includes(variantQuery.toLowerCase())),
                    );

                    const rowTotal =
                      (Number(item.quantity) || 0) *
                      (Number(item.unitPrice) || 0);

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200/80 p-4 rounded-3xl space-y-3.5 shadow-2xs relative group"
                      >
                        {/* Line Header Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Item
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-slate-800 pr-1">
                              {currency(rowTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => duplicateItemRow(idx)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                              title="Duplicate Item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer border border-rose-200/60"
                              title="Remove Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Spacious Horizontal Grid Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                          {/* 1. Select Product */}
                          <div className="lg:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              1. Select Product
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search product..."
                                value={prodQuery}
                                onFocus={() => {
                                  fetchProducts();
                                  setActiveProductSearchIndex(idx);
                                }}
                                onChange={(e) => {
                                  setProductSearchQueries({
                                    ...productSearchQueries,
                                    [idx]: e.target.value,
                                  });
                                  setActiveProductSearchIndex(idx);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                              />
                            </div>

                            {activeProductSearchIndex === idx && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                <div
                                  onClick={() => {
                                    setQuickProductTargetIndex(idx);
                                    setIsQuickProductModalOpen(true);
                                    setActiveProductSearchIndex(null);
                                  }}
                                  className="px-3.5 py-3 text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 cursor-pointer flex items-center gap-2 border-b border-amber-200 shrink-0 transition-colors"
                                >
                                  <PackagePlus className="w-4 h-4 text-[#F9B53F]" />
                                  <span>+ Add New Product</span>
                                </div>

                                <div className="max-h-40 overflow-y-auto">
                                  {filteredProducts.length > 0 ? (
                                    filteredProducts.map((p) => (
                                      <div
                                        key={p.productId}
                                        onClick={() =>
                                          handleSelectProduct(idx, p)
                                        }
                                        className="px-3.5 py-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                                      >
                                        <span className="font-bold text-slate-800">
                                          {p.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                                      No products found
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Select Variant */}
                          <div className="lg:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              2. Select Variant
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder={
                                  selectedProd
                                    ? "Select variant..."
                                    : "Select product first"
                                }
                                disabled={!selectedProd}
                                value={variantQuery}
                                onFocus={() => setActiveVariantSearchIndex(idx)}
                                onChange={(e) => {
                                  setVariantSearchQueries({
                                    ...variantSearchQueries,
                                    [idx]: e.target.value,
                                  });
                                  setActiveVariantSearchIndex(idx);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all disabled:opacity-50"
                              />
                            </div>

                            {activeVariantSearchIndex === idx &&
                              selectedProd && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                  <div
                                    onClick={() => {
                                      setVariantModalTargetIndex(idx);
                                      setTargetProductForVariants(selectedProd);
                                      setIsVariantModalOpen(true);
                                      setActiveVariantSearchIndex(null);
                                    }}
                                    className="px-3.5 py-3 text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 cursor-pointer flex items-center gap-2 border-b border-amber-200 shrink-0 transition-colors"
                                  >
                                    <Plus className="w-4 h-4 text-[#F9B53F]" />
                                    <span>
                                      + Add Variant to {selectedProd.name}
                                    </span>
                                  </div>

                                  <div className="max-h-40 overflow-y-auto">
                                    {filteredVariants.length > 0 ? (
                                      filteredVariants.map((variant) => {
                                        const vLabel = formatVariantLabel(
                                          variant.color,
                                          variant.size,
                                        );
                                        return (
                                          <div
                                            key={variant.productVariantId}
                                            onClick={() =>
                                              handleSelectVariant(
                                                idx,
                                                selectedProd,
                                                variant,
                                              )
                                            }
                                            className="px-3.5 py-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                                          >
                                            <div>
                                              <span className="font-bold text-slate-800">
                                                {vLabel || "Standard Variant"}
                                              </span>
                                              {variant.sku &&
                                                variant.sku.trim() !== "" && (
                                                  <div className="text-[10px] text-slate-400 font-mono">
                                                    SKU: {variant.sku}
                                                  </div>
                                                )}
                                            </div>
                                            <span className="font-bold font-mono text-slate-700">
                                              {currency(variant.unitPrice)}
                                            </span>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-3 text-xs text-center font-medium text-slate-400">
                                        No variants found
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Description{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Item specification..."
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                            />
                          </div>

                          {/* Qty & Price */}
                          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Qty
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block whitespace-nowrap">
                                Price (₱)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 text-right font-mono focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note to Customer */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Note to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="Payment instructions, bank details, or delivery terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white resize-none transition-all"
                />
              </div>
            </div>

            {/* Compact Right Sidebar Column (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Calculator className="w-3.5 h-3.5 text-[#F9B53F]" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Order Summary
                  </h3>
                </div>

                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currency(calculatedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT ({vatType})</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currency(calculatedVat)}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-[11px] font-black text-slate-900 uppercase">
                      Total
                    </span>
                    <span className="font-mono text-lg font-black text-amber-600">
                      {currency(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validity Period Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Validity Period
                  </label>
                </div>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all cursor-pointer"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
                <div className="text-[10px] font-medium text-slate-400">
                  Valid until{" "}
                  {validUntilDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Stacked Primary Actions */}
              <div className="space-y-2 pt-1">
                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("create")}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-extrabold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {saving && submittingAction === "create"
                    ? "Creating..."
                    : "Create Quotation"}
                </button>

                {onSubmitAndSend && (
                  <button
                    form="create-quotation-form"
                    type="submit"
                    onClick={() => setSubmittingAction("send")}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {saving && submittingAction === "send"
                      ? "Saving & Sending..."
                      : "Save & Send Email"}
                  </button>
                )}

                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("draft")}
                  disabled={saving}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {saving && submittingAction === "draft"
                    ? "Saving..."
                    : "Save as Draft"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Backend Product Modal */}
      {isQuickProductModalOpen && (
        <CreateProductModal
          saving={false}
          error=""
          onClose={() => {
            setIsQuickProductModalOpen(false);
            setQuickProductTargetIndex(null);
          }}
          onSubmit={handleQuickSaveProduct}
        />
      )}

      {/* Backend Variant Modal */}
      {isVariantModalOpen && targetProductForVariants && (
        <ProductVariantsModal
          product={targetProductForVariants}
          saving={false}
          error=""
          onClose={() => {
            setIsVariantModalOpen(false);
            setTargetProductForVariants(null);
            setVariantModalTargetIndex(null);
          }}
          onAddVariant={handleAddVariantFromModal}
        />
      )}
    </>
  );
};
