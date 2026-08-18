import React, { useEffect, useState } from "react";
import { quotationApi } from "../../api/quotations";
import type { EmailPreviewDto } from "../../types/quotation";
import { X, Send, Mail, Paperclip } from "lucide-react";

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

        // 1. Extract recipients array (handles 'recipients' from DocumentEmailPreviewDto)
        const recipientList = data.recipients || data.recipientEmails || [];
        setRecipients(recipientList.join(", "));

        // 2. Extract quotation number safely (handles 'documentNumber' from DocumentEmailPreviewDto)
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
              : "PHP 0.00";

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const emailList = recipients
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (emailList.length === 0) {
      setError("Please provide at least one recipient email address.");
      setSending(false);
      return;
    }

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#F9B53F]" />
            <h2 className="text-lg font-bold text-slate-800">
              Email Quotation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading email preview...
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Recipients (comma separated) *
              </label>
              <input
                type="text"
                required
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="client@company.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-[#FFCB62] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#FFCB62] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Message Body
              </label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-sans leading-relaxed focus:ring-2 focus:ring-[#FFCB62] outline-none"
              />
            </div>

            {/* Attached PDF Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Attached PDF File
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {pdfFileName}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                Included
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send Quotation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
