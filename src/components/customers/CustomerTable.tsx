import React, { useState, useRef, useEffect } from "react";
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
  MoreVertical,
  Eye,
} from "lucide-react";

interface CustomerTableProps {
  loading: boolean;
  customers: Customer[];
  isAdmin: boolean;
  sortBy: string;
  ascending: boolean;
  searchQuery?: string;
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
  searchQuery,
  onSort,
  onView,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
        setMenuCoords(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="w-5 h-5 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Loading customers directory...
        </span>
      </div>
    );
  }

  // Filter customers matching contact name, email, or company name
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery?.trim().toLowerCase() || "";
    if (!query) return true;
    const matchesCompany = customer.companyName.toLowerCase().includes(query);
    const matchesContacts = customer.contacts?.some(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.position && c.position.toLowerCase().includes(query)),
    );
    return matchesCompany || matchesContacts;
  });

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
        No customers found. Click{" "}
        <b className="text-slate-700 dark:text-slate-300">
          "+ Create Customer"
        </b>{" "}
        above to create one.
      </div>
    );
  }

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleStartEdit = (customer: Customer) => {
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
      <ArrowUp className="w-3 h-3 text-slate-700 dark:text-slate-200" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-700 dark:text-slate-200" />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("companyname")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer
                  {renderSortIcon("companyname")}
                </div>
              </th>
              <th
                onClick={() => onSort("customertype")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Type
                  {renderSortIcon("customertype")}
                </div>
              </th>
              <th
                onClick={() => onSort("tin")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Tax ID (TIN)
                  {renderSortIcon("tin")}
                </div>
              </th>
              <th className="py-3 px-4">Primary Contact</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4 text-right w-16 font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {currentCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-400 text-xs italic"
                >
                  No matching contacts or customers found.
                </td>
              </tr>
            ) : (
              currentCustomers.map((customer) => {
                const isEditing = editingCustomerId === customer.customerId;
                const isMenuOpen = activeMenuId === customer.customerId;

                const primaryContact =
                  customer.contacts?.find((c) => c.isPrimary) ||
                  customer.contacts?.[0];

                const isPersonal = customer.customerType === "Individual";

                return (
                  <tr
                    key={customer.customerId}
                    onClick={() => !isEditing && onView(customer)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                      isEditing
                        ? "bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-300/60 dark:ring-amber-800/60"
                        : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
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
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
                              isPersonal
                                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {isPersonal ? (
                              <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {customer.companyName}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Dedicated Customer Type Column */}
                    <td className="py-3.5 px-4">
                      {isPersonal ? (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-2xs">
                          Personal
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shadow-2xs">
                          Corporate
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {isEditing ? (
                        isPersonal ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                              Tax ID (TIN)
                            </span>
                            <div className="text-slate-400 dark:text-slate-500 italic text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
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
                                setEditForm({
                                  ...editForm,
                                  tin: e.target.value,
                                })
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 shadow-2xs"
                              placeholder="000-000-000-000"
                            />
                          </div>
                        )
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {isPersonal ? "—" : customer.tin || "—"}
                        </span>
                      )}
                    </td>

                    {/* Primary Contact Column */}
                    <td className="py-3.5 px-4">
                      {primaryContact ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {primaryContact.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-48">
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

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs text-xs font-normal">
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
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                            placeholder="Street, City, Province"
                          />
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate block max-w-xs font-medium text-slate-600 dark:text-slate-300">
                            {customer.companyAddress || "—"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right relative">
                      <div
                        className="flex items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleSaveEdit(e, customer)}
                              title="Save Changes"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 cursor-pointer border border-emerald-200 dark:border-emerald-900/60 shadow-2xs"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              title="Cancel"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeMenuId === customer.customerId) {
                                  setActiveMenuId(null);
                                  setMenuCoords(null);
                                } else {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const menuHeight = 140;
                                  const showAbove =
                                    window.innerHeight - rect.bottom <
                                      menuHeight && rect.top > menuHeight;

                                  setActiveMenuId(customer.customerId);
                                  setMenuCoords({
                                    top: showAbove
                                      ? rect.top - menuHeight - 4
                                      : rect.bottom + 4,
                                    left: Math.max(12, rect.right - 160),
                                  });
                                }
                              }}
                              title="Actions"
                              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-150 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && menuCoords && (
                              <div
                                ref={menuRef}
                                style={{
                                  position: "fixed",
                                  top: `${menuCoords.top}px`,
                                  left: `${menuCoords.left}px`,
                                }}
                                className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setMenuCoords(null);
                                    onView(customer);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setMenuCoords(null);
                                    handleStartEdit(customer);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Quick Edit</span>
                                </button>

                                {isAdmin && (
                                  <>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setMenuCoords(null);
                                        onDeleteCustomer(customer.customerId);
                                      }}
                                      className="w-full px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {filteredCustomers.length > 0 ? startIndex + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, filteredCustomers.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {filteredCustomers.length}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
