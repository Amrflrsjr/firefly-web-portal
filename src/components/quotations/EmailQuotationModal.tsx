import React, { useEffect, useState } from "react";
import { quotationApi } from "../../api/quotations";
import type { EmailPreviewDto } from "../../types/quotation";
import {
  X,
  Send,
  Mail,
  Paperclip,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "../common/ConfirmModal";

interface EmailQuotationModalProps {
  quotationId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmailQuotationModal: React.FC<EmailQuotationModalProps> = ({
  quotationId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState<EmailPreviewDto | null>(null);

  const [recipientEmails, setRecipientEmails] = useState<string[]>([""]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      try {
        const data = await quotationApi.getEmailPreview(quotationId);
        if (!isMounted) return;

        setPreview(data);

        // 1. Extract recipients array using the requested structure
        const recipientList = data.recipients || data.recipientEmails || [];
        setRecipientEmails(recipientList.length > 0 ? recipientList : [""]);

        // 2. Extract quotation number safely
        const qNum =
          data.documentNumber ||
          data.quotationNumber ||
          (quotationId ? `QT-${quotationId}` : "");

        const customer = data.customerName || "Customer";
        const contactPerson = data.contactName || "Valued Customer";

        // 3. Subject line
        const defaultSubject =
          data.subject && data.subject.trim().length > 0
            ? data.subject
            : `Quotation #${qNum} - ${customer}`;
        setSubject(defaultSubject);

        // 4. Body text
        if (data.body && data.body.trim().length > 0) {
          setBody(data.body);
        } else {
          const formattedTotal =
            data.totalAmount !== undefined
              ? new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(data.totalAmount)
              : "₱0.00";

          const generatedBody = `Dear ${contactPerson},

Please find attached quotation #${qNum} for ${customer}.

Quotation Details:
--------------------------------------------------
Quotation Number : #${qNum}
Total Amount     : ${formattedTotal}
--------------------------------------------------

The complete item breakdown and terms are included in the attached PDF file.

Please feel free to reach out if you have any questions or require adjustments.

Best regards,
Firefly Team`;

          setBody(generatedBody);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load email preview.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [quotationId]);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...recipientEmails];
    newEmails[index] = value;
    setRecipientEmails(newEmails);
  };

  const addEmailField = () => {
    setRecipientEmails([...recipientEmails, ""]);
  };

  const removeEmailField = (index: number) => {
    const newEmails = recipientEmails.filter((_, i) => i !== index);
    setRecipientEmails(newEmails.length > 0 ? newEmails : [""]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = recipientEmails.filter((email) => email.trim() !== "");

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

    const validEmails = recipientEmails.filter((email) => email.trim() !== "");

    try {
      await quotationApi.sendEmail(quotationId, validEmails, body, subject);
      onSuccess();
    } catch {
      setError("Failed to send email. Check SMTP setup or recipient address.");
    } finally {
      setSending(false);
    }
  };

  const displayQNum =
    preview?.documentNumber || preview?.quotationNumber || `${quotationId}`;

  const pdfFileName =
    preview?.attachmentFileName || `Quotation_${displayQNum}.pdf`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
          {/* Top Accent Gradient Bar */}
          <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-[#F9B53F] dark:text-amber-400 shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Email Quotation
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
                  Dispatch official PDF proposal directly to client inbox
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={sending}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/40 dark:bg-slate-950/40 space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#F9B53F]" />
                Loading email preview...
              </div>
            ) : (
              <form
                id="email-quotation-form"
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                {/* Dynamic Recipients Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                      Recipients <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addEmailField}
                      disabled={sending}
                      className="text-[10px] font-extrabold text-[#F9B53F] dark:text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" /> Add Recipient
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recipientEmails.map((email, idx) => (
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
                          className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                        />
                        {recipientEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(idx)}
                            disabled={sending}
                            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={sending}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                  />
                </div>

                {/* Message Body Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    disabled={sending}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs font-medium text-slate-800 dark:text-slate-100 leading-relaxed focus:outline-none focus:border-[#F9B53F] resize-none transition-all disabled:opacity-60 font-mono"
                  />
                </div>

                {/* Attached PDF Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Attached PDF Document
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        {pdfFileName}
                      </div>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-1 rounded-full shrink-0">
                    Auto-Attached
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer Actions */}
          {!loading && (
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                form="email-quotation-form"
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending Email..." : "Send Quotation"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Send Quotation Email"
        message={`Are you sure you want to send quotation #${displayQNum} to the specified recipient(s)?`}
        confirmText="Send Now"
        loading={sending}
        onConfirm={executeSendEmail}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
};
