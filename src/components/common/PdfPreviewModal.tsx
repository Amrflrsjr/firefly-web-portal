import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";

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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 1000);
  };

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
              onClick={handleDownload}
              className={`inline-flex items-center justify-center gap-2 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isDownloading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <Download className="w-4 h-4 text-slate-500" />
              )}{" "}
              Download PDF
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
