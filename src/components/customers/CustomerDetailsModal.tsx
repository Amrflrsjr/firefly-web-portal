import React from "react";
import type { Customer, CustomerContact } from "../../types/customer";
import { X, Pencil, Trash2, UserPlus } from "lucide-react";

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
  onEditCustomer: () => void;
  onAddContact: () => void;
  onEditContact: (contact: CustomerContact) => void;
  onDeleteContact: (contactId?: number) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  onClose,
  onEditCustomer,
  onAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        {/* Header with Title and Edit Customer Action */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {customer.companyName}
            </h2>
            <p className="text-xs text-slate-500">Customer Details</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditCustomer}
              className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Company
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">TIN</p>
            <p className="text-sm font-mono text-slate-700">
              {customer.tin || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Address
            </p>
            <p className="text-sm text-slate-700">
              {customer.companyAddress || "N/A"}
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Associated Contacts
              </p>
              <button
                onClick={onAddContact}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#F9B53F] hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Add Contact
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {customer.contacts?.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {contact.name}{" "}
                      {contact.position && `(${contact.position})`}{" "}
                      {contact.isPrimary && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold ml-1">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {contact.email} • {contact.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditContact(contact)}
                      title="Edit Contact"
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {contact.contactId && (
                      <button
                        onClick={() => onDeleteContact(contact.contactId)}
                        title="Delete Contact"
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
