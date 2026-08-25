import React, { useState } from "react";
import type { Customer } from "../../types/customer";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface CustomerTableProps {
  loading: boolean;
  customers: Customer[];
  isAdmin: boolean;
  sortBy: string;
  ascending: boolean;
  onSort: (field: string) => void;
  onView: (customer: Customer) => void;
  onEditCustomer: (
    customer: Customer,
    updatedData: {
      companyName: string;
      companyAddress: string;
      tin: string;
      notes: string;
    },
  ) => void;
  onDeleteCustomer: (customerId: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  loading,
  customers,
  isAdmin,
  sortBy,
  ascending,
  onSort,
  onView,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    companyName: "",
    tin: "",
    companyAddress: "",
    notes: "",
  });

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm font-medium flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600">
          Loading customers directory...
        </span>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm font-medium bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
        No customers found. Click <b className="text-slate-800">"+"</b> above to
        create one.
      </div>
    );
  }

  const totalPages = Math.ceil(customers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentCustomers = customers.slice(startIndex, startIndex + pageSize);

  const handleStartEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditingCustomerId(customer.customerId);
    setEditForm({
      companyName: customer.companyName,
      tin: customer.tin || "",
      companyAddress: customer.companyAddress || "",
      notes: customer.notes || "",
    });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomerId(null);
  };

  const handleSaveEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!editForm.companyName.trim()) return;

    onEditCustomer(customer, editForm);
    setEditingCustomerId(null);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Helper to render active sort icon
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return ascending ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#F9B53F]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#F9B53F]" />
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("companyname")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Company Name
                  {renderSortIcon("companyname")}
                </div>
              </th>
              <th
                onClick={() => onSort("tin")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  TIN
                  {renderSortIcon("tin")}
                </div>
              </th>
              <th className="py-4 px-6">Primary Contact</th>
              <th className="py-4 px-6">Address</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {currentCustomers.map((customer) => {
              const isEditing = editingCustomerId === customer.customerId;
              const primaryContact =
                customer.contacts?.find((c) => c.isPrimary) ||
                customer.contacts?.[0];

              return (
                <tr
                  key={customer.customerId}
                  onClick={() => !isEditing && onView(customer)}
                  className={`transition-colors ${
                    isEditing
                      ? "bg-amber-50/60"
                      : "hover:bg-amber-50/30 cursor-pointer group"
                  }`}
                >
                  <td className="py-4 px-6 text-slate-800">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.companyName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            companyName: e.target.value,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F]"
                      />
                    ) : (
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/25 to-[#F4D158]/25 text-[#d99723] font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0 border border-amber-200/50">
                          <Building2 className="w-4 h-4 text-[#F9B53F]" />
                        </div>
                        <span className="font-extrabold text-slate-900 group-hover:text-amber-950 transition-colors">
                          {customer.companyName}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.tin}
                        onChange={(e) =>
                          setEditForm({ ...editForm, tin: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        placeholder="TIN"
                      />
                    ) : (
                      customer.tin || "—"
                    )}
                  </td>

                  <td className="py-4 px-6">
                    {primaryContact ? (
                      <div>
                        <div className="font-extrabold text-slate-800 flex items-center gap-2">
                          <span>{primaryContact.name}</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 tracking-wide uppercase">
                            Primary
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          {primaryContact.email || "No email"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic font-normal">
                        No Contact
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-slate-500 max-w-xs text-xs font-normal">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.companyAddress}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            companyAddress: e.target.value,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        placeholder="Address"
                      />
                    ) : (
                      <span className="truncate block max-w-xs">
                        {customer.companyAddress || "—"}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleSaveEdit(e, customer)}
                            title="Save Changes"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer border border-emerald-200/60 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200/60 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(e, customer)}
                            title="Quick Edit"
                            className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200/60 shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomer(customer.customerId);
                              }}
                              title="Delete Customer"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700">{startIndex + 1}</span>{" "}
            to{" "}
            <span className="font-bold text-slate-700">
              {Math.min(startIndex + pageSize, customers.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">{customers.length}</span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-2 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
