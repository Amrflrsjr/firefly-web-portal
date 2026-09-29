import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import type {
  QuotationResponseDto,
  QuotationItemDto,
  QuotationItemResponseDto,
  CreateQuotationDto,
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
  AlertCircle,
  Calculator,
  Copy,
  Calendar,
  Building2,
  Mail,
  PackagePlus,
} from "lucide-react";
import { CreateProductModal } from "../products/CreateProductModal";
import { ProductVariantsModal } from "../products/ProductVariantsModal";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import axios from "axios";
import toast from "react-hot-toast";

interface EditQuotationModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onSuccess: () => void;
  onSubmitAndSend?: (dto: CreateQuotationDto) => void;
  onTriggerAddCustomer?: () => void;
  onTriggerAddContact?: (customer: Customer) => void;
  refreshTrigger?: number;
}

interface QuotationFullDetail extends Omit<QuotationResponseDto, "validUntil"> {
  customerId?: number;
  contactId?: number | null;
  validUntil: string;
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

const formatVariantLabel = (color?: string, size?: string) => {
  const parts = [color, size].filter((p) => p && p.trim() !== "");
  return parts.length > 0 ? parts.join(" / ") : "";
};

const variantKey = (v: ProductVariant, index: number) =>
  v.productVariantId ?? `variant-${index}`;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  quotation,
  onClose,
  onSuccess,
  onSubmitAndSend,
  onTriggerAddCustomer,
  onTriggerAddContact,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedContactId, setSelectedContactId] = useState<number>(0);

  // Which header dropdown (Customer / Contact Person) is open
  const [openHeaderField, setOpenHeaderField] = useState<
    "customer" | "contact" | null
  >(null);

  const [vatType, setVatType] = useState<string>("Exclusive");
  const [validityDays, setValidityDays] = useState<number>(7);
  const [validUntil, setValidUntil] = useState<string>("");
  const [noteToCustomer, setNoteToCustomer] = useState("");
  const [contactNameSnapshot, setContactNameSnapshot] = useState("");
  const [contactEmailSnapshot, setContactEmailSnapshot] = useState("");

  const [items, setItems] = useState<EditableLineItem[]>([]);

  // Which line-item dropdown is open (only one at a time)
  const [openDropdown, setOpenDropdown] = useState<{
    index: number;
    kind: "product" | "variant";
  } | null>(null);

  const isDesktop = useMediaQuery("(min-width: 640px)");

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

  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>(
    {},
  );
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [submittingAction, setSubmittingAction] = useState<
    "save" | "draft" | "send" | null
  >(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastTypedCustomerQueryRef = useRef("");
  const isCreatingCustomerRef = useRef(false);
  const isCreatingContactRef = useRef(false);
  const userClearedContactRef = useRef(false);

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
          if (userClearedContactRef.current) {
            setSelectedContactId(0);
            setContactNameSnapshot("");
            setContactEmailSnapshot("");
            return;
          }

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
              return;
            }
          }

          if (isCreatingContactRef.current) {
            const newestContact = [...fullCustomer.contacts].sort(
              (a, b) => (b.contactId ?? 0) - (a.contactId ?? 0),
            )[0];
            if (newestContact) {
              setSelectedContactId(newestContact.contactId ?? 0);
              setContactNameSnapshot(newestContact.name || "");
              setContactEmailSnapshot(newestContact.email || "");
              isCreatingContactRef.current = false;
              return;
            }
          }

          const primaryContact =
            fullCustomer.contacts.find((c) => c.isPrimary) ||
            fullCustomer.contacts[0];
          if (primaryContact) {
            setSelectedContactId(primaryContact.contactId ?? 0);
            setContactNameSnapshot(primaryContact.name || "");
            setContactEmailSnapshot(primaryContact.email || "");
          }
        } else {
          setSelectedContactId(0);
          setContactNameSnapshot(fullCustomer?.companyName || "");
          setContactEmailSnapshot("");
        }
      } catch (err: unknown) {
        console.error("Failed to load customer details", err);
      }
    },
    [selectedContactId],
  );

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
  }, [items, noteToCustomer, isDesktop]);

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoadingDetails(true);
        setError(null);

        const [, loadedProducts, detailRes] = await Promise.all([
          fetchAllCustomers(),
          fetchProducts(),
          api.get<QuotationFullDetail>(`/quotations/${quotation.quotationId}`),
        ]);

        const detail = detailRes.data;
        if (detail) {
          const resolvedCustId = detail.customerId || quotation.companyId || 0;
          setSelectedCustomerId(resolvedCustId);
          setSelectedContactId(detail.contactId ?? 0);
          setContactNameSnapshot(detail.contactNameSnapshot || "");
          setContactEmailSnapshot(detail.contactEmailSnapshot || "");

          if (detail.validUntil) {
            const parsedDate = new Date(detail.validUntil);
            setValidUntil(parsedDate.toISOString().split("T")[0]);

            const diffTime = parsedDate.getTime() - new Date().getTime();
            const diffDays = Math.max(
              7,
              Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
            );
            if ([7, 14, 30, 60].includes(diffDays)) {
              setValidityDays(diffDays);
            }
          }

          setVatType(detail.vatType || detail.VATType || "Exclusive");
          setNoteToCustomer(detail.noteToCustomer || "");

          const rawItems =
            detail.items?.length > 0 ? detail.items : quotation.items;

          const mappedItems: EditableLineItem[] = (rawItems || []).map((i) => {
            let matchedProductId: number | null = null;
            const matchedVariantId: number | null = i.productVariantId
              ? Number(i.productVariantId)
              : null;

            if (matchedVariantId) {
              const parentProd = loadedProducts.find((p) =>
                p.variants?.some(
                  (v) => Number(v.productVariantId) === matchedVariantId,
                ),
              );
              if (parentProd) {
                matchedProductId = parentProd.productId ?? null;
              }
            }

            if (!matchedProductId && i.productName) {
              const foundProd = loadedProducts.find(
                (p) =>
                  p.name.trim().toLowerCase() ===
                  i.productName?.trim().toLowerCase(),
              );
              if (foundProd) {
                matchedProductId = foundProd.productId ?? null;
              }
            }

            return {
              productId: matchedProductId,
              productVariantId: matchedVariantId ?? null,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            };
          });

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

          await loadCustomerDetails(resolvedCustId);
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
        const freshCustomers = await fetchAllCustomers();
        if (!isMounted) return;

        if (
          isCreatingCustomerRef.current &&
          freshCustomers &&
          freshCustomers.length > 0
        ) {
          let matched: Customer | undefined;

          if (lastTypedCustomerQueryRef.current.trim()) {
            const queryLower = lastTypedCustomerQueryRef.current
              .trim()
              .toLowerCase();
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
    loadCustomerDetails,
    fetchAllCustomers,
  ]);

  const selectedCustomer =
    allCustomers.find((c) => c.customerId === selectedCustomerId) ?? null;

  const handleSelectCustomer = async (customer: Customer | null) => {
    setOpenHeaderField(null);
    if (!customer) {
      setSelectedCustomerId(0);
      setSelectedContactId(0);
      setContactNameSnapshot("");
      setContactEmailSnapshot("");
      return;
    }
    setSelectedCustomerId(customer.customerId);
    userClearedContactRef.current = false;
    await loadCustomerDetails(customer.customerId);
  };

  type ContactEntry = { contact: CustomerContact; customer: Customer };

  const contactKey = (contact: CustomerContact, customer: Customer) =>
    contact.contactId ?? `${customer.customerId}-${contact.name}`;

  const handleSelectContact = (entry: ContactEntry | null) => {
    setOpenHeaderField(null);
    if (!entry) {
      setSelectedContactId(0);
      setContactNameSnapshot("");
      setContactEmailSnapshot("");
      userClearedContactRef.current = true;
      isCreatingContactRef.current = false;
      return;
    }
    const { contact, customer } = entry;
    setSelectedCustomerId(customer.customerId);
    setSelectedContactId(contact.contactId ?? 0);
    setContactNameSnapshot(contact.name || "");
    setContactEmailSnapshot(contact.email || "");
    userClearedContactRef.current = false;
  };

  const availableContacts: ContactEntry[] = allCustomers
    .filter(
      (c) => selectedCustomerId <= 0 || c.customerId === selectedCustomerId,
    )
    .flatMap((customer) =>
      (customer.contacts || []).map((contact) => ({ contact, customer })),
    );

  const customerOptions: SelectOption[] = allCustomers.map((c) => ({
    id: c.customerId,
    label: c.companyName,
    searchText: [
      c.companyName,
      ...(c.contacts ?? []).map((ct) => ct.name),
    ].join(" "),
  }));

  const contactOptions: SelectOption[] = availableContacts.map(
    ({ contact, customer }) => ({
      id: contactKey(contact, customer),
      label: contact.name,
      description: `Company: ${customer.companyName}`,
      searchText: `${contact.name} ${customer.companyName} ${contact.email ?? ""}`,
    }),
  );

  const handleItemChange = (
    index: number,
    field: keyof EditableLineItem,
    value: string | number | null,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);

    if (field === "description") {
      adjustTextareaHeight(textareaRefs.current[index]);
    }
  };

  const findProduct = (productId?: number | null): Product | null =>
    productId
      ? (products.find((p) => p.productId === productId) ?? null)
      : null;

  const updateItem = (index: number, patch: Partial<EditableLineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const resizeDescription = (index: number) => {
    setTimeout(() => adjustTextareaHeight(textareaRefs.current[index]), 0);
  };

  const applyVariant = (
    index: number,
    product: Product | null,
    variant: ProductVariant,
  ) => {
    const variantLabel = formatVariantLabel(variant.color, variant.size);
    const description = [
      product?.name ?? "",
      variantLabel ? `(${variantLabel})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    updateItem(index, {
      productId: product?.productId ?? items[index]?.productId ?? null,
      productVariantId: variant.productVariantId ?? null,
      description: description || "Standard Item",
      unitPrice: variant.unitPrice,
    });
    resizeDescription(index);
  };

  const handleProductSelect = (index: number, product: Product | null) => {
    if (!product) {
      updateItem(index, { productId: null, productVariantId: null });
      setOpenDropdown(null);
      return;
    }

    updateItem(index, {
      productId: product.productId ?? null,
      productVariantId: null,
      description: product.description || product.name,
    });
    resizeDescription(index);
    setOpenDropdown(null);
  };

  const handleVariantSelect = (
    index: number,
    variant: ProductVariant | null,
  ) => {
    if (!variant) {
      updateItem(index, { productVariantId: null });
    } else {
      applyVariant(index, findProduct(items[index]?.productId), variant);
    }
    setOpenDropdown(null);
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
        handleProductSelect(quickProductTargetIndex, createdProd);
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
        const latestVariant = (refreshedProd.variants ?? []).reduce<
          ProductVariant | undefined
        >(
          (latest, v) =>
            !latest ||
            (v.productVariantId ?? 0) >= (latest.productVariantId ?? 0)
              ? v
              : latest,
          undefined,
        );
        if (latestVariant) {
          applyVariant(variantModalTargetIndex, refreshedProd, latestVariant);
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
    setItems((prev) => [
      ...prev,
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
    setOpenDropdown(null);
    setItems((prev) => [
      ...prev.slice(0, index + 1),
      { ...prev[index] },
      ...prev.slice(index + 1),
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      setError("Quotation must have at least one item.");
      return;
    }
    setOpenDropdown(null);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const activeProducts = products.filter((p) => p.isActive === true);

  const productOptions: SelectOption[] = activeProducts.map((p) => {
    const variantCount = p.variants?.length ?? 0;
    const showDescription =
      !!p.description && p.description.trim() !== p.name.trim();
    const detail = [
      showDescription ? p.description : "",
      variantCount > 0
        ? `${variantCount} ${variantCount === 1 ? "variant" : "variants"}`
        : "",
    ]
      .filter(Boolean)
      .join("  |  ");

    return {
      id: p.productId ?? p.name,
      label: p.name,
      description: detail || undefined,
      searchText: p.name,
    };
  });

  const getVariantOptions = (product: Product | null): SelectOption[] =>
    (product?.variants ?? []).map((v, i) => {
      const label = formatVariantLabel(v.color, v.size);
      return {
        id: variantKey(v, i),
        label: label || "Standard Variant",
        description: v.sku ? `SKU: ${v.sku}` : undefined,
        meta: currency(v.unitPrice),
        searchText: `${label} ${v.sku ?? ""}`,
      };
    });

  const renderProductSelect = (idx: number) => {
    const selectedProd = findProduct(items[idx]?.productId);

    return (
      <SearchableSelect
        open={openDropdown?.index === idx && openDropdown.kind === "product"}
        onOpen={() => {
          void fetchProducts();
          setOpenDropdown({ index: idx, kind: "product" });
        }}
        onClose={() => setOpenDropdown(null)}
        options={productOptions}
        selectedId={
          selectedProd ? (selectedProd.productId ?? selectedProd.name) : null
        }
        valueLabel={selectedProd?.name ?? ""}
        placeholder="Select product..."
        noneLabel="— None (Custom Item) —"
        searchPlaceholder="Search products by name..."
        emptyText="No products found"
        ariaLabel={`Product for line item ${idx + 1}`}
        onSelect={(id: string | number | null) =>
          handleProductSelect(
            idx,
            id === null
              ? null
              : (activeProducts.find((p) => (p.productId ?? p.name) === id) ??
                  null),
          )
        }
        footerAction={{
          label: "Add new product",
          icon: <PackagePlus className="h-3.5 w-3.5" />,
          onClick: () => {
            setQuickProductTargetIndex(idx);
            setOpenDropdown(null);
            setIsQuickProductModalOpen(true);
          },
        }}
      />
    );
  };

  const renderVariantSelect = (idx: number) => {
    const product = findProduct(items[idx]?.productId);
    const variants = product?.variants ?? [];
    const selectedVariantId = items[idx]?.productVariantId ?? null;
    const selectedVariant =
      selectedVariantId == null
        ? undefined
        : variants.find((v) => v.productVariantId === selectedVariantId);

    return (
      <SearchableSelect
        open={openDropdown?.index === idx && openDropdown.kind === "variant"}
        onOpen={() => setOpenDropdown({ index: idx, kind: "variant" })}
        onClose={() => setOpenDropdown(null)}
        disabled={!product}
        options={getVariantOptions(product)}
        selectedId={
          selectedVariant ? (selectedVariant.productVariantId ?? null) : null
        }
        valueLabel={
          selectedVariant
            ? formatVariantLabel(selectedVariant.color, selectedVariant.size) ||
              "Standard Variant"
            : ""
        }
        placeholder={product ? "Select variant..." : "Product first"}
        noneLabel="— None / Standard Item —"
        searchPlaceholder="Search variants by name or SKU..."
        emptyText="No variants found"
        ariaLabel={`Variant for line item ${idx + 1}`}
        onSelect={(id: string | number | null) =>
          handleVariantSelect(
            idx,
            id === null
              ? null
              : (variants.find((v, i) => variantKey(v, i) === id) ?? null),
          )
        }
        footerAction={{
          label: "Add new variant",
          icon: <Plus className="h-3.5 w-3.5" />,
          onClick: () => {
            if (!product) return;
            setVariantModalTargetIndex(idx);
            setTargetProductForVariants(product);
            setIsVariantModalOpen(true);
            setOpenDropdown(null);
          },
        }}
      />
    );
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

  const computedValidUntilDate = new Date();
  computedValidUntilDate.setDate(
    computedValidUntilDate.getDate() + validityDays,
  );

  const buildDto = (statusOverride?: string): CreateQuotationDto => {
    const finalValidUntil =
      validityDays > 0
        ? computedValidUntilDate.toISOString()
        : new Date(validUntil).toISOString();

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
      validUntil: finalValidUntil,
      vatType,
      noteToCustomer: noteToCustomer.trim() || undefined,
      status: statusOverride,
      items: formattedItems,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }

    if (!selectedContactId) {
      setError("Please select a valid contact person.");
      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.productId &&
        (!item.description || item.description.trim() === ""),
    );

    if (hasInvalidItem) {
      setError(
        "Each item must have either a selected Product or a Description entered.",
      );
      return;
    }

    if (items.some((i) => i.quantity <= 0 || i.unitPrice < 0)) {
      setError("Please ensure all items have a valid quantity and price.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isDraft = submittingAction === "draft";
      const statusToSend = isDraft ? "Draft" : undefined;
      const dto = buildDto(statusToSend);

      if (submittingAction === "send" && onSubmitAndSend) {
        onSubmitAndSend(dto);
      } else {
        await api.put(`/quotations/${quotation.quotationId}`, dto);
        toast.success("Quotation updated successfully!");
        onSuccess();
      }
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
      setSubmittingAction(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-7xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Edit Quotation #{quotation.quotationNumber}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Modify proposal parameters and itemized product selections
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
              className="p-3 sm:p-4 overflow-y-auto overflow-x-visible flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
            >
              {error && (
                <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3 rounded-xl flex items-center gap-3 text-xs shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Main Column */}
              <div className="lg:col-span-10 space-y-3">
                {/* Proposal & Customer Details Card */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    Proposal & Customer Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Customer Selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Customer <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        open={openHeaderField === "customer"}
                        onOpen={() => {
                          lastTypedCustomerQueryRef.current = "";
                          setOpenHeaderField("customer");
                        }}
                        onClose={() => setOpenHeaderField(null)}
                        onSearchChange={(q: string) => {
                          lastTypedCustomerQueryRef.current = q;
                        }}
                        options={customerOptions}
                        selectedId={selectedCustomer?.customerId ?? null}
                        valueLabel={selectedCustomer?.companyName ?? ""}
                        placeholder="Search or select customer..."
                        noneLabel="— No customer —"
                        searchPlaceholder="Search customers..."
                        emptyText="No customers found"
                        ariaLabel="Customer"
                        onSelect={(id: string | number | null) =>
                          void handleSelectCustomer(
                            id === null
                              ? null
                              : (allCustomers.find(
                                  (c) => c.customerId === id,
                                ) ?? null),
                          )
                        }
                        footerAction={{
                          label: "Add new customer",
                          icon: <Building2 className="h-3.5 w-3.5" />,
                          onClick: () => {
                            isCreatingCustomerRef.current = true;
                            setOpenHeaderField(null);
                            if (onTriggerAddCustomer) onTriggerAddCustomer();
                          },
                        }}
                      />
                    </div>

                    {/* VAT Computation */}
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
                        <option value="ZeroRated">
                          VAT Exempt / Zero-Rated
                        </option>
                      </select>
                    </div>

                    {/* Contact Person */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Contact Person <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        open={openHeaderField === "contact"}
                        onOpen={() => setOpenHeaderField("contact")}
                        onClose={() => setOpenHeaderField(null)}
                        options={contactOptions}
                        selectedId={
                          selectedContactId > 0 ? selectedContactId : null
                        }
                        valueLabel={
                          selectedContactId > 0 ? contactNameSnapshot : ""
                        }
                        placeholder="Search or select contact person..."
                        noneLabel="— No contact —"
                        searchPlaceholder="Search contact person..."
                        emptyText="No contact persons found"
                        ariaLabel="Contact person"
                        onSelect={(id: string | number | null) =>
                          handleSelectContact(
                            id === null
                              ? null
                              : (availableContacts.find(
                                  ({ contact, customer }) =>
                                    contactKey(contact, customer) === id,
                                ) ?? null),
                          )
                        }
                        footerAction={
                          selectedCustomer
                            ? {
                                label: "Add new contact",
                                icon: <UserPlus className="h-3.5 w-3.5" />,
                                onClick: () => {
                                  isCreatingContactRef.current = true;
                                  userClearedContactRef.current = false;
                                  setOpenHeaderField(null);
                                  if (onTriggerAddContact) {
                                    onTriggerAddContact(selectedCustomer);
                                  } else {
                                    toast.error(
                                      "Add contact action is not available.",
                                    );
                                  }
                                },
                              }
                            : undefined
                        }
                      />
                    </div>

                    {/* Contact Email */}
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
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 overflow-visible">
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

                  {isDesktop ? (
                    /* Desktop View: Table Layout */
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse min-w-215">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2 px-2.5 w-10 text-center">#</th>
                            <th className="py-2 px-2.5 w-[20%]">Product</th>
                            <th className="py-2 px-2.5 w-[15%]">Variant</th>
                            <th className="py-2 px-2.5 w-[23%]">
                              Description / Inclusions
                            </th>
                            <th className="py-2 px-2.5 w-[12%] text-center">
                              Qty
                            </th>
                            <th className="py-2 px-2.5 w-[14%] text-right">
                              Price (₱)
                            </th>
                            <th className="py-2 px-2.5 w-[12%] text-right">
                              Line Total
                            </th>
                            <th className="py-2 px-2.5 w-20 text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {items.map((item, idx) => {
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

                                <td className="py-2 px-2.5">
                                  {renderProductSelect(idx)}
                                </td>

                                <td className="py-2 px-2.5">
                                  {renderVariantSelect(idx)}
                                </td>

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

                                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                                  {currency(rowTotal)}
                                </td>

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
                  ) : (
                    /* Mobile View: Stacked Cards */
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const rowTotal =
                          (Number(item.quantity) || 0) *
                          (Number(item.unitPrice) || 0);

                        return (
                          <div
                            key={`mobile-item-${idx}`}
                            className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateItemRow(idx)}
                                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
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
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Product
                              </label>
                              {renderProductSelect(idx)}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Variant
                              </label>
                              {renderVariantSelect(idx)}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Description / Inclusions
                              </label>
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs resize-none overflow-y-auto max-h-24 leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
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
                                      e.target.value === ""
                                        ? 0
                                        : Number(e.target.value),
                                    )
                                  }
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
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
                                      e.target.value === ""
                                        ? 0
                                        : parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 text-right font-mono focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                Line Total:
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {currency(rowTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                    Note to Customer
                  </label>
                  <textarea
                    rows={1}
                    ref={notesTextareaRef}
                    placeholder="Payment instructions, bank details, or delivery terms..."
                    value={noteToCustomer}
                    onInput={(e) =>
                      adjustTextareaHeight(
                        e.currentTarget as HTMLTextAreaElement,
                      )
                    }
                    onChange={(e) => setNoteToCustomer(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none overflow-y-auto max-h-24 transition-all shadow-2xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Sidebar */}
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
                    {computedValidUntilDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    form="edit-quotation-form"
                    type="submit"
                    onClick={() => setSubmittingAction("save")}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {saving && submittingAction === "save"
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                  {onSubmitAndSend && (
                    <button
                      form="edit-quotation-form"
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
                    form="edit-quotation-form"
                    type="submit"
                    onClick={() => setSubmittingAction("draft")}
                    disabled={saving}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {saving && submittingAction === "draft"
                      ? "Saving..."
                      : "Save as Draft"}
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
          )}
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
