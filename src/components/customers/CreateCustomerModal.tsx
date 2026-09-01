import React, { useState } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDto, CustomerContact } from "../../types/customer";
import {
  Plus,
  X,
  Building2,
  User,
  MapPin,
  FileText,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
} from "lucide-react";

interface CreateCustomerModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateCustomerDto) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  saving,
  onClose,
  onSubmit,
}) => {
  const [isPersonal, setIsPersonal] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateCustomerDto>({
    customerType: "Business",
    companyName: "",
    companyAddress: "",
    tin: "",
    notes: "",
    initialContacts: [
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

  const handleContactChange = (
    index: number,
    field: keyof CustomerContact,
    value: string | boolean,
  ) => {
    const updated = [...(formData.initialContacts ?? [])];

    if (field === "isPrimary" && value === true) {
      updated.forEach((contact, i) => {
        contact.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    const newCompanyName =
      isPersonal && index === 0 && field === "name"
        ? (value as string)
        : formData.companyName;

    setFormData({
      ...formData,
      companyName: newCompanyName,
      initialContacts: updated,
    });
  };

  const handleCompanyNameChange = (value: string) => {
    const updatedContacts = [...(formData.initialContacts ?? [])];
    if (isPersonal && updatedContacts.length > 0) {
      updatedContacts[0].name = value;
    }
    setFormData({
      ...formData,
      companyName: value,
      initialContacts: updatedContacts,
    });
  };

  const addContactField = () => {
    const contacts = formData.initialContacts ?? [];
    const hasPrimary = contacts.some((c) => c.isPrimary);

    setFormData({
      ...formData,
      initialContacts: [
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
    const contacts = formData.initialContacts ?? [];
    if (contacts.length <= 1) {
      toast.error("At least one contact entry is required.");
      return;
    }
    const updated = contacts.filter((_, i) => i !== index);
    if (!updated.some((c) => c.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setFormData({
      ...formData,
      initialContacts: updated,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const contactsPayload =
      formData.initialContacts?.map((c: CustomerContact, i: number) => ({
        name: (isPersonal && i === 0 ? formData.companyName : c.name).trim(),
        department: "",
        position: c.position || (isPersonal ? "Walk-in / Individual" : ""),
        email: c.email || "",
        phone: c.phone || "",
        isPrimary: i === 0 ? true : c.isPrimary,
      })) || [];

    const primaryContactName = contactsPayload[0]?.name || "";

    if (!isPersonal && !formData.companyName.trim()) {
      toast.error("Company Name is required for business accounts.");
      return;
    }
    if (!primaryContactName) {
      toast.error("At least one contact or customer name is required.");
      return;
    }

    const submissionDto: CreateCustomerDto = {
      customerType: isPersonal ? "Individual" : "Business",
      companyName: formData.companyName.trim(),
      companyAddress: formData.companyAddress?.trim() || "",
      tin: isPersonal ? "" : formData.tin?.trim() || "",
      notes: formData.notes?.trim() || "",
      initialContacts: contactsPayload,
    };

    onSubmit(submissionDto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Add New Customer
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Register a corporate business or a personal client account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="create-customer-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40"
        >
          {/* Account Classification Toggle */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Account Classification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPersonal(false);
                  setFormData((prev) => ({
                    ...prev,
                    customerType: "Business",
                  }));
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  !isPersonal
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 text-amber-950"
                    : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    !isPersonal
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Business Entity</div>
                  <div className="text-[10px] opacity-75 font-medium">
                    Requires TIN & Address
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPersonal(true);
                  if (formData.initialContacts?.[0]?.name) {
                    setFormData((prev) => ({
                      ...prev,
                      customerType: "Individual",
                      companyName: prev.initialContacts![0].name,
                      tin: "",
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      customerType: "Individual",
                      tin: "",
                    }));
                  }
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  isPersonal
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 text-blue-950"
                    : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isPersonal
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">
                    Individual / Personal
                  </div>
                  <div className="text-[10px] opacity-75 font-medium">
                    Address required, no TIN needed
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              {isPersonal ? (
                <User className="w-4 h-4 text-blue-500" />
              ) : (
                <Building2 className="w-4 h-4 text-[#F9B53F]" />
              )}
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isPersonal ? "Customer Information" : "Company Profile"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                  <span>
                    {isPersonal ? "Customer Full Name" : "Company Name"}{" "}
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  placeholder={
                    isPersonal
                      ? "e.g. Juan Dela Cruz"
                      : "e.g. Sample Corporation Inc."
                  }
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                />
              </div>

              {!isPersonal && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Tax ID
                    (TIN)
                  </label>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) =>
                      setFormData({ ...formData, tin: e.target.value })
                    }
                    placeholder="000-000-000-000"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                  />
                </div>
              )}

              <div
                className={`${isPersonal ? "sm:col-span-2" : ""} space-y-1.5`}
              >
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {isPersonal
                    ? "Residential / Shipping Address"
                    : "Business Address"}
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
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {isPersonal
                  ? "Contact Information (Email & Phone)"
                  : "Assigned Contact Persons"}
              </h3>
              {!isPersonal && (
                <button
                  type="button"
                  onClick={addContactField}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.initialContacts?.map(
                (contact: CustomerContact, index: number) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200/80 p-4 rounded-3xl space-y-3 relative group shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">
                          {isPersonal
                            ? "Client Details"
                            : `Contact Person #${index + 1}`}
                        </span>
                        {contact.isPrimary && !isPersonal && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>

                      {!isPersonal && formData.initialContacts!.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactField(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remove Contact"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Contact Name & Position fields for Business entities */}
                    {!isPersonal && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />{" "}
                            Contact Name{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={!isPersonal}
                            value={contact.name}
                            onChange={(e) =>
                              handleContactChange(index, "name", e.target.value)
                            }
                            placeholder="Enter full name..."
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />{" "}
                            Position / Role
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
                            placeholder="e.g. Procurement Manager"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> Email
                          Address
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          placeholder="name@company.com"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> Phone
                          Number
                        </label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          placeholder="+63 912 345 6789"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {!isPersonal && (
                      <div className="pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
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
                            className="w-4 h-4 rounded-md border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />{" "}
                            Set as Primary Contact
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400">
            Fields marked with{" "}
            <span className="text-rose-500 font-bold">*</span> are required
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
