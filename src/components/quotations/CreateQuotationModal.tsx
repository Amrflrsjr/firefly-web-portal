import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import type {
  CreateQuotationDto,
  QuotationItemDto,
} from "../../types/quotation";
import type { Customer, CustomerContact } from "../../types/customer";
import type { Product } from "../../types/product";
import { X, Plus, Trash2, UserPlus } from "lucide-react";

interface CreateQuotationModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateQuotationDto) => void;
  onTriggerAddContact: (customer: Customer) => void;
  refreshTrigger?: number;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  saving,
  error,
  onClose,
  onSubmit,
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
    { productVariantId: 0, description: "", quantity: 1, unitPrice: 0 },
  ]);

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

        if (selectedCustomerId > 0) {
          const updatedCustomer = custRes.data.find(
            (c) => c.customerId === selectedCustomerId,
          );
          if (
            updatedCustomer?.contacts &&
            updatedCustomer.contacts.length > 0
          ) {
            setAvailableContacts(updatedCustomer.contacts);

            const newestContact =
              updatedCustomer.contacts[updatedCustomer.contacts.length - 1];
            if (newestContact?.contactId) {
              setSelectedContactId(newestContact.contactId);
              setContactNameSnapshot(newestContact.name);
              setContactEmailSnapshot(newestContact.email || "");
            }
          }
        }
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
        setContactEmailSnapshot(primaryContact.email || ""); // Ensures email populates immediately
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
      setContactEmailSnapshot(contact.email || ""); // Auto-fills on dropdown selection
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemDto,
    value: string | number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleVariantSelect = (index: number, variantId: number) => {
    const allVariants = products.flatMap((p) => p.variants || []);
    const variant = allVariants.find((v) => v.productVariantId === variantId);

    const updated = [...items];
    if (variant) {
      const parentProduct = products.find((p) =>
        p.variants?.some((v) => v.productVariantId === variantId),
      );
      updated[index] = {
        ...updated[index],
        productVariantId: variantId,
        description: `${parentProduct?.name || ""} - ${variant.color}/${variant.size} (${variant.sku})`,
        unitPrice: variant.unitPrice,
      };
    } else {
      updated[index].productVariantId = variantId;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productVariantId: 0, description: "", quantity: 1, unitPrice: 0 },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    const formattedItems: QuotationItemDto[] = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productVariantId:
        item.productVariantId === 0 ? null : item.productVariantId,
    }));

    const dto: CreateQuotationDto = {
      customerId: selectedCustomerId,
      contactId: selectedContactId > 0 ? selectedContactId : null,
      contactNameSnapshot,
      contactEmailSnapshot,
      validUntil: validUntilDate.toISOString(),
      vatType,
      noteToCustomer: notes.trim() || undefined,
      items: formattedItems,
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            Create New Quotation
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & VAT Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Customer *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
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
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                VAT Type *
              </label>
              <select
                value={vatType}
                onChange={(e) => setVatType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium"
              >
                <option value="VAT Exclusive">VAT Exclusive (12%)</option>
                <option value="VAT Inclusive">VAT Inclusive (12%)</option>
                <option value="VAT Exempt">VAT Exempt</option>
                <option value="Zero Rated">Zero Rated (0%)</option>
              </select>
            </div>

            {/* Contact Dropdown + Quick Add Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-600">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              )}
            </div>

            {/* Automatically Populated Contact Email */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmailSnapshot}
                onChange={(e) => setContactEmailSnapshot(e.target.value)}
                placeholder="contact@company.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Line Items</h3>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Variant Catalog
                    </label>
                    <select
                      value={item.productVariantId ?? 0}
                      onChange={(e) =>
                        handleVariantSelect(idx, Number(e.target.value))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    >
                      <option value={0}>-- Custom Item --</option>
                      {products.map((p) =>
                        p.variants?.map((v) => (
                          <option
                            key={v.productVariantId}
                            value={v.productVariantId}
                          >
                            {p.name} - {v.sku} (PHP {v.unitPrice})
                          </option>
                        )),
                      )}
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                  </div>

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
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Price (PHP)
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-right font-mono"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-right pt-4">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Notes / Terms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Valid for 30 days. Payment terms: 50% deposit."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-0.5 text-xs font-mono">
              <div className="text-slate-500">
                Subtotal: PHP {calculateSubtotal().toFixed(2)}
              </div>
              <div className="text-slate-500">
                VAT ({vatType}): PHP {calculateVat().toFixed(2)}
              </div>
              <div className="text-sm font-bold text-slate-800">
                Total:{" "}
                <span className="text-slate-900">
                  PHP {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer"
              >
                {saving ? "Creating..." : "Create Quotation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
