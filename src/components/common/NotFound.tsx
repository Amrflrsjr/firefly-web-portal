import React from "react";
import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft, Sparkles } from "lucide-react";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-0 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100/80 p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Subtle background glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Badge */}
        <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] border border-amber-200/60 shadow-inner mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200/60">
            <Sparkles className="w-3.5 h-3.5 text-[#F9B53F]" />
            <span>Error 404</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is
            temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200/80 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
