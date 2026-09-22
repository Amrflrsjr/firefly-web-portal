import React, { useState, useEffect } from "react";
import type { Customer, CustomerContact } from "../../types/customer";
import type { QuotationResponseDto } from "../../types/quotation";
import type { InvoiceResponseDto } from "../../types/invoice";
import { QuotationDetailsModal } from "../quotations/QuotationDetailsModal";
import { InvoiceDetailsModal } from "../invoice/InvoiceDetailsModal";
import { PdfPreviewModal } from "../common/PdfPreviewModal";
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

  const handleSaveProfile = async () => {
    if (!editForm.companyName.trim()) {
      toast.error(
        isPersonal ? "Customer name is required." : "Company name is required.",
      );
      return;
    }

    const payload = {
      ...editForm,
      tin: isPersonal ? "" : editForm.tin,
    };

    try {
      if (onEditCustomer) {
        onEditCustomer(currentCustomer, payload);
      } else {
        await api.put(`/customers/${currentCustomer.customerId}`, payload);
        toast.success("Customer profile updated successfully!");
      }

      setCurrentCustomer((prev) => ({
        ...prev,
        companyName: editForm.companyName,
        companyAddress: editForm.companyAddress,
        tin: isPersonal ? "" : editForm.tin,
      }));

      setIsEditingProfile(false);
    } catch {
      toast.error("Failed to update customer profile.");
    }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
          {/* Flat Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Customer Overview
                  </h2>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          companyName: e.target.value,
                        })
                      }
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs max-w-xs"
                      placeholder={
                        isPersonal ? "Customer Full Name" : "Company Name"
                      }
                    />
                  ) : (
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {currentCustomer.companyName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed view, contacts, and transaction history
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase shadow-2xs ${
                  isPersonal
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
                    : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                }`}
              >
                {isPersonal ? "Individual" : "Corporate"}
              </span>

              {!isEditingProfile ? (
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Tax ID
                  (TIN)
                </span>
                {isEditingProfile ? (
                  isPersonal ? (
                    <div className="text-slate-400 dark:text-slate-500 italic text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 shadow-2xs mt-1"
                    />
                  )
                ) : (
                  <p className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 pt-0.5">
                    {isPersonal
                      ? "Not applicable"
                      : currentCustomer.tin || "N/A"}
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address
                </span>
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs mt-1"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 pt-0.5 leading-relaxed">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "contacts"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Contacts ({currentCustomer.contacts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quotations")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "quotations"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Quotations ({quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "invoices"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Invoices ({invoices.length})
              </button>
            </div>

            {/* TAB 1: CONTACTS */}
            {activeTab === "contacts" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Associated Contacts
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={onAddContact}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-500" /> Add
                    Contact
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentCustomer.contacts?.length === 0 ||
                  !currentCustomer.contacts ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic shadow-2xs">
                      No contacts added yet.
                    </div>
                  ) : (
                    currentCustomer.contacts?.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {contact.name}
                            </span>
                            {contact.position && (
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                ({contact.position})
                              </span>
                            )}
                            {contact.isPrimary && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-normal truncate">
                            {contact.email || "No email"} •{" "}
                            {contact.phone || "No phone"}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditContact(contact)}
                            title="Edit Contact"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteContact(contact.contactId)}
                              title="Delete Contact"
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
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
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Past Quotations (Click to View)
                  </h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {loadingHistory ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Loading quotations...
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic shadow-2xs">
                      No quotations found for this customer.
                    </div>
                  ) : (
                    quotations.map((q) => (
                      <div
                        key={q.quotationId}
                        onClick={() => setSelectedQuotation(q)}
                        className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white group-hover:underline">
                            {q.quotationNumber}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Created:{" "}
                            {new Date(q.createdAt).toLocaleDateString()} •
                            Status:{" "}
                            <span className="font-bold">{q.status}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {currency(q.totalAmount)}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
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
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Past Invoices & Billing Statements (Click to View)
                  </h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {loadingHistory ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Loading invoices...
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic shadow-2xs">
                      No invoices found for this customer.
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div
                        key={inv.invoiceId}
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white group-hover:underline">
                            {inv.invoiceNumber}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Date: {new Date(inv.createdAt).toLocaleDateString()}{" "}
                            • Status:{" "}
                            <span
                              className={
                                inv.status === "Paid"
                                  ? "text-emerald-600 font-bold"
                                  : "text-amber-600 font-bold"
                              }
                            >
                              {inv.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {currency(inv.totalAmount)}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions matching QuotationDetailsModal */}
          <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-2xs"
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
