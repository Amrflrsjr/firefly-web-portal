import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, Mail, FileText, Loader2, Trash2, Plus } from "lucide-react";
import type {
  InvoiceResponseDto,
  EmailPreviewDto,
  SendEmailRequestDto,
} from "../../types/invoice";
import toast from "react-hot-toast";

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] font-bold flex items-center justify-center text-xs shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Send Invoice via Email
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3.5 rounded-xl font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#F9B53F]" />
            <p className="text-xs font-semibold">Generating email preview...</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Recipients (To) *
                </label>
                <button
                  type="button"
                  onClick={addEmailField}
                  className="text-xs font-bold text-[#d99723] hover:text-[#b37a18] inline-flex items-center gap-1 transition-colors cursor-pointer"
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
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all"
                    />
                    {emailData.recipientEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(idx)}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Subject *
              </label>
              <input
                type="text"
                required
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Message Body *
              </label>
              <textarea
                required
                rows={4}
                value={emailData.body}
                onChange={(e) =>
                  setEmailData({ ...emailData, body: e.target.value })
                }
                className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all"
              />
            </div>

            {/* Attachment Preview Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-rose-500" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">
                  Invoice_{invoice.invoiceNumber}.pdf
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Auto-generated PDF attachment included
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
