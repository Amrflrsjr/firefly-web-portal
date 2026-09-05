import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import type {
  QuotationResponseDto,
  QuotationItemDto,
  QuotationItemResponseDto,
} from "../../types/quotation";
import type { Customer, CustomerContact } from "../../types/customer";
import type { Product, ProductVariant } from "../../types/product";
import { X, Plus, Trash2, AlertCircle, Calculator } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface EditQuotationModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onSuccess: () => void;
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
  productId?: number | "";
}

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  quotation,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [contactId, setContactId] = useState<number | "">("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [vatType, setVatType] = useState<string>("Exclusive");
  const [noteToCustomer, setNoteToCustomer] = useState<string>("");
  const [items, setItems] = useState<EditableLineItem[]>([]);

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full details, customers, and products on mount
  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoadingDetails(true);
        setError(null);

        const [custRes, prodRes, detailRes] = await Promise.all([
          api.get<Customer[]>("/customers"),
          api.get<Product[]>("/products"),
          api.get<QuotationFullDetail>(`/quotations/${quotation.quotationId}`),
        ]);

        const loadedCustomers = custRes.data;
        const loadedProducts = prodRes.data;
        setCustomers(loadedCustomers);
        setProducts(loadedProducts);

        const detail = detailRes.data;
        if (detail) {
          const resolvedCustId = detail.customerId || quotation.companyId || 0;
          setCustomerId(resolvedCustId);
          setContactId(detail.contactId ?? "");

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

          const mappedItems: EditableLineItem[] = rawItems.map((i) => {
            let matchedProductId: number | "" = "";
            if (i.productVariantId) {
              const parentProd = loadedProducts.find((p) =>
                p.variants?.some(
                  (v) => v.productVariantId === i.productVariantId,
                ),
              );
              if (parentProd) {
                matchedProductId = parentProd.productId;
              }
            }
            return {
              productVariantId: i.productVariantId ?? null,
              productId: matchedProductId,
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
                    productId: "",
                    productVariantId: null,
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                  },
                ],
          );

          const selectedCust = loadedCustomers.find(
            (c) => c.customerId === resolvedCustId,
          );
          if (selectedCust && selectedCust.contacts) {
            setContacts(selectedCust.contacts);
          }
        }
      } catch (err) {
        console.error("Failed to load quotation record", err);
        setError("Failed to load quotation details from server.");
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchQuotationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation.quotationId]);

  const handleCustomerChange = (newCustomerId: number) => {
    setCustomerId(newCustomerId);
    setContactId("");
    const selected = customers.find((c) => c.customerId === newCustomerId);
    if (selected && selected.contacts) {
      setContacts(selected.contacts);
      const primary =
        selected.contacts.find((c) => c.isPrimary) || selected.contacts[0];
      if (primary && primary.contactId) {
        setContactId(primary.contactId);
      }
    } else {
      setContacts([]);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productVariantId: null,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Quotation must have at least one item.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productIdStr: string) => {
    const updated = [...items];
    const productId = productIdStr ? Number(productIdStr) : "";

    updated[index] = {
      ...updated[index],
      productId,
      productVariantId: null,
      description: "",
      unitPrice: 0,
    };
    setItems(updated);
  };

  const handleVariantChange = (index: number, variantIdStr: string) => {
    const updated = [...items];
    const variantId = variantIdStr ? Number(variantIdStr) : null;
    updated[index].productVariantId = variantId;

    if (variantId) {
      const currentProd = products.find(
        (p) => p.productId === updated[index].productId,
      );
      const variant = currentProd?.variants?.find(
        (v) => v.productVariantId === variantId,
      );
      if (variant) {
        updated[index].description =
          `${currentProd?.name || ""} - ${variant.color} / ${variant.size} (SKU: ${variant.sku})`;
        updated[index].unitPrice = variant.unitPrice;
      }
    } else {
      updated[index].description = "";
      updated[index].unitPrice = 0;
    }

    setItems(updated);
  };

  const handleFieldChange = (
    index: number,
    field: keyof EditableLineItem,
    value: string | number | null | undefined,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations
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
    if (
      items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice < 0)
    ) {
      setError(
        "Please ensure all items have a description, valid quantity, and price.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    const selectedContact = contacts.find((c) => c.contactId === contactId);

    try {
      const payload = {
        customerId,
        contactId: contactId === "" ? null : Number(contactId),
        contactNameSnapshot:
          selectedContact?.name || quotation.contactNameSnapshot || "",
        contactEmailSnapshot:
          selectedContact?.email || quotation.contactEmailSnapshot || "",
        validUntil: new Date(validUntil).toISOString(),
        vatType,
        noteToCustomer,
        items: items.map((i) => ({
          productVariantId: i.productVariantId
            ? Number(i.productVariantId)
            : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Edit Quotation #{quotation.quotationNumber}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify proposal parameters and itemized product selections
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingDetails ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
            Loading quotation #{quotation.quotationNumber} details...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 overflow-y-auto space-y-6 flex-1"
          >
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Top Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                >
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Contact Person
                </label>
                <select
                  value={contactId}
                  onChange={(e) =>
                    setContactId(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                >
                  <option value="">Select Contact</option>
                  {contacts.map((con) => (
                    <option key={con.contactId} value={con.contactId}>
                      {con.name} ({con.position || "Staff"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Valid Until <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  VAT Computation
                </label>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
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
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Line Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedProduct = products.find(
                    (p) => p.productId === item.productId,
                  );
                  const availableVariants: ProductVariant[] =
                    selectedProduct?.variants || [];

                  return (
                    <div
                      key={index}
                      className="bg-slate-50/75 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative group"
                    >
                      {/* 1. Select Product */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">
                          1. Select Product
                        </label>
                        <select
                          value={item.productId || ""}
                          onChange={(e) =>
                            handleProductChange(index, e.target.value)
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                        >
                          <option value="">Search / Select product...</option>
                          {products.map((p) => (
                            <option key={p.productId} value={p.productId}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Select Variant */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">
                          2. Select Variant
                        </label>
                        <select
                          value={item.productVariantId || ""}
                          onChange={(e) =>
                            handleVariantChange(index, e.target.value)
                          }
                          disabled={!item.productId}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:text-slate-400"
                        >
                          <option value="">
                            {!item.productId
                              ? "Select product first"
                              : "Select variant..."}
                          </option>
                          {availableVariants.map((v) => (
                            <option
                              key={v.productVariantId}
                              value={v.productVariantId}
                            >
                              {v.color} / {v.size} (SKU: {v.sku}) - ₱
                              {v.unitPrice}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">
                          Description <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Item specification..."
                          value={item.description}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Qty */}
                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Price */}
                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">
                          Price (₱)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="md:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Note to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="Payment instructions, bank details, or delivery terms..."
                  value={noteToCustomer}
                  onChange={(e) => setNoteToCustomer(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 p-4 rounded-2xl space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₱{calculatedSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT ({vatType}):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₱{calculatedVat.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    ₱{calculatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
