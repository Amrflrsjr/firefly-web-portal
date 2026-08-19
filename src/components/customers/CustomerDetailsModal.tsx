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
  onClose: () => void;
  onEditCustomer: () => void;
  onDeleteCustomer: (customerId: number) => void;
  onAddContact: () => void;
  onEditContact: (contact: CustomerContact) => void;
  onDeleteContact: (contactId?: number) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  onClose,
  onEditCustomer,
  onDeleteCustomer,
  onAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs">
              <Building className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Customer Profile
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {customer.companyName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FCFDFF]">
          {/* Action Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              onClick={onEditCustomer}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Company
            </button>
            <button
              onClick={() => onDeleteCustomer(customer.customerId)}
              className="inline-flex items-center justify-center text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl border border-rose-100 transition-all cursor-pointer"
              title="Delete Company"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Tax ID (TIN)
              </div>
              <p className="text-sm font-mono font-semibold text-slate-800">
                {customer.tin || "N/A"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F9B53F]" /> Business
                Address
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug">
                {customer.companyAddress || "N/A"}
              </p>
            </div>
          </div>

          {/* Associated Contacts Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Associated Contacts
                </h3>
              </div>
              <button
                onClick={onAddContact}
                className="inline-flex items-center gap-1 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {customer.contacts?.length === 0 || !customer.contacts ? (
                <div className="p-4 text-center bg-white rounded-2xl border border-slate-200/70 text-slate-400 text-xs italic">
                  No contacts added yet.
                </div>
              ) : (
                customer.contacts?.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs text-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {contact.name}
                        </span>
                        {contact.position && (
                          <span className="text-xs text-slate-500 font-medium">
                            ({contact.position})
                          </span>
                        )}
                        {contact.isPrimary && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full font-bold">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {contact.email || "No email"} •{" "}
                        {contact.phone || "No phone"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditContact(contact)}
                        title="Edit Contact"
                        className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {contact.contactId && (
                        <button
                          onClick={() => onDeleteContact(contact.contactId)}
                          title="Delete Contact"
                          className="text-rose-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
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

        {/* Footer Close Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
