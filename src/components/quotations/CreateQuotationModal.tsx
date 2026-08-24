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
  error,
  onClose,
  onSubmit,
  onSubmitAndSend,
  onTriggerAddContact,
  refreshTrigger = 0,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [availableContacts, setAvailableContacts] = useState<CustomerContact[]>(
    [],
  );
  const [selectedContactId, setSelectedContactId] = useState<number>(0);

  const [vatType, setVatType] = useState<string>("VAT Exclusive");
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

  const searchRef = useRef<HTMLDivElement>(null);
  const isSendAfterSaveRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setActiveProductSearchIndex(null);
        setActiveVariantSearchIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get<Customer[]>("/customers"),
          api.get<Product[]>("/products"),
        ]);

        if (!isSubscribed) return;

        setCustomers(custRes.data);
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

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.customerId === customerId);

    if (customer && customer.contacts && customer.contacts.length > 0) {
      setAvailableContacts(customer.contacts);

      const primaryContact =
        customer.contacts.find((c) => c.isPrimary) || customer.contacts[0];
      if (primaryContact) {
        setSelectedContactId(primaryContact.contactId ?? 0);
        setContactNameSnapshot(primaryContact.name || "");
        setContactEmailSnapshot(primaryContact.email || "");
      }
    } else {
      setAvailableContacts([]);
      setSelectedContactId(0);
      setContactNameSnapshot(customer?.companyName || "");
      setContactEmailSnapshot("");
    }
  };

  const handleContactSelect = (value: string) => {
    if (value === "ADD_NEW") {
      const customer = customers.find(
        (c) => c.customerId === selectedCustomerId,
      );
      if (customer) onTriggerAddContact(customer);
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
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const calculateVat = () => {
    const subtotal = calculateSubtotal();
    if (vatType === "VAT Exclusive") return subtotal * 0.12;
    if (vatType === "VAT Inclusive") return subtotal - subtotal / 1.12;
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (vatType === "VAT Exclusive") return subtotal + calculateVat();
    return subtotal;
  };

  const buildDto = (): CreateQuotationDto => {
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    const formattedItems: QuotationItemDto[] = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productVariantId:
        item.productVariantId === 0 ? null : item.productVariantId,
    }));

    return {
      customerId: selectedCustomerId,
      contactId: selectedContactId > 0 ? selectedContactId : null,
      contactNameSnapshot,
      contactEmailSnapshot,
      validUntil: validUntilDate.toISOString(),
      vatType,
      noteToCustomer: notes.trim() || undefined,
      items: formattedItems,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }

    const dto = buildDto();
    if (isSendAfterSaveRef.current && onSubmitAndSend) {
      onSubmitAndSend(dto);
    } else {
      onSubmit(dto);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-extrabold text-slate-900">
            Create New Quotation
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div
          className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50"
          ref={searchRef}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <form
            id="create-quotation-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Customer & VAT Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
                >
                  <option value={0}>-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                  VAT Type *
                </label>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
                >
                  <option value="VAT Exclusive">VAT Exclusive (12%)</option>
                  <option value="VAT Inclusive">VAT Inclusive (12%)</option>
                  <option value="VAT Exempt">VAT Exempt</option>
                  <option value="Zero Rated">Zero Rated (0%)</option>
                </select>
              </div>

              {/* Contact Person */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400">
                    Contact Person
                  </label>
                  {selectedCustomerId > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const customer = customers.find(
                          (c) => c.customerId === selectedCustomerId,
                        );
                        if (customer) onTriggerAddContact(customer);
                      }}
                      className="text-[11px] font-bold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> + Add Contact
                    </button>
                  )}
                </div>

                {availableContacts.length > 0 ? (
                  <select
                    value={selectedContactId}
                    onChange={(e) => handleContactSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
                  />
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmailSnapshot}
                  onChange={(e) => setContactEmailSnapshot(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
                />
              </div>
            </div>

            {/* Line Items with Separated Product & Variant Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Line Items
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-[#FFCB62]/30 hover:bg-[#FFCB62]/50 text-slate-900 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
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

                  const filteredVariants = (
                    selectedProd?.variants || []
                  ).filter(
                    (v) =>
                      v.sku
                        .toLowerCase()
                        .includes(variantQuery.toLowerCase()) ||
                      v.color
                        .toLowerCase()
                        .includes(variantQuery.toLowerCase()) ||
                      v.size.toLowerCase().includes(variantQuery.toLowerCase()),
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-12 gap-2 items-center relative"
                    >
                      {/* Step 1: Product Search Picker */}
                      <div className="col-span-12 sm:col-span-3 relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          1. Select Product
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
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
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F9B53F]"
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
                      <div className="col-span-12 sm:col-span-3 relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          2. Select Variant
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
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
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F9B53F] disabled:opacity-50"
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
                                    PHP {variant.unitPrice.toFixed(2)}
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
                      <div className="col-span-12 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(idx, "description", e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Qty */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 text-center focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-6 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 text-right font-mono focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-2 sm:col-span-1 text-right pt-4">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Notes / Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Valid for 30 days. Payment terms: 50% deposit."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#F9B53F]"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <div className="space-y-0.5 text-xs font-mono">
            <div className="text-slate-500">
              Subtotal: PHP {calculateSubtotal().toFixed(2)}
            </div>
            <div className="text-slate-500">
              VAT ({vatType}): PHP {calculateVat().toFixed(2)}
            </div>
            <div className="text-sm font-bold text-slate-900">
              Total: PHP {calculateTotal().toFixed(2)}
            </div>
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
            <button
              form="create-quotation-form"
              type="submit"
              onClick={() => {
                isSendAfterSaveRef.current = false;
              }}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Quotation"}
            </button>
            {onSubmitAndSend && (
              <button
                form="create-quotation-form"
                type="submit"
                onClick={() => {
                  isSendAfterSaveRef.current = true;
                }}
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Save & Send Email
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
