import React, { useEffect, useState } from "react";
import { quotationApi } from "../../api/quotations";
import type { EmailPreviewDto } from "../../types/quotation";
import { X, Send, Mail, Paperclip, AlertCircle, RefreshCw } from "lucide-react";
import { ConfirmModal } from "../common/ConfirmModal"; // Adjust import path if needed

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

  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      try {
        const data = await quotationApi.getEmailPreview(quotationId);
        if (!isMounted) return;

        setPreview(data);

        // 1. Extract recipients array
        const recipientList = data.recipients || data.recipientEmails || [];
        setRecipients(recipientList.join(", "));

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = recipients
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (emailList.length === 0) {
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

    const emailList = recipients
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      await quotationApi.sendEmail(quotationId, emailList, body, subject);
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
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Email Quotation
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  Dispatch official PDF proposal directly to client inbox
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
                Loading email preview...
              </div>
            ) : (
              <form
                id="email-quotation-form"
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                {/* Recipients Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Recipients (comma separated){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={sending}
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="client@company.com, contact@company.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                  />
                </div>

                {/* Subject Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={sending}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] transition-all disabled:opacity-60"
                  />
                </div>

                {/* Message Body Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Message Body
                  </label>
                  <textarea
                    rows={6}
                    disabled={sending}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
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
                        {pdfFileName}
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
                form="email-quotation-form"
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
