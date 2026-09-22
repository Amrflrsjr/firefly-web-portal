import React, { useState } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDto, CustomerContact } from "../../types/customer";
import {
  X,
  Building2,
  User,
  MapPin,
  FileText,
  UserCheck,
  Plus,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Flat Modal Header matching CreateQuotationModal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Add New Customer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register a corporate business or a personal client account
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="create-customer-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-950/50"
        >
          {/* Account Classification Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Account Classification
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPersonal(false);
                  setFormData((prev) => ({
                    ...prev,
                    customerType: "Business",
                  }));
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  !isPersonal
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Business Entity</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
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
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  isPersonal
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">
                    Individual / Personal
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Address required, no TIN needed
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              {isPersonal ? (
                <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              ) : (
                <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isPersonal ? "Personal Profile" : "Company Profile"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                />
              </div>

              {!isPersonal && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />{" "}
                    Tax ID (TIN)
                  </label>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) =>
                      setFormData({ ...formData, tin: e.target.value })
                    }
                    placeholder="000-000-000-000"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                  />
                </div>
              )}

              <div
                className={`${isPersonal ? "sm:col-span-2" : ""} space-y-1.5`}
              >
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />{" "}
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isPersonal
                  ? "Contact Information (Email & Phone)"
                  : "Assigned Contact Persons"}
              </h3>
              {!isPersonal && (
                <button
                  type="button"
                  onClick={addContactField}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
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
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-2xs relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {isPersonal
                            ? "Client Details"
                            : `Contact Person #${index + 1}`}
                        </span>
                        {contact.isPrimary && !isPersonal && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Primary
                          </span>
                        )}
                      </div>

                      {!isPersonal && formData.initialContacts!.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactField(index)}
                          className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Remove Contact"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!isPersonal && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          placeholder="name@company.com"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          placeholder="+63 912 345 6789"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {!isPersonal && (
                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
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
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />{" "}
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

        {/* Footer Actions matching CreateQuotationModal */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-2xs">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Fields marked with{" "}
            <span className="text-rose-500 font-bold">*</span> are required
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              form="create-customer-form"
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Customer..." : "Save Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
