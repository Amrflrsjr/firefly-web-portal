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
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Document Preview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download={filename}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
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
