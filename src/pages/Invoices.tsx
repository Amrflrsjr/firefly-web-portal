import React, { useEffect, useState } from "react";
import api from "../api/axios";
import type { InvoiceResponseDto, RecordPaymentDto } from "../types/invoice";
import type { QuotationResponseDto } from "../types/quotation";
import {
  Receipt,
  Search,
  Plus,
  X,
  ChevronRight,
  DollarSign,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import axios from "axios";

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number>(0);

  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceResponseDto | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] =
    useState<InvoiceResponseDto | null>(null);

  // Payment Form
  const [paymentData, setPaymentData] = useState<RecordPaymentDto>({
    amount: 0,
    paymentMethod: "Bank Transfer",
    referenceNumber: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      const [invRes, quoteRes] = await Promise.all([
        api.get<InvoiceResponseDto[]>("/invoices"),
        api.get<QuotationResponseDto[]>("/quotations"),
      ]);
      setInvoices(invRes.data);
      setQuotations(quoteRes.data);
      setApiError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch invoices:", err);
      if (axios.isAxiosError(err)) {
        setApiError(
          err.response?.data?.message ||
            err.message ||
            "Failed to connect to API",
        );
      } else {
        setApiError("An unexpected error occurred while loading invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const [invRes, quoteRes] = await Promise.all([
          api.get<InvoiceResponseDto[]>("/invoices"),
          api.get<QuotationResponseDto[]>("/quotations"),
        ]);
        if (isSubscribed) {
          setInvoices(invRes.data);
          setQuotations(quoteRes.data);
          setApiError(null);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          if (axios.isAxiosError(err)) {
            setApiError(
              err.response?.data?.message ||
                err.message ||
                "Failed to fetch data",
            );
          } else {
            setApiError("An unexpected error occurred");
          }
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleConvertFromQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotationId) return;

    setSaving(true);
    setFormError("");

    try {
      await api.post("/invoices/from-quotation", {
        quotationId: selectedQuotationId,
      });
      setIsConvertOpen(false);
      setSelectedQuotationId(0);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to convert quotation");
      } else {
        setFormError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPaymentModal = (inv: InvoiceResponseDto) => {
    setPaymentInvoice(inv);
    setPaymentData({
      amount: inv.balanceDue ?? 0,
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    setSaving(true);
    setFormError("");

    try {
      await api.post(
        `/invoices/${paymentInvoice.invoiceId}/payments`,
        paymentData,
      );
      setIsPaymentOpen(false);
      setPaymentInvoice(null);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to record payment");
      } else {
        setFormError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.customerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Invoices & Payments
          </h1>
          <p className="text-sm text-slate-500">
            Convert approved estimates to invoices and record customer payments
          </p>
        </div>
        <button
          onClick={() => setIsConvertOpen(true)}
          className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Convert Quotation to Invoice
        </button>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No invoices found. Convert an existing quotation to generate an
            invoice.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Paid / Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.invoiceId}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#F9B53F]" />
                      {inv.invoiceNumber}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">
                      {inv.customerName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Quote #{inv.quotationNumber}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">
                    PHP {(inv.totalAmount ?? 0).toFixed(2)}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    <div className="text-emerald-700 font-semibold">
                      Paid: PHP {(inv.paidAmount ?? 0).toFixed(2)}
                    </div>
                    <div className="text-red-600 font-bold">
                      Due: PHP {(inv.balanceDue ?? 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        inv.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : inv.status === "Partially Paid"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {(inv.balanceDue ?? 0) > 0 && (
                      <button
                        onClick={() => handleOpenPaymentModal(inv)}
                        className="px-2.5 py-1 text-xs font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Convert Quotation Modal */}
      {isConvertOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                Convert Quotation to Invoice
              </h2>
              <button
                onClick={() => setIsConvertOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleConvertFromQuotation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Select Quotation *
                </label>
                <select
                  required
                  value={selectedQuotationId}
                  onChange={(e) =>
                    setSelectedQuotationId(parseInt(e.target.value))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                >
                  <option value={0}>-- Select Quotation --</option>
                  {quotations.map((q) => (
                    <option key={q.quotationId} value={q.quotationId}>
                      {q.quotationNumber} - {q.customerName} (PHP{" "}
                      {(q.totalAmount ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConvertOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedQuotationId}
                  className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Converting..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentOpen && paymentInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Record Payment
                </h2>
                <p className="text-xs text-slate-500">
                  {paymentInvoice.invoiceNumber} • Balance: PHP{" "}
                  {(paymentInvoice.balanceDue ?? 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Payment Amount (PHP) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentInvoice.balanceDue}
                  required
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                >
                  <option value="Bank Transfer">
                    Bank Transfer (GCash / Maya / BDO)
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Reference # / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCash Ref #1029384"
                  value={paymentData.referenceNumber}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      referenceNumber: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || paymentData.amount <= 0}
                  className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Drawer */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedInvoice.invoiceNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedInvoice.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment History */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Payment Transactions
              </p>
              {selectedInvoice.payments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedInvoice.payments?.map((p) => (
                    <div
                      key={p.paymentId}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          {p.paymentMethod}
                        </div>
                        <div className="text-xs text-slate-400">
                          Ref: {p.referenceNumber || "N/A"}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-700">
                        + PHP {(p.amount ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-bold text-slate-700">
                Remaining Balance Due:
              </span>
              <span className="font-mono text-base font-bold text-red-600">
                PHP {(selectedInvoice.balanceDue ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
