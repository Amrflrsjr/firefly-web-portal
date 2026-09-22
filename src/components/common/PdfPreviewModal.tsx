import React from "react";
import { X, Download } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  title: string;
  filename: string;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  pdfUrl,
  title,
  filename,
  onClose,
}) => {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      {/* Modal Shell with standardized rounded-xl (12px) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Flat Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Document Preview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download={filename}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 w-full h-full relative">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            title={title}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
