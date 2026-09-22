import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import type {
  QuotationResponseDto,
  QuotationItemDto,
  QuotationItemResponseDto,
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
  AlertCircle,
  Calculator,
  PackagePlus,
  RefreshCw,
  Copy,
  Calendar,
  ChevronDown,
  Building2,
  Mail,
} from "lucide-react";
import { CreateProductModal } from "../products/CreateProductModal";
import { ProductVariantsModal } from "../products/ProductVariantsModal";
import axios from "axios";
import toast from "react-hot-toast";

interface EditQuotationModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onSuccess: () => void;
  onTriggerAddCustomer?: () => void;
  onTriggerAddContact?: (customer: Customer) => void;
  refreshTrigger?: number;
}

interface QuotationFullDetail extends QuotationResponseDto {
  customerId?: number;
  contactId?: number | null;
  validUntil?: string;
  vatType?: string;
  VATType?: string;
  noteToCustomer?: string | null;
  items: QuotationItemResponseDto[];
}

interface EditableLineItem extends QuotationItemDto {
  productId?: number | null;
  productVariantId: number | null;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  quotation,
  onClose,
  onSuccess,
  onTriggerAddCustomer,
  onTriggerAddContact,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [contactId, setContactId] = useState<number>(0);

  // Search states for Customer and Contact Person
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);

  const [vatType, setVatType] = useState<string>("Exclusive");
  const [validUntil, setValidUntil] = useState<string>("");
  const [noteToCustomer, setNoteToCustomer] = useState("");
  const [contactNameSnapshot, setContactNameSnapshot] = useState("");
  const [contactEmailSnapshot, setContactEmailSnapshot] = useState("");

  const [items, setItems] = useState<EditableLineItem[]>([]);
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
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    async (targetCustomerId: number, loadedCustList?: Customer[]) => {
      if (!targetCustomerId) return;
      try {
        const custs = loadedCustList || allCustomers;
        const found = custs.find((c) => c.customerId === targetCustomerId);
        if (found) {
          setCustomerSearchQuery(found.companyName || "");
        }

        const res = await api.get<Customer>(`/customers/${targetCustomerId}`);
        const fullCustomer = res.data;

        if (
          fullCustomer &&
          fullCustomer.contacts &&
          fullCustomer.contacts.length > 0
        ) {
          const primaryContact =
            fullCustomer.contacts.find((c) => c.isPrimary) ||
            fullCustomer.contacts[0];
          if (primaryContact && !contactId) {
            setContactId(primaryContact.contactId ?? 0);
            setContactNameSnapshot(primaryContact.name || "");
            setContactEmailSnapshot(primaryContact.email || "");
            setContactSearchQuery(primaryContact.name || "");
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load customer details", err);
      }
    },
    [allCustomers, contactId],
  );

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoadingDetails(true);
        setError(null);

        const [loadedCustomers, loadedProducts, detailRes] = await Promise.all([
          fetchAllCustomers(),
          fetchProducts(),
          api.get<QuotationFullDetail>(`/quotations/${quotation.quotationId}`),
        ]);

        const detail = detailRes.data;
        if (detail) {
          const resolvedCustId = detail.customerId || quotation.companyId || 0;
          setCustomerId(resolvedCustId);
          setContactId(detail.contactId ?? 0);
          setContactNameSnapshot(detail.contactNameSnapshot || "");
          setContactEmailSnapshot(detail.contactEmailSnapshot || "");
          setContactSearchQuery(detail.contactNameSnapshot || "");

          if (detail.validUntil) {
            setValidUntil(detail.validUntil.split("T")[0]);
          } else {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            setValidUntil(defaultDate.toISOString().split("T")[0]);
          }

          setVatType(detail.vatType || detail.VATType || "Exclusive");
          setNoteToCustomer(detail.noteToCustomer || "");

          const rawItems =
            detail.items?.length > 0 ? detail.items : quotation.items;

          const initialSelectedProducts: { [key: number]: Product | null } = {};
          const initialProductQueries: { [key: number]: string } = {};
          const initialVariantQueries: { [key: number]: string } = {};

          const mappedItems: EditableLineItem[] = await Promise.all(
            (rawItems || []).map(async (i, index) => {
              let matchedProductId: number | null = null;
              const matchedVariantId: number | null = i.productVariantId
                ? Number(i.productVariantId)
                : null;
              let foundProduct: Product | null = null;

              if (matchedVariantId) {
                const parentProd = loadedProducts.find((p) =>
                  p.variants?.some(
                    (v) => Number(v.productVariantId) === matchedVariantId,
                  ),
                );
                if (parentProd) {
                  matchedProductId = parentProd.productId;
                  foundProduct = parentProd;
                }
              }

              if (!foundProduct && i.productName) {
                const foundProd = loadedProducts.find(
                  (p) =>
                    p.name.trim().toLowerCase() ===
                    i.productName?.trim().toLowerCase(),
                );
                if (foundProd) {
                  matchedProductId = foundProd.productId;
                  foundProduct = foundProd;
                }
              }

              if (matchedProductId) {
                try {
                  const prodRes = await api.get<Product>(
                    `/products/${matchedProductId}`,
                  );
                  foundProduct = prodRes.data;
                } catch {
                  // Fallback
                }
              }

              if (foundProduct) {
                initialSelectedProducts[index] = foundProduct;
                initialProductQueries[index] = foundProduct.name;
              }

              if (matchedVariantId && foundProduct) {
                const matchedVar = foundProduct.variants?.find(
                  (v) => Number(v.productVariantId) === matchedVariantId,
                );
                if (matchedVar) {
                  const vLabel = formatVariantLabel(
                    matchedVar.color,
                    matchedVar.size,
                  );
                  const skuLabel =
                    matchedVar.sku && matchedVar.sku.trim() !== ""
                      ? ` - SKU: ${matchedVar.sku}`
                      : "";
                  initialVariantQueries[index] = `${
                    vLabel || "Standard Variant"
                  }${skuLabel}`;
                }
              }

              return {
                productId: matchedProductId,
                productVariantId: matchedVariantId ?? null,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              };
            }),
          );

          setSelectedProducts(initialSelectedProducts);
          setProductSearchQueries(initialProductQueries);
          setVariantSearchQueries(initialVariantQueries);
          setItems(
            mappedItems.length > 0
              ? mappedItems
              : [
                  {
                    productId: null,
                    productVariantId: null,
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                  },
                ],
          );

          await loadCustomerDetails(resolvedCustId, loadedCustomers);
        }
      } catch (err) {
        console.error("Failed to load quotation record", err);
        setError("Failed to load quotation details from server.");
      } finally {
        setLoadingDetails(false);
      }
    };

    void fetchQuotationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation.quotationId]);

  useEffect(() => {
    let isMounted = true;

    if (refreshTrigger > 0) {
      const reloadData = async () => {
        const freshCusts = await fetchAllCustomers();
        if (customerId > 0) {
          await loadCustomerDetails(customerId, freshCusts);
        }
        if (!isMounted) return;
      };

      void reloadData();
    }

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, customerId, loadCustomerDetails, fetchAllCustomers]);

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
    setCustomerId(customer.customerId);
    setCustomerSearchQuery(customer.companyName);
    setIsCustomerSearchOpen(false);
    await loadCustomerDetails(customer.customerId);
  };

  const handleSelectContactByPerson = (
    contact: CustomerContact,
    parentCustomer: Customer,
  ) => {
    setCustomerId(parentCustomer.customerId);
    setCustomerSearchQuery(parentCustomer.companyName);
    setContactId(contact.contactId ?? 0);
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
    field: keyof EditableLineItem,
    value: string | number | null,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSelectProduct = async (index: number, product: Product) => {
    try {
      const res = await api.get<Product>(`/products/${product.productId}`);
      const fullProduct = res.data;

      const updatedProducts = { ...selectedProducts, [index]: fullProduct };
      setSelectedProducts(updatedProducts);
      setActiveProductSearchIndex(null);
      setProductSearchQueries({
        ...productSearchQueries,
        [index]: fullProduct.name,
      });

      const updated = [...items];
      updated[index] = {
        ...updated[index],
        productId: fullProduct.productId,
        productVariantId: null,
        description: fullProduct.description || fullProduct.name,
      };
      setItems(updated);

      setVariantSearchQueries({
        ...variantSearchQueries,
        [index]: "",
      });

      setActiveVariantSearchIndex(index);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load product variants."));

      const updatedProducts = { ...selectedProducts, [index]: product };
      setSelectedProducts(updatedProducts);
      setActiveProductSearchIndex(null);
      setProductSearchQueries({
        ...productSearchQueries,
        [index]: product.name,
      });

      const updated = [...items];
      updated[index] = {
        ...updated[index],
        productId: product.productId,
        productVariantId: null,
        description: product.description || product.name,
      };
      setItems(updated);
      setActiveVariantSearchIndex(index);
    }
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
        const firstVariant = createdProd.variants?.[0];
        if (firstVariant) {
          handleSelectVariant(quickProductTargetIndex, firstVariant);
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

      if (refreshedProd) {
        setSelectedProducts((prev) => {
          const updatedMap = { ...prev };
          Object.keys(updatedMap).forEach((key) => {
            const indexKey = Number(key);
            if (updatedMap[indexKey]?.productId === productId) {
              updatedMap[indexKey] = refreshedProd;
            }
          });
          return updatedMap;
        });

        if (variantModalTargetIndex !== null) {
          const latestVariant =
            refreshedProd.variants[refreshedProd.variants.length - 1];
          if (latestVariant) {
            handleSelectVariant(variantModalTargetIndex, latestVariant);
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
      setError("Quotation must have at least one item.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (!validUntil) {
      setError("Please specify a validity date.");
      return;
    }
    if (items.some((i) => i.quantity <= 0 || i.unitPrice < 0)) {
      setError("Please ensure all items have a valid quantity and price.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        customerId,
        contactId: contactId > 0 ? contactId : null,
        contactNameSnapshot,
        contactEmailSnapshot: contactEmailSnapshot.trim(),
        validUntil: new Date(validUntil).toISOString(),
        vatType,
        noteToCustomer: noteToCustomer.trim() || undefined,
        items: items.map((i) => ({
          productId:
            !i.productId || i.productId === 0 ? null : Number(i.productId),
          productVariantId:
            !i.productVariantId || i.productVariantId === 0
              ? null
              : Number(i.productVariantId),
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      };

      await api.put(`/quotations/${quotation.quotationId}`, payload);
      toast.success("Quotation updated successfully!");
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            "Failed to update quotation.",
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        {/* Modal Shell with standardized rounded-xl (12px) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-500 overflow-hidden my-auto flex flex-col max-h-[95vh]">
          {/* Flat Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Edit Quotation #{quotation.quotationNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modify proposal parameters and itemized product selections
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingDetails ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
              <div className="w-5 h-5 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Loading quotation #{quotation.quotationNumber} details...
              </span>
            </div>
          ) : (
            <form
              id="edit-quotation-form"
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
              ref={searchRef}
            >
              {error && (
                <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl flex items-center gap-3 text-xs shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{error}</span>
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
                    {/* Customer Searchable Dropdown */}
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
                            setIsCustomerSearchOpen(true);
                            if (!e.target.value) {
                              setCustomerId(0);
                              setContactId(0);
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
                          {onTriggerAddCustomer && (
                            <div
                              onClick={() => {
                                setIsCustomerSearchOpen(false);
                                onTriggerAddCustomer();
                              }}
                              className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                            >
                              <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              <span>+ Add New Customer</span>
                            </div>
                          )}

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
                                  className="px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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

                    {/* VAT Computation */}
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
                        <option value="ZeroRated">
                          VAT Exempt / Zero-Rated
                        </option>
                      </select>
                    </div>

                    {/* Contact Person Field */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Contact Person
                        </label>
                        {customerId > 0 && onTriggerAddContact && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentCust = allCustomers.find(
                                (c) => c.customerId === customerId,
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
                              setContactId(0);
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
                                filteredContacts.map(
                                  ({ contact, customer }) => (
                                    <div
                                      key={contact.contactId}
                                      onClick={() =>
                                        handleSelectContactByPerson(
                                          contact,
                                          customer,
                                        )
                                      }
                                      className="px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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
                                  ),
                                )
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

                    {/* Contact Email */}
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
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
                              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
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
                                    setActiveVariantSearchIndex(null);
                                    setIsCustomerSearchOpen(false);
                                    setIsContactSearchOpen(false);
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
                                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
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
                                          className="px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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
                                  onFocus={() => {
                                    setActiveVariantSearchIndex(idx);
                                    setActiveProductSearchIndex(null);
                                    setIsCustomerSearchOpen(false);
                                    setIsContactSearchOpen(false);
                                  }}
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
                                        setTargetProductForVariants(
                                          selectedProd,
                                        );
                                        setIsVariantModalOpen(true);
                                        setActiveVariantSearchIndex(null);
                                      }}
                                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
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
                                        className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 italic"
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
                                                handleSelectVariant(
                                                  idx,
                                                  variant,
                                                )
                                              }
                                              className="px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-none"
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
                    value={noteToCustomer}
                    onChange={(e) => setNoteToCustomer(e.target.value)}
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
                      {/* Standard dark text for total price instead of accent color */}
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
                      Valid Until Date
                    </label>
                  </div>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
                  />
                </div>

                {/* Stacked Primary Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    form="edit-quotation-form"
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Calculator className="w-4 h-4" />
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
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
