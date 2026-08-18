import React, { useState } from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { X } from "lucide-react";

interface EditQuotationStatusModalProps {
  quotation: QuotationResponseDto;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (quotationId: number, status: string) => void;
}

export const EditQuotationStatusModal: React.FC<
  EditQuotationStatusModalProps
> = ({ quotation, saving, error, onClose, onSubmit }) => {
  const [status, setStatus] = useState(quotation.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(quotation.quotationId, status);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Update Status</h2>
            <p className="text-xs font-mono text-slate-500">
              {quotation.quotationNumber}
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Status State
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 capitalize font-medium"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>
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
              disabled={saving}
              className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer"
            >
              {saving ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
