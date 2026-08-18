import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";
import { Lock, User } from "lucide-react";

export const Login: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
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

      login(response.data.token, usernameInput);
      navigate("/customers");
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-firefly-primary/20 mb-3">
            <span className="text-2xl font-black text-firefly-secondary">
              F
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Firefly Crafts PH
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Business Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-firefly-secondary focus:ring-2 focus:ring-[#FFCB62]/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-firefly-secondary focus:ring-2 focus:ring-[#FFCB62]/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-firefly-primary hover:bg-firefly-secondary text-slate-900 font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};
