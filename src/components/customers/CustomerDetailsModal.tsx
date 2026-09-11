import React, { useState, useEffect } from "react";
import type { Customer, CustomerContact } from "../../types/customer";
import type { QuotationResponseDto } from "../../types/quotation";
import type { InvoiceResponseDto } from "../../types/invoice";
import { QuotationDetailsModal } from "../quotations/QuotationDetailsModal";
import { InvoiceDetailsModal } from "../invoice/InvoiceDetailsModal";
import { PdfPreviewModal } from "../common/PdfPreviewModal"; // Import the modal
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  X,
  Pencil,
  Trash2,
  UserPlus,
  Building,
  FileText,
  MapPin,
  Users,
  Receipt,
  ChevronRight,
  Check,
} from "lucide-react";

interface CustomerDetailsModalProps {
  customer: Customer;
  isAdmin?: boolean;
  onClose: () => void;
  onAddContact: () => void;
  onEditContact: (contact: CustomerContact) => void;
  onDeleteContact: (contactId?: number) => void;
  onEditCustomer?: (
    customer: Customer,
    updatedData: {
      companyName: string;
      companyAddress: string;
      tin: string;
      notes: string;
    },
  ) => void;
  onEditQuotation?: (quotation: QuotationResponseDto) => void;
  onOpenEmailQuotation?: (quotation: QuotationResponseDto) => void;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isAdmin = false,
  onClose,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onEditCustomer,
  onEditQuotation,
  onOpenEmailQuotation,
}) => {
  const [activeTab, setActiveTab] = useState<
    "contacts" | "quotations" | "invoices"
  >("contacts");
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // PDF action loading states matching QuotationTable
  const [loadingPdfId, setLoadingPdfId] = useState<number | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  // PdfPreviewModal states
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState("");
  const [previewPdfFilename, setPreviewPdfFilename] = useState("");

  // Initialize state directly from props without an effect
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(customer);

  // Inline Editing States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: currentCustomer.companyName,
    tin:
      currentCustomer.customerType === "Individual"
        ? ""
        : currentCustomer.tin || "",
    companyAddress: currentCustomer.companyAddress || "",
    notes: currentCustomer.notes || "",
  });

  const isPersonal = currentCustomer.customerType === "Individual";

  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationResponseDto | null>(null);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceResponseDto | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCustomerHistory = async () => {
      setLoadingHistory(true);
      try {
        const [qRes, iRes] = await Promise.all([
          api.get<QuotationResponseDto[]>("quotations"),
          api.get<InvoiceResponseDto[]>("invoices"),
        ]);

        if (isMounted) {
          const targetName = currentCustomer.companyName.toLowerCase().trim();

          const matchedQuotations = (qRes.data || []).filter(
            (q: QuotationResponseDto) => {
              const rawQ = q as unknown as Record<string, unknown>;
              const matchesId = rawQ.customerId === currentCustomer.customerId;
              const qName =
                (rawQ.customerName as string) ||
                (rawQ.clientName as string) ||
                (rawQ.companyName as string);
              return (
                matchesId ||
                (qName && qName.toLowerCase().trim() === targetName)
              );
            },
          );

          const matchedInvoices = (iRes.data || []).filter(
            (inv: InvoiceResponseDto) => {
              const rawInv = inv as unknown as Record<string, unknown>;
              const matchesId =
                rawInv.customerId === currentCustomer.customerId;
              const invName =
                (rawInv.customerName as string) ||
                (rawInv.clientName as string) ||
                (rawInv.companyName as string);
              return (
                matchesId ||
                (invName && invName.toLowerCase().trim() === targetName)
              );
            },
          );

          setQuotations(
            matchedQuotations.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
          setInvoices(
            matchedInvoices.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        }
      } catch (err) {
        console.error("Failed to fetch customer history", err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    void fetchCustomerHistory();
    return () => {
      isMounted = false;
    };
  }, [currentCustomer]);

  const handleSaveProfile = () => {
    if (!editForm.companyName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    const payload = {
      ...editForm,
      tin: isPersonal ? "" : editForm.tin,
    };

    if (onEditCustomer) {
      onEditCustomer(currentCustomer, payload);
    }

    // Immediately update local modal view without waiting for page refresh
    setCurrentCustomer((prev) => ({
      ...prev,
      companyName: editForm.companyName,
      companyAddress: editForm.companyAddress,
      tin: isPersonal ? "" : editForm.tin,
    }));

    setIsEditingProfile(false);
  };

  const handleViewQuotationPdf = async (id: number, number: string) => {
    try {
      setLoadingPdfId(id);
      const res = await api.get(`/quotations/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      setPreviewPdfUrl(fileURL);
      setPreviewPdfTitle(`Quotation #${number}`);
      setPreviewPdfFilename(`Quotation_${number}.pdf`);
    } catch {
      toast.error("Failed to preview quotation PDF.");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleDownloadQuotationPdf = async (
    _e: React.MouseEvent | null,
    q: QuotationResponseDto,
  ) => {
    try {
      setDownloadingPdfId(q.quotationId);
      const res = await api.get(`/quotations/${q.quotationId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Quotation_${q.quotationNumber}.pdf`;
      link.click();
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to download PDF document.");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDeleteQuotation = async (quotationId: number) => {
    if (!window.confirm("Are you sure you want to delete this quotation?"))
      return;
    try {
      await api.delete(`/quotations/${quotationId}`);
      toast.success("Quotation deleted successfully.");
      setQuotations((prev) =>
        prev.filter((q) => q.quotationId !== quotationId),
      );
      setSelectedQuotation(null);
    } catch {
      toast.error("Failed to delete quotation.");
    }
  };

  const handleDownloadPdf = async (id: number, number: string) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice_${number}.pdf`;
      link.click();
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const handlePreviewPdf = async (id: number, number: string) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      setPreviewPdfUrl(fileURL);
      setPreviewPdfTitle(`Invoice #${number}`);
      setPreviewPdfFilename(`Invoice_${number}.pdf`);
    } catch {
      toast.error("Failed to preview PDF.");
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!window.confirm("Are you sure you want to cancel/delete this invoice?"))
      return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success("Invoice deleted successfully.");
      setInvoices((prev) => prev.filter((inv) => inv.invoiceId !== invoiceId));
      setSelectedInvoice(null);
    } catch {
      toast.error("Failed to delete invoice.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-950/20 border border-slate-100 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
          {/* Top Accent Gradient Bar */}
          <div className="h-1.5 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-[#F9B53F] dark:text-amber-400 shadow-xs shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Customer Profile & History
                  </span>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          companyName: currentCustomer.companyName,
                          tin: currentCustomer.tin || "",
                          companyAddress: currentCustomer.companyAddress || "",
                          notes: currentCustomer.notes || "",
                        });
                        setIsEditingProfile(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 hover:text-amber-800 font-extrabold cursor-pointer px-2 py-0.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all"
                    >
                      <Pencil className="w-3 h-3" /> Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          companyName: e.target.value,
                        })
                      }
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      placeholder="Company Name"
                    />
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {currentCustomer.companyName}
                  </h2>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950/40">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tax ID Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Tax ID
                    (TIN)
                  </span>
                  {!isEditingProfile && !isPersonal && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          companyName: currentCustomer.companyName,
                          tin: currentCustomer.tin || "",
                          companyAddress: currentCustomer.companyAddress || "",
                          notes: currentCustomer.notes || "",
                        });
                        setIsEditingProfile(true);
                      }}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  isPersonal ? (
                    <div className="text-slate-400 dark:text-slate-500 italic text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      Not applicable
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editForm.tin}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tin: e.target.value })
                      }
                      placeholder="000-000-000-000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                    />
                  )
                ) : (
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {isPersonal
                      ? "Not applicable"
                      : currentCustomer.tin || "N/A"}
                  </p>
                )}
              </div>

              {/* Business Address Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#F9B53F]" /> Business
                    Address
                  </span>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          companyName: currentCustomer.companyName,
                          tin: currentCustomer.tin || "",
                          companyAddress: currentCustomer.companyAddress || "",
                          notes: currentCustomer.notes || "",
                        });
                        setIsEditingProfile(true);
                      }}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editForm.companyAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        companyAddress: e.target.value,
                      })
                    }
                    placeholder="Street, City, Province"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentCustomer.companyAddress || "N/A"}
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("contacts")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "contacts"
                    ? "bg-[#FFCB62] text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
                }`}
              >
                Contacts ({currentCustomer.contacts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quotations")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "quotations"
                    ? "bg-[#FFCB62] text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
                }`}
              >
                Quotations History ({quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "invoices"
                    ? "bg-[#FFCB62] text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
                }`}
              >
                Invoices History ({invoices.length})
              </button>
            </div>

            {/* TAB 1: CONTACTS */}
            {activeTab === "contacts" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Associated Contacts
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={onAddContact}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" /> Add Contact
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {currentCustomer.contacts?.length === 0 ||
                  !currentCustomer.contacts ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs italic shadow-xs">
                      No contacts added yet.
                    </div>
                  ) : (
                    currentCustomer.contacts?.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                              {contact.name}
                            </span>
                            {contact.position && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                ({contact.position})
                              </span>
                            )}
                            {contact.isPrimary && (
                              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                            {contact.email || "No email"} •{" "}
                            {contact.phone || "No phone"}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditContact(contact)}
                            title="Edit Contact"
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteContact(contact.contactId)}
                              title="Delete Contact"
                              className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-all cursor-pointer border border-rose-200/60 dark:border-rose-900/60 shadow-2xs"
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
            )}

            {/* TAB 2: QUOTATIONS HISTORY */}
            {activeTab === "quotations" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Past Quotations (Click to View)
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {loadingHistory ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Loading quotations...
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs italic shadow-xs">
                      No quotations found for this customer.
                    </div>
                  ) : (
                    quotations.map((q) => (
                      <div
                        key={q.quotationId}
                        onClick={() => setSelectedQuotation(q)}
                        className="p-4 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {q.quotationNumber}
                          </span>
                          <p className="text-slate-400 font-medium">
                            Created:{" "}
                            {new Date(q.createdAt).toLocaleDateString()} •
                            Status:{" "}
                            <strong className="text-amber-500">
                              {q.status}
                            </strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {currency(q.totalAmount)}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-amber-500 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: INVOICES HISTORY */}
            {activeTab === "invoices" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Past Invoices & Billing Statements (Click to View)
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {loadingHistory ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Loading invoices...
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs italic shadow-xs">
                      No invoices found for this customer.
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div
                        key={inv.invoiceId}
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-4 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {inv.invoiceNumber}
                          </span>
                          <p className="text-slate-400 font-medium">
                            Date: {new Date(inv.createdAt).toLocaleDateString()}{" "}
                            • Status:{" "}
                            <span
                              className={
                                inv.status === "Paid"
                                  ? "text-emerald-500 font-bold"
                                  : "text-amber-500 font-bold"
                              }
                            >
                              {inv.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {currency(inv.totalAmount)}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-amber-500 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>

      {selectedQuotation && (
        <QuotationDetailsModal
          quotation={selectedQuotation}
          loadingPdfId={loadingPdfId}
          downloadingPdfId={downloadingPdfId}
          onClose={() => setSelectedQuotation(null)}
          onViewPdf={(id, num) => handleViewQuotationPdf(id, num)}
          onDownloadPdf={(e, q) => handleDownloadQuotationPdf(e, q)}
          onOpenEmail={(q) => {
            onClose();
            setSelectedQuotation(null);
            onOpenEmailQuotation?.(q);
          }}
          onEdit={(q) => {
            onClose();
            setSelectedQuotation(null);
            onEditQuotation?.(q);
          }}
          onDeleteQuotation={(id) => handleDeleteQuotation(id)}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownloadPdf={handleDownloadPdf}
          onPreviewPdf={(id, num) => handlePreviewPdf(id, num)}
          onOpenEmail={() => {}}
          onOpenPayment={() => {}}
          onDeleteInvoice={handleDeleteInvoice}
        />
      )}

      {/* Embedded PdfPreviewModal component */}
      <PdfPreviewModal
        isOpen={Boolean(previewPdfUrl)}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        filename={previewPdfFilename}
        onClose={() => setPreviewPdfUrl(null)}
      />
    </>
  );
};
