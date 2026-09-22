import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import {
  X,
  Paperclip,
  AlertCircle,
  RefreshCw,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  InvoiceResponseDto,
  EmailPreviewDto,
  SendEmailRequestDto,
} from "../../types/invoice";
import toast from "react-hot-toast";
import { ConfirmModal } from "../common/ConfirmModal";

interface Props {
  invoice: InvoiceResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendInvoiceEmailModal: React.FC<Props> = ({
  invoice,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [, setPreview] = useState<EmailPreviewDto | null>(null);
  const [emailData, setEmailData] = useState<SendEmailRequestDto>({
    recipientEmails: [""],
    subject: "",
    body: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (!invoice) return;
      setLoading(true);
      setError("");

      try {
        const res = await api.get<EmailPreviewDto>(
          `/invoices/${invoice.invoiceId}/email-preview`,
        );
        if (isMounted) {
          setPreview(res.data);
          setEmailData({
            recipientEmails: res.data.recipients?.length
              ? res.data.recipients
              : [""],
            subject: res.data.subject || "",
            body: res.data.body || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load email preview.");
          console.error(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (invoice) {
      fetchPreview();
    }

    return () => {
      isMounted = false;
    };
  }, [invoice]);

  if (!invoice) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emailData.recipientEmails.filter(
      (email) => email.trim() !== "",
    );

    if (validEmails.length === 0) {
      setError("Please provide at least one recipient email address.");
      return;
    }

    setError("");
    setShowConfirm(true);
  };

  const executeSendEmail = async () => {
    setShowConfirm(false);
    setSending(true);
    setError("");

    try {
      const payload: SendEmailRequestDto = {
        ...emailData,
        recipientEmails: emailData.recipientEmails.filter(
          (email) => email.trim() !== "",
        ),
      };

      await api.post(`/invoices/${invoice.invoiceId}/send-email`, payload);
      toast.success("Invoice email sent successfully!");
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            "Failed to send email",
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSending(false);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emailData.recipientEmails];
    newEmails[index] = value;
    setEmailData({ ...emailData, recipientEmails: newEmails });
  };

  const addEmailField = () => {
    setEmailData({
      ...emailData,
      recipientEmails: [...emailData.recipientEmails, ""],
    });
  };

  const removeEmailField = (index: number) => {
    const newEmails = emailData.recipientEmails.filter((_, i) => i !== index);
    setEmailData({
      ...emailData,
      recipientEmails: newEmails.length > 0 ? newEmails : [""],
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
          {/* Header matching EmailQuotationModal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Email Invoice
                </h2>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  #{invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch official PDF invoice directly to client inbox
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={sending}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                Loading email preview...
              </div>
            ) : (
              <form
                id="email-invoice-form"
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                {/* Dynamic Recipients Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Recipients <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addEmailField}
                      disabled={sending}
                      className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Recipient
                    </button>
                  </div>
                  <div className="space-y-2">
                    {emailData.recipientEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="email"
                          required={idx === 0}
                          disabled={sending}
                          value={email}
                          onChange={(e) =>
                            handleEmailChange(idx, e.target.value)
                          }
                          placeholder="client@company.com"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all disabled:opacity-60 shadow-2xs"
                        />
                        {emailData.recipientEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(idx)}
                            disabled={sending}
                            className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={sending}
                    value={emailData.subject}
                    onChange={(e) =>
                      setEmailData({ ...emailData, subject: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all disabled:opacity-60 shadow-2xs"
                  />
                </div>

                {/* Message Body */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    disabled={sending}
                    value={emailData.body}
                    onChange={(e) =>
                      setEmailData({ ...emailData, body: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-100 leading-relaxed focus:outline-none focus:border-slate-400 resize-y min-h-36 transition-all disabled:opacity-60 font-mono shadow-2xs"
                  />
                </div>

                {/* Attached PDF Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Attached PDF Document
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Invoice_{invoice.invoiceNumber}.pdf
                      </div>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
                    Auto-Attached
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer Actions */}
          {!loading && (
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                form="email-invoice-form"
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending Email..." : "Send Invoice"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Send Invoice Email"
        message={`Are you sure you want to send invoice #${invoice.invoiceNumber} to the specified recipient(s)?`}
        confirmText="Send Now"
        loading={sending}
        onConfirm={executeSendEmail}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
};
