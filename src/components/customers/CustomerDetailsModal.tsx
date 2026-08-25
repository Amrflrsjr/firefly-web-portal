import React from "react";
import type { Customer, CustomerContact } from "../../types/customer";
import {
  X,
  Pencil,
  Trash2,
  UserPlus,
  Building,
  FileText,
  MapPin,
  Users,
} from "lucide-react";

interface CustomerDetailsModalProps {
  customer: Customer;
  isAdmin?: boolean;
  onClose: () => void;
  onAddContact: () => void;
  onEditContact: (contact: CustomerContact) => void;
  onDeleteContact: (contactId?: number) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isAdmin = false,
  onClose,
  onAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Building className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Customer Profile
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
                {customer.companyName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Tax ID (TIN)
              </div>
              <p className="text-sm font-mono font-bold text-slate-800">
                {customer.tin || "N/A"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F9B53F]" /> Business
                Address
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                {customer.companyAddress || "N/A"}
              </p>
            </div>
          </div>

          {/* Associated Contacts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Associated Contacts
                </h3>
              </div>
              <button
                onClick={onAddContact}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {customer.contacts?.length === 0 || !customer.contacts ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs italic shadow-2xs">
                  No contacts added yet.
                </div>
              ) : (
                customer.contacts?.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                          {contact.name}
                        </span>
                        {contact.position && (
                          <span className="text-xs text-slate-500 font-medium">
                            ({contact.position})
                          </span>
                        )}
                        {contact.isPrimary && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 uppercase tracking-wide">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {contact.email || "No email"} •{" "}
                        {contact.phone || "No phone"}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => onEditContact(contact)}
                        title="Edit Contact"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200/60 shadow-2xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteContact(contact.contactId)}
                          title="Delete Contact"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60 shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
