import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import {
  X,
  Mail,
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
    setShowConfirm(false); // Hide ConfirmModal immediately
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Send Invoice via Email
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  Dispatch official PDF invoice directly to client inbox
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={sending}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/40 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#F9B53F]" />
                Generating email preview...
              </div>
            ) : (
              <form
                id="email-invoice-form"
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                {/* Dynamic Recipients Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Recipients <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addEmailField}
                      disabled={sending}
                      className="text-[10px] font-extrabold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" /> Add Recipient
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
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                        />
                        {emailData.recipientEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(idx)}
                            disabled={sending}
                            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
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
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:border-[#F9B53F] resize-none transition-all disabled:opacity-60"
                  />
                </div>

                {/* Attached PDF Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-500 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">
                        Attached PDF Document
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Invoice_{invoice.invoiceNumber}.pdf
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-full">
                    Auto-Attached
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer Actions */}
          {!loading && (
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-slate-200/80 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                form="email-invoice-form"
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending Email..." : "Send Email"}
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
