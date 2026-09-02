import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";
import { Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import fireflyLogo from "../assets/Firefly Logo - No BG.png";

export const Login: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username: usernameInput,
        password: password,
      });

      login(response.data.token, response.data.username, response.data.roles);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data || "Invalid username or password");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-950 font-sans selection:bg-[#F9B53F] selection:text-slate-950">
      {/* Left Brand Panel (7 Cols) */}
      <div className="lg:col-span-7 bg-linear-to-br from-slate-900 via-slate-950 to-black p-10 lg:p-20 flex flex-col justify-between relative overflow-hidden border-r border-slate-800/60">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#F9B53F]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

        {/* Top Logo Badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-28 h-auto">
            <img
              src={fireflyLogo}
              alt="Firefly Crafts Logo"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Center Hero Message */}
        <div className="relative z-10 space-y-6 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F9B53F] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> NXF Sticker Shop Portal
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Manage operations <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-amber-200">
              with precision.
            </span>
          </h1>
          <p className="text-slate-400 text-base lg:text-lg leading-relaxed font-normal">
            Your centralized management hub for seamless quotations, invoices,
            customer tracking, and automated business workflows.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-900 pt-6">
          <span>© {new Date().getFullYear()} Firefly Crafts PH</span>
          <span>Mandaue City, Cebu</span>
        </div>
      </div>

      {/* Right Form Panel (5 Cols) */}
      <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-white relative">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Login
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Enter your credentials to access the management portal.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-4 rounded-2xl mb-6 text-center animate-in fade-in duration-200 shadow-2xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-11 pr-11 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-amber-400 text-slate-950 font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
