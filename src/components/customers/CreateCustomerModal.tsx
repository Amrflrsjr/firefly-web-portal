import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDto, CustomerContact } from "../../types/customer";
import { X } from "lucide-react";

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
    const updated = [...formData.contacts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, contacts: updated });
  };

  const addContactField = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        {
          name: "",
          department: "",
          position: "",
          email: "",
          phone: "",
          isPrimary: false,
        },
      ],
    });
    toast.success("New contact field added.");
  };

  const removeContactField = (index: number) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index),
    });
    toast.success("Contact field removed.");
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800">Add New Customer</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                TIN
              </label>
              <input
                type="text"
                value={formData.tin}
                onChange={(e) =>
                  setFormData({ ...formData, tin: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">
                Contact Persons
              </h3>
              <button
                type="button"
                onClick={addContactField}
                className="text-xs font-semibold text-[#F9B53F] hover:underline cursor-pointer"
              >
                + Add Another Contact
              </button>
            </div>

            {formData.contacts.map((contact, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Contact #{index + 1}
                  </span>
                  {formData.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactField(index)}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={contact.position}
                      onChange={(e) =>
                        handleContactChange(index, "position", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
