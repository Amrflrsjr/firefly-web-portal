import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDto, CustomerContact } from "../../types/customer";
import {
  X,
  Building2,
  FileText,
  MapPin,
  Users,
  Plus,
  Trash2,
  User,
  Briefcase,
  Mail,
  Phone,
} from "lucide-react";

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
      // Ensure only one contact is primary by setting all others to false
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header (Fixed with proper top-right close alignment) */}
        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-[1fr_auto] items-center gap-4 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs shrink-0">
              <Building2 className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Directory Management
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
                Add New Customer
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FCFDFF]">
          <form
            id="create-customer-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Company Details Section */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Company Information
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#F9B53F]" /> Company
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="e.g. Sample Corporation"
                    className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/25 transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Tax ID
                    (TIN)
                  </label>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) =>
                      setFormData({ ...formData, tin: e.target.value })
                    }
                    placeholder="000-000-000-000"
                    className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-mono font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/25 transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F9B53F]" /> Business
                    Address
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
                    className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/25 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Contact Persons Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Contact Persons
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addContactField}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              <div className="space-y-3">
                {formData.contacts?.map((contact, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Contact Person Details
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
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
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                          <User className="w-3 h-3 text-[#F9B53F]" /> Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={contact.name}
                          onChange={(e) =>
                            handleContactChange(index, "name", e.target.value)
                          }
                          placeholder="Full name"
                          className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                          <Briefcase className="w-3 h-3 text-[#F9B53F]" />{" "}
                          Position
                        </label>
                        <input
                          type="text"
                          value={contact.position}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "position",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. Director"
                          className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                          <Mail className="w-3 h-3 text-[#F9B53F]" /> Email
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          placeholder="email@company.com"
                          className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                          <Phone className="w-3 h-3 text-[#F9B53F]" /> Phone
                        </label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          placeholder="+63 900 000 0000"
                          className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions Bar (Fixed at bottom outside scroll area) */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
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
  );
};
