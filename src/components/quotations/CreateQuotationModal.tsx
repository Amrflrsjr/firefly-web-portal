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
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>(
    {},
  );
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [submittingAction, setSubmittingAction] = useState<
    "draft" | "create" | "send" | null
  >(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const activeError = localError || externalError;

  // Track the most recently typed customer query so we can match and auto-select it after refresh
  const [lastTypedCustomerQuery, setLastTypedCustomerQuery] = useState("");

  // Refs to track if user explicitly clicked creation/add actions
  const isCreatingCustomerRef = useRef(false);
  const isCreatingContactRef = useRef(false);
  // Ref to track if the user intentionally cleared/dismissed the contact selection
  const userClearedContactRef = useRef(false);

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

  const loadCustomerDetails = useCallback(
    async (customerId: number, overrideContactId?: number) => {
      if (!customerId) return;
      try {
        const res = await api.get<Customer>(`/customers/${customerId}`);
        const fullCustomer = res.data;

        if (
          fullCustomer &&
          fullCustomer.contacts &&
          fullCustomer.contacts.length > 0
        ) {
          // If the user intentionally cleared the contact, don't auto-select primary or new contacts
          if (userClearedContactRef.current) {
            setSelectedContactId(0);
            setContactNameSnapshot("");
            setContactEmailSnapshot("");
            setContactSearchQuery("");
            return;
          }

          // Check if we have an explicit override or an existing selection
          const targetContactId =
            overrideContactId !== undefined
              ? overrideContactId
              : selectedContactId;

          if (targetContactId > 0) {
            const currentContact = fullCustomer.contacts.find(
              (c) => c.contactId === targetContactId,
            );
            if (currentContact) {
              setSelectedContactId(currentContact.contactId ?? 0);
              setContactNameSnapshot(currentContact.name || "");
              setContactEmailSnapshot(currentContact.email || "");
              setContactSearchQuery(currentContact.name || "");
              return;
            }
          }

          // If the user was actively creating a new contact, pick the newest one by ID
          if (isCreatingContactRef.current) {
            const newestContact = [...fullCustomer.contacts].sort(
              (a, b) => (b.contactId ?? 0) - (a.contactId ?? 0),
            )[0];
            if (newestContact) {
              setSelectedContactId(newestContact.contactId ?? 0);
              setContactNameSnapshot(newestContact.name || "");
              setContactEmailSnapshot(newestContact.email || "");
              setContactSearchQuery(newestContact.name || "");
              isCreatingContactRef.current = false;
              return;
            }
          }

          // Default fallback: primary contact or first contact
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
        toast.error(
          getErrorMessage(err, "Failed to reload customer contacts."),
        );
      }
    },
    [selectedContactId],
  );

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

        if (
          isCreatingCustomerRef.current &&
          freshCustomers &&
          freshCustomers.length > 0
        ) {
          let matched: Customer | undefined;

          if (lastTypedCustomerQuery.trim()) {
            const queryLower = lastTypedCustomerQuery.trim().toLowerCase();
            matched = freshCustomers.find(
              (c) => c.companyName.trim().toLowerCase() === queryLower,
            );
          }

          if (!matched) {
            matched = [...freshCustomers].sort(
              (a, b) => b.customerId - a.customerId,
            )[0];
          }

          if (matched) {
            setSelectedCustomerId(matched.customerId);
            setCustomerSearchQuery(matched.companyName);
            userClearedContactRef.current = false;
            await loadCustomerDetails(matched.customerId);
            toast.success(
              `Successfully selected customer: ${matched.companyName}`,
            );
          }
          isCreatingCustomerRef.current = false;
        } else if (selectedCustomerId > 0) {
          isCreatingContactRef.current = true;
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

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    items.forEach((_, idx) => {
      adjustTextareaHeight(textareaRefs.current[idx]);
    });
    adjustTextareaHeight(notesTextareaRef.current);
  }, [items, notes]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomerId(customer.customerId);
    setCustomerSearchQuery(customer.companyName);
    setIsCustomerSearchOpen(false);
    userClearedContactRef.current = false;
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
    userClearedContactRef.current = false;
    setIsContactSearchOpen(false);
  };

  const allAvailableContacts = allCustomers.flatMap((cust) =>
    (cust.contacts || []).map((contact) => ({
      contact,
      customer: cust,
    })),
  );

  const filteredContacts = allAvailableContacts.filter(
    ({ contact, customer }) => {
      const matchesSearch = contact.name
        .toLowerCase()
        .includes(contactSearchQuery.toLowerCase());

      if (selectedCustomerId > 0) {
        return matchesSearch && customer.customerId === selectedCustomerId;
      }

      return matchesSearch;
    },
  );

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemDto,
    value: string | number | null,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);

    if (field === "description") {
      adjustTextareaHeight(textareaRefs.current[index]);
    }
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

    setTimeout(() => adjustTextareaHeight(textareaRefs.current[index]), 0);
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

    setTimeout(() => adjustTextareaHeight(textareaRefs.current[index]), 0);
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

    if (!selectedContactId) {
      setLocalError("Please select a valid contact person.");
      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.productId &&
        (!item.description || item.description.trim() === ""),
    );

    if (hasInvalidItem) {
      setLocalError(
        "Each item must have either a selected Product or a Description entered.",
      );
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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-7xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Create New Quotation
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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

          <form
            id="create-quotation-form"
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
            ref={searchRef}
          >
            {activeError && (
              <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3 rounded-xl flex items-center gap-3 text-xs shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{activeError}</span>
              </div>
            )}

            <div className="lg:col-span-10 space-y-3">
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  Proposal & Customer Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Customer <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsCustomerSearchOpen(!isCustomerSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
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
                          className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
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
                                className="px-3.5 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      VAT Computation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={vatType}
                      onChange={(e) => setVatType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="Exclusive">VAT Exclusive (12%)</option>
                      <option value="Inclusive">VAT Inclusive (12%)</option>
                      <option value="ZeroRated">VAT Exempt / Zero-Rated</option>
                    </select>
                  </div>

                  <div className="space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Contact Person <span className="text-rose-500">*</span>
                      </label>
                      {selectedCustomerId > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            isCreatingContactRef.current = true;
                            userClearedContactRef.current = false;
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        required
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
                            userClearedContactRef.current = true;
                            isCreatingContactRef.current = false;
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIsContactSearchOpen(!isContactSearchOpen)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
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
                                  className="px-3.5 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        value={contactEmailSnapshot}
                        disabled
                        placeholder="No email provided"
                        className="w-full border rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 cursor-not-allowed border-slate-200 dark:border-slate-700 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Single Unified Card for Line Items & Products Table */}
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Line Items & Products
                    </h3>
                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-visible shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-215">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 w-10 text-center">#</th>
                        <th className="py-2 px-2.5 w-[20%]">Product</th>
                        <th className="py-2 px-2.5 w-[15%]">Variant</th>
                        <th className="py-2 px-2.5 w-[23%]">
                          Description / Inclusions
                        </th>
                        <th className="py-2 px-2.5 w-[12%] text-center">Qty</th>
                        <th className="py-2 px-2.5 w-[14%] text-right">
                          Price (₱)
                        </th>
                        <th className="py-2 px-2.5 w-[12%] text-right">
                          Line Total
                        </th>
                        <th className="py-2 px-2.5 w-20 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((item, idx) => {
                        const prodQuery = productSearchQueries[idx] || "";
                        const variantQuery = variantSearchQueries[idx] || "";
                        const selectedProd = selectedProducts[idx];

                        const filteredProducts = products.filter((p) => {
                          const matchesQuery = p.name
                            .toLowerCase()
                            .includes(prodQuery.toLowerCase());
                          return matchesQuery && p.isActive === true;
                        });

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
                          <tr
                            key={idx}
                            className="even:bg-slate-50/40 dark:even:bg-slate-800/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors align-top"
                          >
                            <td className="py-2.5 px-2.5 text-center">
                              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center text-[10px] font-bold mt-1">
                                {idx + 1}
                              </span>
                            </td>

                            {/* Product Cell */}
                            <td className="py-2 px-2.5 relative overflow-visible">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
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
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                                />

                                {activeProductSearchIndex === idx && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                    <div
                                      onClick={() => {
                                        setQuickProductTargetIndex(idx);
                                        setIsQuickProductModalOpen(true);
                                        setActiveProductSearchIndex(null);
                                      }}
                                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-2 border-b border-slate-200 shrink-0"
                                    >
                                      <PackagePlus className="w-3.5 h-3.5 text-slate-600" />
                                      <span>+ Add New Product</span>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredProducts.length > 0 ? (
                                        filteredProducts.map((p) => (
                                          <div
                                            key={p.productId}
                                            onClick={() =>
                                              handleSelectProduct(idx, p)
                                            }
                                            className="px-3.5 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-none"
                                          >
                                            <span className="font-medium text-slate-800 dark:text-slate-200">
                                              {p.name}
                                            </span>
                                            <ChevronRight className="w-3 h-3 text-slate-400" />
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-3 py-2 text-xs text-slate-400 text-center">
                                          No products found
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Variant Cell */}
                            <td className="py-2 px-2.5 relative overflow-visible">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder={
                                    selectedProd
                                      ? "Select variant..."
                                      : "Product first"
                                  }
                                  disabled={!selectedProd}
                                  value={variantQuery}
                                  onFocus={() =>
                                    setActiveVariantSearchIndex(idx)
                                  }
                                  onChange={(e) => {
                                    setVariantSearchQueries({
                                      ...variantSearchQueries,
                                      [idx]: e.target.value,
                                    });
                                    setActiveVariantSearchIndex(idx);
                                  }}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all disabled:opacity-50 shadow-2xs"
                                />

                                {activeVariantSearchIndex === idx &&
                                  selectedProd && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                      <div
                                        onClick={() => {
                                          setVariantModalTargetIndex(idx);
                                          setTargetProductForVariants(
                                            selectedProd,
                                          );
                                          setIsVariantModalOpen(true);
                                          setActiveVariantSearchIndex(null);
                                        }}
                                        className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-2 border-b shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                                        <span>+ Add Variant</span>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto">
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
                                          className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-100 cursor-pointer border-b italic"
                                        >
                                          — None —
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
                                                  handleSelectVariant(
                                                    idx,
                                                    variant,
                                                  )
                                                }
                                                className="px-3.5 py-2 text-xs hover:bg-slate-100 cursor-pointer flex items-center justify-between border-b last:border-none"
                                              >
                                                <span className="font-medium text-slate-800">
                                                  {vLabel || "Standard Variant"}
                                                </span>
                                                <span className="font-mono text-slate-600">
                                                  {currency(variant.unitPrice)}
                                                </span>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="px-3 py-2 text-xs text-center text-slate-400">
                                            No variants found
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </td>

                            {/* Description / Inclusions Cell (Auto-expanding Multiline) */}
                            <td className="py-2 px-2.5">
                              <textarea
                                rows={1}
                                ref={(el) => {
                                  textareaRefs.current[idx] = el;
                                }}
                                placeholder="Description..."
                                value={item.description}
                                onInput={(e) =>
                                  adjustTextareaHeight(
                                    e.currentTarget as HTMLTextAreaElement,
                                  )
                                }
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs resize-none overflow-y-auto max-h-24 leading-relaxed"
                              />
                            </td>

                            {/* Quantity Cell */}
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "quantity",
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                              />
                            </td>

                            {/* Unit Price Cell */}
                            <td className="py-2 px-2.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "unitPrice",
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 text-right font-mono focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                              />
                            </td>

                            {/* Line Total Cell */}
                            <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                              {currency(rowTotal)}
                            </td>

                            {/* Actions Cell */}
                            <td className="py-2 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => duplicateItemRow(idx)}
                                  className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                  title="Duplicate Item"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItemRow(idx)}
                                  className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-500 rounded-md transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                  Note to Customer
                </label>
                <textarea
                  rows={1}
                  ref={notesTextareaRef}
                  placeholder="Payment instructions, bank details, or delivery terms..."
                  value={notes}
                  onInput={(e) =>
                    adjustTextareaHeight(e.currentTarget as HTMLTextAreaElement)
                  }
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none overflow-y-auto max-h-24 transition-all shadow-2xs leading-relaxed"
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Summary
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px]">Subtotal</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-slate-100">
                      {currency(calculatedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px]">VAT</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-slate-100">
                      {currency(calculatedVat)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase">
                      Total
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {currency(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Validity
                  </label>
                </div>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                  Valid until{" "}
                  {validUntilDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("create")}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {saving && submittingAction === "create"
                    ? "Creating..."
                    : "Create"}
                </button>

                {onSubmitAndSend && (
                  <button
                    form="create-quotation-form"
                    type="submit"
                    onClick={() => setSubmittingAction("send")}
                    disabled={saving}
                    className="w-full group inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    {saving && submittingAction === "send"
                      ? "Sending..."
                      : "Save & Send"}
                  </button>
                )}

                <button
                  form="create-quotation-form"
                  type="submit"
                  onClick={() => setSubmittingAction("draft")}
                  disabled={saving}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {saving && submittingAction === "draft"
                    ? "Saving..."
                    : "Save Draft"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

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
