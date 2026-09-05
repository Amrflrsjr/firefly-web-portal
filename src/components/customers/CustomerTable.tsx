import React, { useState } from "react";
import type { Customer } from "../../types/customer";
import {
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Mail,
  MapPin,
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
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
          Loading customers directory...
        </span>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
        No customers found. Click{" "}
        <b className="text-slate-700 dark:text-slate-300">"+"</b> above to
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
      tin: customer.customerType === "Individual" ? "" : customer.tin || "",
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

    onEditCustomer(customer, {
      ...editForm,
      tin: customer.customerType === "Individual" ? "" : editForm.tin,
    });
    setEditingCustomerId(null);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      );
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-[#F9B53F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F9B53F]" />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("companyname")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer
                  {renderSortIcon("companyname")}
                </div>
              </th>
              <th
                onClick={() => onSort("customertype")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Type
                  {renderSortIcon("customertype")}
                </div>
              </th>
              <th
                onClick={() => onSort("tin")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Tax ID (TIN)
                  {renderSortIcon("tin")}
                </div>
              </th>
              <th className="py-3.5 px-6">Primary Contact</th>
              <th className="py-3.5 px-6">Address</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
            {currentCustomers.map((customer) => {
              const isEditing = editingCustomerId === customer.customerId;
              const primaryContact =
                customer.contacts?.find((c) => c.isPrimary) ||
                customer.contacts?.[0];

              const isPersonal = customer.customerType === "Individual";

              return (
                <tr
                  key={customer.customerId}
                  onClick={() => !isEditing && onView(customer)}
                  className={`transition-colors ${
                    isEditing
                      ? "bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-300/60 dark:ring-amber-800/60"
                      : "hover:bg-slate-100/80 dark:hover:bg-slate-800/60 cursor-pointer group"
                  }`}
                >
                  <td className="py-4 px-6 text-slate-800 dark:text-slate-200">
                    {isEditing ? (
                      <div
                        className="space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          Edit Name
                        </span>
                        <input
                          type="text"
                          value={editForm.companyName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              companyName: e.target.value,
                            })
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0 border ${
                            isPersonal
                              ? "bg-blue-50/85 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400"
                              : "bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50"
                          }`}
                        >
                          {isPersonal ? (
                            <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors truncate">
                          {customer.companyName}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Dedicated Customer Type Column */}
                  <td className="py-4 px-6">
                    {isPersonal ? (
                      <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs">
                        Personal
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-2xs">
                        Business
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {isEditing ? (
                      isPersonal ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            Tax ID (TIN)
                          </span>
                          <div className="text-slate-400 dark:text-slate-500 italic text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            Not applicable
                          </div>
                        </div>
                      ) : (
                        <div
                          className="space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            Edit TIN
                          </span>
                          <input
                            type="text"
                            value={editForm.tin}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tin: e.target.value })
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                            placeholder="000-000-000-000"
                          />
                        </div>
                      )
                    ) : (
                      <span className="bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {isPersonal ? "—" : customer.tin || "—"}
                      </span>
                    )}
                  </td>

                  {/* Primary Contact Column */}
                  <td className="py-4 px-6">
                    {primaryContact ? (
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {primaryContact.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-normal flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="truncate max-w-45">
                            {primaryContact.email || "No email provided"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs italic font-normal">
                        No Contact Assigned
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs text-xs font-normal">
                    {isEditing ? (
                      <div
                        className="space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          Edit Address
                        </span>
                        <input
                          type="text"
                          value={editForm.companyAddress}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              companyAddress: e.target.value,
                            })
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                          placeholder="Street, City, Province"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                        <span className="truncate block max-w-xs font-medium text-slate-600 dark:text-slate-300">
                          {customer.companyAddress || "—"}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleSaveEdit(e, customer)}
                            title="Save Changes"
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 cursor-pointer border border-emerald-200/60 dark:border-emerald-900/60 shadow-2xs"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(e, customer)}
                            title="Quick Edit"
                            className="p-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteCustomer(customer.customerId)
                              }
                              title="Delete Customer"
                              className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, customers.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {customers.length}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
