import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDto, CustomerContact } from "../../types/customer";
import { Plus, Trash2, X } from "lucide-react";

interface CreateCustomerModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateCustomerDto) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    companyName: "",
    companyAddress: "",
    tin: "",
    notes: "",
    contacts: [
      {
        name: "",
        department: "",
        position: "",
        email: "",
        phone: "",
        isPrimary: true,
      },
    ],
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleContactChange = (
    index: number,
    field: keyof CustomerContact,
    value: string | boolean,
  ) => {
    const updated = [...(formData.contacts ?? [])];

    if (field === "isPrimary" && value === true) {
      updated.forEach((contact, i) => {
        contact.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setFormData({ ...formData, contacts: updated });
  };

  const addContactField = () => {
    const contacts = formData.contacts ?? [];
    const hasPrimary = contacts.some((c) => c.isPrimary);

    setFormData({
      ...formData,
      contacts: [
        ...contacts,
        {
          name: "",
          department: "",
          position: "",
          email: "",
          phone: "",
          isPrimary: !hasPrimary,
        },
      ],
    });
    toast.success("New contact entry added.");
  };

  const removeContactField = (index: number) => {
    const contacts = formData.contacts ?? [];
    const wasPrimary = contacts[index]?.isPrimary;
    const updated = contacts.filter((_, i) => i !== index);

    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    setFormData({
      ...formData,
      contacts: updated,
    });
    toast.success("Contact entry removed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error("Company Name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Add New Customer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in company parameters and associated contact persons
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="create-customer-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50"
        >
          {/* Top Fields Grid (Company Information) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Company Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="e.g. Sample Corporation"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Tax ID (TIN)
                </label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) =>
                    setFormData({ ...formData, tin: e.target.value })
                  }
                  placeholder="000-000-000-000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyAddress: e.target.value,
                    })
                  }
                  placeholder="Street, City, Province"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>
            </div>
          </div>

          {/* Contact Persons Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Contact Persons
              </h3>
              <button
                type="button"
                onClick={addContactField}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="space-y-3">
              {formData.contacts?.map((contact, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3 relative group shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-extrabold text-slate-700">
                        Contact Person Details
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                        <input
                          type="checkbox"
                          checked={contact.isPrimary}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "isPrimary",
                              e.target.checked,
                            )
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#F9B53F] focus:ring-[#F9B53F] cursor-pointer"
                        />
                        Primary
                      </label>

                      {(formData.contacts?.length ?? 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactField(index)}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200/60"
                          title="Remove Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contact.name}
                        onChange={(e) =>
                          handleContactChange(index, "name", e.target.value)
                        }
                        placeholder="Full name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Position
                      </label>
                      <input
                        type="text"
                        value={contact.position}
                        onChange={(e) =>
                          handleContactChange(index, "position", e.target.value)
                        }
                        placeholder="e.g. Director"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        placeholder="email@company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) =>
                          handleContactChange(index, "phone", e.target.value)
                        }
                        placeholder="+63 900 000 0000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <div className="text-xs font-mono text-slate-500">
            Ensure all required fields are filled
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
              form="create-customer-form"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
