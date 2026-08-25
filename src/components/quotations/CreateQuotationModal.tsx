import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import type {
  CreateQuotationDto,
  QuotationItemDto,
} from "../../types/quotation";
import type { Customer, CustomerContact } from "../../types/customer";
import type { Product, ProductVariant } from "../../types/product";
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
} from "lucide-react";

interface CreateQuotationModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateQuotationDto) => void;
  onSubmitAndSend?: (dto: CreateQuotationDto) => void;
  onTriggerAddContact: (customer: Customer) => void;
  refreshTrigger?: number;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  saving,
  error: externalError,
  onClose,
  onSubmit,
  onSubmitAndSend,
  onTriggerAddContact,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [availableContacts, setAvailableContacts] = useState<CustomerContact[]>(
    [],
  );
  const [selectedContactId, setSelectedContactId] = useState<number>(0);

  // Server-side customer search states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [vatType, setVatType] = useState<string>("Exclusive");
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

  const searchRef = useRef<HTMLFormElement>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "draft" | "create" | "send" | null
  >(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const activeError = localError || externalError;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setActiveProductSearchIndex(null);
        setActiveVariantSearchIndex(null);
        setIsCustomerSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced backend customer search effect
  useEffect(() => {
    const fetchSearchedCustomers = async () => {
      if (!customerSearchQuery.trim()) {
        setSearchedCustomers([]);
        return;
      }

      try {
        setIsSearchingCustomers(true);
        const response = await api.get<Customer[]>("/customers", {
          params: { search: customerSearchQuery },
        });
        setSearchedCustomers(response.data);
      } catch (err) {
        console.error("Failed to search customers", err);
      } finally {
        setIsSearchingCustomers(false);
      }
    };

    const timer = setTimeout(fetchSearchedCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const prodRes = await api.get<Product[]>("/products");

        if (!isSubscribed) return;

        setProducts(prodRes.data);
      } catch {
        // Ignore API errors gracefully
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [refreshTrigger, selectedCustomerId]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomerId(customer.customerId);
    setCustomerSearchQuery(customer.companyName);
    setIsCustomerSearchOpen(false);

    try {
      const res = await api.get<Customer>(`/customers/${customer.customerId}`);
      const fullCustomer = res.data;

      if (
        fullCustomer &&
        fullCustomer.contacts &&
        fullCustomer.contacts.length > 0
      ) {
        setAvailableContacts(fullCustomer.contacts);

        const primaryContact =
          fullCustomer.contacts.find((c) => c.isPrimary) ||
          fullCustomer.contacts[0];
        if (primaryContact) {
          setSelectedContactId(primaryContact.contactId ?? 0);
          setContactNameSnapshot(primaryContact.name || "");
          setContactEmailSnapshot(primaryContact.email || "");
        }
      } else {
        setAvailableContacts([]);
        setSelectedContactId(0);
        setContactNameSnapshot(fullCustomer?.companyName || "");
        setContactEmailSnapshot("");
      }
    } catch {
      setAvailableContacts([]);
      setSelectedContactId(0);
      setContactNameSnapshot(customer.companyName || "");
      setContactEmailSnapshot("");
    }
  };

  const handleContactSelect = (value: string) => {
    if (value === "ADD_NEW") {
      // Fetch or locate the customer object to pass down
      api.get<Customer>(`/customers/${selectedCustomerId}`).then((res) => {
        if (res.data) onTriggerAddContact(res.data);
      });
      return;
    }

    const contactId = Number(value);
    setSelectedContactId(contactId);

    const contact = availableContacts.find((c) => c.contactId === contactId);
    if (contact) {
      setContactNameSnapshot(contact.name || "");
      setContactEmailSnapshot(contact.email || "");
    }
  };

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
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productVariantId: variant.productVariantId ?? null,
      description: `${product.name} - ${variant.color}/${variant.size} (${variant.sku})`,
      unitPrice: variant.unitPrice,
    };
    setItems(updated);
    setActiveVariantSearchIndex(null);
    setVariantSearchQueries({
      ...variantSearchQueries,
      [index]: `${variant.color} / ${variant.size} - SKU: ${variant.sku}`,
    });
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productVariantId: null, description: "", quantity: 1, unitPrice: 0 },
    ]);
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

  const buildDto = (statusOverride?: string): CreateQuotationDto => {
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 7);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Create New Quotation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in proposal parameters and itemized product selections
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="create-quotation-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50"
          ref={searchRef}
        >
          {activeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Top Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Server-Side Customer Search Input */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Customer <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Search customer by name or TIN..."
                  value={customerSearchQuery}
                  onFocus={() => setIsCustomerSearchOpen(true)}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerSearchOpen(true);
                    if (!e.target.value) {
                      setSelectedCustomerId(0);
                      setAvailableContacts([]);
                      setSelectedContactId(0);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              {/* Backend Customer Search Dropdown */}
              {isCustomerSearchOpen &&
                customerSearchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                    {isSearchingCustomers ? (
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">
                        Searching customers...
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
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">
                        No customers found matching "{customerSearchQuery}"
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Contact Person
                </label>
                {selectedCustomerId > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      api
                        .get<Customer>(`/customers/${selectedCustomerId}`)
                        .then((res) => {
                          if (res.data) onTriggerAddContact(res.data);
                        });
                    }}
                    className="text-[10px] font-bold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" /> + Add
                  </button>
                )}
              </div>
              {availableContacts.length > 0 ? (
                <select
                  value={selectedContactId}
                  onChange={(e) => handleContactSelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                >
                  {availableContacts.map((contact) => (
                    <option key={contact.contactId} value={contact.contactId}>
                      {contact.name}{" "}
                      {contact.position ? `(${contact.position})` : ""}{" "}
                      {contact.isPrimary ? "[Primary]" : ""}
                    </option>
                  ))}
                  <option value="ADD_NEW">+ Create New Contact...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={contactNameSnapshot}
                  onChange={(e) => setContactNameSnapshot(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Contact Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={contactEmailSnapshot}
                  disabled
                  placeholder="contact@company.com"
                  className="w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 cursor-not-allowed border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                VAT Computation
              </label>
              <select
                value={vatType}
                onChange={(e) => setVatType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              >
                <option value="Exclusive">VAT Exclusive (12%)</option>
                <option value="Inclusive">VAT Inclusive (12%)</option>
                <option value="ZeroRated">VAT Exempt / Zero-Rated</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Line Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
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

                const filteredVariants = (selectedProd?.variants || []).filter(
                  (v) =>
                    v.sku.toLowerCase().includes(variantQuery.toLowerCase()) ||
                    v.color
                      .toLowerCase()
                      .includes(variantQuery.toLowerCase()) ||
                    v.size.toLowerCase().includes(variantQuery.toLowerCase()),
                );

                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/80 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative group shadow-2xs"
                  >
                    {/* Step 1: Product Search Picker */}
                    <div className="md:col-span-3 space-y-1 relative">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        1. Select Product
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={prodQuery}
                          onFocus={() => setActiveProductSearchIndex(idx)}
                          onChange={(e) => {
                            setProductSearchQueries({
                              ...productSearchQueries,
                              [idx]: e.target.value,
                            });
                            setActiveProductSearchIndex(idx);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {activeProductSearchIndex === idx && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => (
                              <div
                                key={p.productId}
                                onClick={() => handleSelectProduct(idx, p)}
                                className="px-3 py-2 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                              >
                                <span className="font-bold text-slate-800">
                                  {p.name}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Variant Search Picker */}
                    <div className="md:col-span-3 space-y-1 relative">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        2. Select Variant
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder={
                            selectedProd
                              ? "Search variant/SKU..."
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] disabled:opacity-50"
                        />
                      </div>

                      {activeVariantSearchIndex === idx && selectedProd && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                          <div
                            onClick={() => {
                              handleItemChange(idx, "productVariantId", null);
                              setActiveVariantSearchIndex(null);
                              setVariantSearchQueries({
                                ...variantSearchQueries,
                                [idx]: "Custom Item",
                              });
                            }}
                            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer border-b border-slate-100"
                          >
                            -- Custom Variant --
                          </div>
                          {filteredVariants.length > 0 ? (
                            filteredVariants.map((variant) => (
                              <div
                                key={variant.productVariantId}
                                onClick={() =>
                                  handleSelectVariant(
                                    idx,
                                    selectedProd,
                                    variant,
                                  )
                                }
                                className="px-3 py-2 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">
                                    {variant.color} / {variant.size}
                                  </span>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    SKU: {variant.sku}
                                  </div>
                                </div>
                                <span className="font-bold font-mono text-slate-700">
                                  ₱{variant.unitPrice.toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">
                              No variants found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Description <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Item specification..."
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-1 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 text-center focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    {/* Price */}
                    <div className="md:col-span-1 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 text-right font-mono focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="md:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Calculations Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Note to Customer
              </label>
              <textarea
                rows={3}
                placeholder="Payment instructions, bank details, or delivery terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              />
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs font-semibold shadow-2xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{calculatedSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT ({vatType}):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{calculatedVat.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-amber-600">
                  ₱{calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <div className="text-xs font-mono text-slate-500">
            Valid for 7 days by default
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Save as Draft Button */}
            <button
              form="create-quotation-form"
              type="submit"
              onClick={() => setSubmittingAction("draft")}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {saving && submittingAction === "draft"
                ? "Saving..."
                : "Save as Draft"}
            </button>

            <button
              form="create-quotation-form"
              type="submit"
              onClick={() => setSubmittingAction("create")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
                className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />{" "}
                {saving && submittingAction === "send"
                  ? "Saving & Sending..."
                  : "Save & Send Email"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
