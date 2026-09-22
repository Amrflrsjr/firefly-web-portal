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
    {
      productId: null,
      productVariantId: null,
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
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

  // Track the most recently typed customer query so we can match and auto-select it after refresh
  const [lastTypedCustomerQuery, setLastTypedCustomerQuery] = useState("");

  // Ref to track if user explicitly clicked "+ Add New Customer"
  const isCreatingCustomerRef = useRef(false);

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
      return res.data;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load customers."));
      return [];
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
        const freshCustomers = await fetchAllCustomers();
        if (!isMounted) return;

        // Only auto-select the newest/matched customer if the user was actively creating one via the modal button
        if (
          isCreatingCustomerRef.current &&
          freshCustomers &&
          freshCustomers.length > 0
        ) {
          let matched: Customer | undefined;

          // 1. Try matching by exact or partial typed query
          if (lastTypedCustomerQuery.trim()) {
            const queryLower = lastTypedCustomerQuery.trim().toLowerCase();
            matched = freshCustomers.find(
              (c) => c.companyName.trim().toLowerCase() === queryLower,
            );
          }

          // 2. Fallback: If no exact string match is found, assume the newest customer was just created
          if (!matched) {
            matched = [...freshCustomers].sort(
              (a, b) => b.customerId - a.customerId,
            )[0];
          }

          if (matched) {
            setSelectedCustomerId(matched.customerId);
            setCustomerSearchQuery(matched.companyName);
            await loadCustomerDetails(matched.customerId);
            toast.success(
              `Successfully selected customer: ${matched.companyName}`,
            );
          }
          isCreatingCustomerRef.current = false; // Reset flag after handling
        } else if (selectedCustomerId > 0) {
          await loadCustomerDetails(selectedCustomerId);
        }
      };

      void reloadData();
    }

    return () => {
      isMounted = false;
    };
  }, [
    refreshTrigger,
    selectedCustomerId,
    lastTypedCustomerQuery,
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

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product.productId ?? null,
      productVariantId: null,
      description: product.description || product.name,
    };
    setItems(updated);

    setVariantSearchQueries({
      ...variantSearchQueries,
      [index]: "",
    });
  };

  const handleSelectVariant = (index: number, variant: ProductVariant) => {
    const variantLabel = formatVariantLabel(variant.color, variant.size);
    const skuLabel =
      variant.sku && variant.sku.trim() !== "" ? ` - SKU: ${variant.sku}` : "";

    const currentProd = selectedProducts[index];
    const baseName = currentProd ? currentProd.name : "";

    const combinedDescription = [
      baseName,
      variantLabel ? `(${variantLabel})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: currentProd ? currentProd.productId : updated[index].productId,
      productVariantId: variant.productVariantId ?? null,
      description: combinedDescription || "Standard Item",
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
        setProductSearchQueries((prev) => ({
          ...prev,
          [quickProductTargetIndex]: createdProd.name,
        }));
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

      if (refreshedProd) {
        setSelectedProducts((prev) => ({
          ...prev,
          [variantModalTargetIndex!]: refreshedProd,
        }));

        if (variantModalTargetIndex !== null) {
          const latestVariant =
            refreshedProd.variants[refreshedProd.variants.length - 1];
          if (latestVariant) {
            handleSelectVariant(variantModalTargetIndex, latestVariant);
            const vLabel = formatVariantLabel(
              latestVariant.color,
              latestVariant.size,
            );
            const skuLabel =
              latestVariant.sku && latestVariant.sku.trim() !== ""
                ? ` - SKU: ${latestVariant.sku}`
                : "";
            setVariantSearchQueries((prev) => ({
              ...prev,
              [variantModalTargetIndex]: `${
                vLabel || "Standard Variant"
              }${skuLabel}`,
            }));
          }
        }
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
      {
        productId: null,
        productVariantId: null,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
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
      productId:
        !item.productId || item.productId === 0 ? null : Number(item.productId),
      productVariantId:
        !item.productVariantId || item.productVariantId === 0
          ? null
          : Number(item.productVariantId),
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
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
    if (items.some((i) => i.quantity <= 0 || i.unitPrice < 0)) {
      setLocalError("Please ensure all items have a valid quantity and price.");
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
        {/* Modal Shell with standardized rounded-xl (12px) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-7xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
          {/* Flat Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Create New Quotation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Build client proposals with dynamic inventory mapping
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Body - 9 / 3 Split Ratio Layout */}
          <form
            id="create-quotation-form"
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
            ref={searchRef}
          >
            {activeError && (
              <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl flex items-center gap-3 text-xs shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Expanded Main Column (9 Cols) */}
            <div className="lg:col-span-9 space-y-5">
              {/* Proposal & Customer Details Card */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  Proposal & Customer Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Row 1: Customer & VAT Computation */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Customer <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Search or select customer..."
                        value={customerSearchQuery}
                        onFocus={() => setIsCustomerSearchOpen(true)}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setLastTypedCustomerQuery(e.target.value);
                          setIsCustomerSearchOpen(true);
                          if (!e.target.value) {
                            setSelectedCustomerId(0);
                            setSelectedContactId(0);
                            setContactEmailSnapshot("");
                            setContactNameSnapshot("");
                            setContactSearchQuery("");
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsCustomerSearchOpen(!isCustomerSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {isCustomerSearchOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                        <div
                          onClick={() => {
                            isCreatingCustomerRef.current = true;
                            setIsCustomerSearchOpen(false);
                            setLastTypedCustomerQuery(customerSearchQuery);
                            onTriggerAddCustomer();
                          }}
                          className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span>+ Add New Customer</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          {isSearchingCustomers ? (
                            <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium flex items-center justify-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                              Searching...
                            </div>
                          ) : searchedCustomers.length > 0 ? (
                            searchedCustomers.map((c) => (
                              <div
                                key={c.customerId}
                                onClick={() => handleSelectCustomer(c)}
                                className="px-3.5 py-2 text-xs hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
                              >
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {c.companyName}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                              No customers found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      VAT Computation
                    </label>
                    <select
                      value={vatType}
                      onChange={(e) => setVatType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="Exclusive">VAT Exclusive (12%)</option>
                      <option value="Inclusive">VAT Inclusive (12%)</option>
                      <option value="ZeroRated">VAT Exempt / Zero-Rated</option>
                    </select>
                  </div>

                  {/* Row 2: Contact Person & Contact Email */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <UserPlus className="w-3 h-3" /> + Add
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsContactSearchOpen(!isContactSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isContactSearchOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-48">
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
                                  className="px-3.5 py-2 text-xs hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
                                >
                                  <div>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                      {contact.name}
                                    </span>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                      Company: {customer.companyName}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                                No contact persons found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        value={contactEmailSnapshot}
                        disabled
                        placeholder="contact@company.com"
                        className="w-full border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 cursor-not-allowed border-slate-200 dark:border-slate-700 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items & Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Line Items & Products
                  </h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" /> Add Item
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-2xs relative group"
                      >
                        {/* Line Header Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            {/* Updated from rounded-md to rounded-lg */}
                            <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Item
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-xs text-slate-800 dark:text-slate-200 pr-1">
                              {currency(rowTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => duplicateItemRow(idx)}
                              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="Duplicate Item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60"
                              title="Remove Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Grid Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                          {/* 1. Select Product */}
                          <div className="lg:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              1. Select Product
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                              />
                            </div>

                            {activeProductSearchIndex === idx && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                                <div
                                  onClick={() => {
                                    setQuickProductTargetIndex(idx);
                                    setIsQuickProductModalOpen(true);
                                    setActiveProductSearchIndex(null);
                                  }}
                                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                                >
                                  <PackagePlus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
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
                                        className="px-3.5 py-2 text-xs hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
                                      >
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                          {p.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                                      No products found
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Select Variant */}
                          <div className="lg:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              2. Select Variant
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              <input
                                type="text"
                                placeholder={
                                  selectedProd
                                    ? "Optional variant..."
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all disabled:opacity-50 shadow-2xs"
                              />
                            </div>

                            {activeVariantSearchIndex === idx &&
                              selectedProd && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                                  <div
                                    onClick={() => {
                                      setVariantModalTargetIndex(idx);
                                      setTargetProductForVariants(selectedProd);
                                      setIsVariantModalOpen(true);
                                      setActiveVariantSearchIndex(null);
                                    }}
                                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                                  >
                                    <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    <span>
                                      + Add Variant to {selectedProd.name}
                                    </span>
                                  </div>

                                  <div className="max-h-40 overflow-y-auto">
                                    <div
                                      onClick={() => {
                                        const updated = [...items];
                                        updated[idx] = {
                                          ...updated[idx],
                                          productVariantId: null,
                                        };
                                        setItems(updated);
                                        setActiveVariantSearchIndex(null);
                                        setVariantSearchQueries({
                                          ...variantSearchQueries,
                                          [idx]: "",
                                        });
                                      }}
                                      className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer border-b border-slate-100 dark:border-slate-800 italic"
                                    >
                                      — None (No specific variant) —
                                    </div>

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
                                              handleSelectVariant(idx, variant)
                                            }
                                            className="px-3.5 py-2 text-xs hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
                                          >
                                            <div>
                                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                                {vLabel || "Standard Variant"}
                                              </span>
                                              {variant.sku &&
                                                variant.sku.trim() !== "" && (
                                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                                    SKU: {variant.sku}
                                                  </div>
                                                )}
                                            </div>
                                            <span className="font-medium font-mono text-slate-700 dark:text-slate-300">
                                              {currency(variant.unitPrice)}
                                            </span>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-3 text-xs text-center font-medium text-slate-400 dark:text-slate-500">
                                        No variants found
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Description
                            </label>
                            <input
                              type="text"
                              placeholder="Item specification..."
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Qty & Price */}
                          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block whitespace-nowrap">
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 text-right font-mono focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
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
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                  Note to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="Payment instructions, bank details, or delivery terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Compact Right Sidebar Column (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Order Summary
                  </h3>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {currency(calculatedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>VAT ({vatType})</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {currency(calculatedVat)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      Total
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {currency(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validity Period Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Validity Period
                  </label>
                </div>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
                <div className="text-[10px] text-slate-400 dark:text-slate-400">
                  Valid until{" "}
                  {validUntilDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Standardized Button Hierarchy */}
              <div className="space-y-2 pt-1">
                {/* 1. Primary Filled Action Button (Amber/Orange) */}
                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("create")}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Calculator className="w-4 h-4" />
                  {saving && submittingAction === "create"
                    ? "Creating..."
                    : "Create Quotation"}
                </button>

                {/* 2. Semantic Secondary Action ("Save & Send Email" with blue tint) */}
                {onSubmitAndSend && (
                  <button
                    form="create-quotation-form"
                    type="submit"
                    onClick={() => setSubmittingAction("send")}
                    disabled={saving}
                    className="w-full group inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 dark:hover:bg-blue-950/60 dark:hover:border-blue-800 dark:hover:text-blue-200 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    {saving && submittingAction === "send"
                      ? "Saving & Sending..."
                      : "Save & Send Email"}
                  </button>
                )}

                {/* 3. In-Flow Secondary Action ("Save as Draft" with warm amber hover tint) */}
                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("draft")}
                  disabled={saving}
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-900 dark:hover:bg-amber-950/20 dark:hover:border-amber-900/40 dark:hover:text-amber-200 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {saving && submittingAction === "draft"
                    ? "Saving..."
                    : "Save as Draft"}
                </button>

                {/* 4. Neutral Dismiss Action ("Cancel") */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
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
