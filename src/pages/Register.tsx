import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import {
  Lock,
  User,
  Mail,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Calls relative /auth/register against baseURL (".../api"), resolving to /api/auth/register
      await api.post("/auth/register", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        role: isAdmin ? "Admin" : "User",
      });

      toast.success(
        `User account created successfully as ${isAdmin ? "Admin" : "User"}`,
      );

      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data;
        if (typeof responseData === "string") {
          setError(responseData);
        } else if (responseData && typeof responseData === "object") {
          setError(
            (responseData as { message?: string; title?: string }).message ||
              (responseData as { message?: string; title?: string }).title ||
              "User registration failed",
          );
        } else {
          setError("User registration failed");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-[#F9B53F] text-xs font-bold uppercase tracking-wider mb-3">
          <UserPlus className="w-3.5 h-3.5" /> Administration
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Create New User
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Provision a new team member account with portal access.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-4 rounded-xl mb-6 text-center animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="janedoe"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@fireflycraftsph.com"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all"
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

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white focus:ring-4 focus:ring-[#FFCB62]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Admin Toggle Section */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 my-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-[#F9B53F]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Grant Administrator Privileges
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {isAdmin
                    ? "User will have full access to manage users and portal settings."
                    : "User will have standard staff portal access."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAdmin(!isAdmin)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAdmin ? "bg-[#F9B53F]" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAdmin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-amber-400 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? "Creating User..." : "Create Account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
