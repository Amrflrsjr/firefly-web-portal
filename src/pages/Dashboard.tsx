import React, { useEffect, useState } from "react";
import api from "../api/axios";
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Receipt,
  Package,
  Trash2,
  ArrowRight,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Activity,
  Percent,
  User,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  date: string;
  amount: number;
}

interface DashboardMetrics {
  totalRevenue: number;
  unpaidCount: number;
  activeQuotesCount: number;
  acceptedQuotesCount: number;
  totalCustomersCount: number;
  corporateCustomersCount: number;
  personalCustomersCount: number;
  totalPeriodRevenue: number;
  chartData: ChartPoint[];
}

type ChartTimeRange = "7d" | "30d" | "90d" | "all";

export const Dashboard: React.FC = () => {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>("30d");

  // Fetch pre-aggregated server-side metrics
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/dashboard/metrics", {
          params: { timeRange: chartTimeRange },
        });

        if (isMounted) {
          setMetrics(response.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (axios.isAxiosError(err)) {
            setError(
              err.response?.data?.message || "Failed to load dashboard metrics",
            );
          } else {
            setError("An unexpected error occurred");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardMetrics();

    return () => {
      isMounted = false;
    };
  }, [chartTimeRange]);

  if (loading && !metrics) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 font-medium text-sm p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        Loading executive dashboard overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 sm:mx-0 bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold bg-white px-4 py-2 rounded-xl border border-rose-200 shadow-2xs hover:bg-rose-100 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = metrics?.chartData || [];

  // Compute conversion rates or ratios for the Health Metrics Card
  const totalInvoicesApprox =
    (metrics?.totalRevenue ? 1 : 0) + (metrics?.unpaidCount || 0);
  const collectionRate =
    totalInvoicesApprox > 0
      ? Math.round(
          ((metrics?.totalRevenue ? 1 : 0) / totalInvoicesApprox) * 100,
        )
      : 100;

  const totalQuotesApprox =
    (metrics?.activeQuotesCount || 0) + (metrics?.acceptedQuotesCount || 0);
  const estimateAcceptanceRate =
    totalQuotesApprox > 0
      ? Math.round(
          ((metrics?.acceptedQuotesCount || 0) / totalQuotesApprox) * 100,
        )
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Business Command Center</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Welcome back, {username || "Admin"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Here is your real-time business health metrics, financial
              overview, and quick catalog shortcuts for today.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Estimate</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Performance Indicators Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Paid Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Paid Revenue
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 text-[#F9B53F] flex items-center justify-center border border-amber-100/60 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
              ₱
              {(metrics?.totalRevenue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 sm:mt-1">
              Fully settled collections
            </p>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Unpaid Invoices
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics?.unpaidCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 sm:mt-1">
              Pending remittances
            </p>
          </div>
        </div>

        {/* Active Estimates */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Estimates
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics?.activeQuotesCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 sm:mt-1">
              Sent or draft quotes
            </p>
          </div>
        </div>

        {/* Accepted Estimates */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Accepted Estimates
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics?.acceptedQuotesCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 sm:mt-1">
              Ready for invoice
            </p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Clients
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics?.totalCustomersCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 sm:mt-1">
              Registered accounts
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Area Chart (Left 2 Cols) & Analytics Cards Stack (Right Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Income Trend Area Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex flex-col justify-between">
          <div className="space-y-4 pb-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Income & Collection Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Collected in Period:{" "}
                  <span className="font-mono font-bold text-slate-700">
                    ₱
                    {(metrics?.totalPeriodRevenue || 0).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto">
                {(
                  [
                    { id: "7d", label: "7D" },
                    { id: "30d", label: "30D" },
                    { id: "90d", label: "90D" },
                    { id: "all", label: "All" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setChartTimeRange(tab.id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      chartTimeRange === tab.id
                        ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 h-80 w-full">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 text-xs italic">
                <BarChart3 className="w-5 h-5 text-slate-300" />
                <span>No collections recorded in this range.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F9B53F" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#F9B53F"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                            <p className="font-bold text-amber-300">{label}</p>
                            <p className="font-mono text-sm font-black">
                              ₱
                              {Number(payload[0].value).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#F9B53F"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column Stack: Performance Health & Client Demographics */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Performance Health Ratios Card */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Performance Health
                </h2>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F9B53F] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Key operational conversion benchmarks
              </p>
            </div>

            <div className="py-5 space-y-4">
              {/* Metric 1: Invoice Collection Efficiency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Collection Rate
                  </span>
                  <span className="font-mono text-slate-900">
                    {collectionRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Estimate Conversion Velocity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Estimate Acceptance
                  </span>
                  <span className="font-mono text-slate-900">
                    {estimateAcceptanceRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${estimateAcceptanceRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Active Portfolio Ratio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-600" />
                    Pending Invoices Load
                  </span>
                  <span className="font-mono text-slate-900">
                    {metrics?.unpaidCount || 0} active
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(((metrics?.unpaidCount || 0) / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client Demographics Card */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Client Demographics
                </h2>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Corporate vs. Personal account ratio
              </p>
            </div>

            <div className="py-5 space-y-4">
              {/* Corporate Accounts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    Corporate Accounts
                  </span>
                  <span className="font-mono text-slate-900">
                    {metrics?.corporateCustomersCount ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics?.totalCustomersCount &&
                        metrics.totalCustomersCount > 0
                          ? ((metrics.corporateCustomersCount ?? 0) /
                              metrics.totalCustomersCount) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Personal Accounts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Personal Accounts
                  </span>
                  <span className="font-mono text-slate-900">
                    {metrics?.personalCustomersCount ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics?.totalCustomersCount &&
                        metrics.totalCustomersCount > 0
                          ? ((metrics.personalCustomersCount ?? 0) /
                              metrics.totalCustomersCount) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Directory</span>
              <span className="font-mono font-bold text-slate-800">
                {metrics?.totalCustomersCount ?? 0} Accounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Sleek & Compact Navigation Hub */}
      <div className="space-y-3 pt-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Navigation Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quick links to manage your application modules
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Customers */}
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                  Customers
                </h3>
                <p className="text-[10px] text-slate-400">Directory</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Products */}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-2xs">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                  Products
                </h3>
                <p className="text-[10px] text-slate-400">Catalog</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Quotations */}
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                  Quotations
                </h3>
                <p className="text-[10px] text-slate-400">Estimates</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Invoices */}
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-2xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                  Invoices
                </h3>
                <p className="text-[10px] text-slate-400">Billing</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Archive / Trash */}
          <button
            type="button"
            onClick={() => navigate("/trash")}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-2xs">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                  Archive
                </h3>
                <p className="text-[10px] text-slate-400">Trash & Recovery</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};
