import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, Mail, FileText, Loader2 } from "lucide-react";
import type {
  InvoiceResponseDto,
  EmailPreviewDto,
  SendEmailRequestDto,
} from "../../types/invoice";

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

  const [preview, setPreview] = useState<EmailPreviewDto | null>(null);
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
    // Removed the else block that was causing the synchronous setState warning

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
      // Filter out empty email fields
      const payload: SendEmailRequestDto = {
        ...emailData,
        recipientEmails: emailData.recipientEmails.filter(
          (email) => email.trim() !== "",
        ),
      };

      await api.post(`/invoices/${invoice.invoiceId}/send-email`, payload);
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">
              Send Invoice via Email
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Generating preview...</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                To: (Recipients)
              </label>
              <div className="space-y-2">
                {emailData.recipientEmails.map((email, idx) => (
                  <input
                    key={idx}
                    type="email"
                    required={idx === 0} // Only first is required
                    value={email}
                    onChange={(e) => handleEmailChange(idx, e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addEmailField}
                className="mt-1 text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add another recipient
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Message Body
              </label>
              <textarea
                required
                rows={5}
                value={emailData.body}
                onChange={(e) =>
                  setEmailData({ ...emailData, body: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-white rounded shadow-sm border border-slate-200">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {preview?.attachmentFileName ||
                    `Invoice_${invoice.invoiceNumber}.pdf`}
                </p>
                <p className="text-xs text-slate-500">
                  Auto-generated PDF attachment
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
