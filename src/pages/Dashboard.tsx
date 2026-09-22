import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Receipt,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Activity,
  Percent,
  User,
  RefreshCw,
  X,
  ArrowRight,
  Building2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  date: string;
  amount: number;
}

interface InvoiceStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

interface AgingBucket {
  range: "0-30" | "31-60" | "61-90" | "90+";
  amount: number;
  count: number;
}

interface TopCustomer {
  customerName: string;
  totalRevenue: number;
}

interface MonthlyRevenue {
  month: string;
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
  invoiceStatusBreakdown: InvoiceStatusBreakdown[];
  agingBuckets: AgingBucket[];
  topCustomers: TopCustomer[];
  monthlyRevenue: MonthlyRevenue[];
}

type ChartTimeRange = "7d" | "30d" | "90d" | "all";
type ModalType =
  | "revenue"
  | "unpaid"
  | "activeQuotes"
  | "acceptedQuotes"
  | "customers"
  | "performance"
  | "demographics"
  | null;

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Dashboard: React.FC = () => {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>("30d");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Fetch pre-aggregated server-side metrics
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardMetrics = async () => {
      if (metrics) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
          setRefreshing(false);
        }
      }
    };

    fetchDashboardMetrics();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTimeRange]);

  const chartData = useMemo(
    () => metrics?.chartData || [],
    [metrics?.chartData],
  );

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

  // Highest single collection day within the selected range
  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, point) =>
      point.amount > max.amount ? point : max,
    );
  }, [chartData]);

  const totalCustomers = metrics?.totalCustomersCount || 0;
  const corporateCount = metrics?.corporateCustomersCount || 0;
  const personalCount = metrics?.personalCustomersCount || 0;
  const corporatePct =
    totalCustomers > 0 ? (corporateCount / totalCustomers) * 100 : 0;
  const personalPct =
    totalCustomers > 0 ? (personalCount / totalCustomers) * 100 : 0;

  const conversionBarData = [
    {
      category: "Draft/Sent",
      count: metrics?.activeQuotesCount || 0,
    },
    {
      category: "Approved",
      count: metrics?.acceptedQuotesCount || 0,
    },
  ];

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Loading skeleton
  if (loading && !metrics) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0">
        <div className="h-40 sm:h-44 rounded-xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-32 rounded-xl bg-slate-100 dark:bg-slate-850 animate-pulse ${
                i === 0 ? "col-span-2 xl:col-span-1" : ""
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
          <div className="space-y-6">
            <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
            <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 sm:mx-0 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-800 shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      id: "revenue" as ModalType,
      label: "Paid Revenue",
      value: currency(metrics?.totalRevenue || 0),
      caption: "Fully settled collections",
      captionClass: "text-emerald-600 dark:text-emerald-400",
      icon: TrendingUp,
      iconClass:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
      wide: true,
    },
    {
      id: "unpaid" as ModalType,
      label: "Unpaid Invoices",
      value: metrics?.unpaidCount || 0,
      caption: "Pending remittances",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: Clock,
      iconClass:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
    },
    {
      id: "activeQuotes" as ModalType,
      label: "Active Estimates",
      value: metrics?.activeQuotesCount || 0,
      caption: "Sent or draft quotes",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: FileText,
      iconClass:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
    },
    {
      id: "acceptedQuotes" as ModalType,
      label: "Accepted Estimates",
      value: metrics?.acceptedQuotesCount || 0,
      caption: "Ready for invoice",
      captionClass: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
    },
    {
      id: "customers" as ModalType,
      label: "Active Clients",
      value: totalCustomers,
      caption: "Registered accounts",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: Users,
      iconClass:
        "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Business Command Center</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="truncate">{today}</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white wrap-break-word">
              {getGreeting()}, {username || "Admin"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Here is your real-time business health metrics, financial
              overview, and quick catalog shortcuts for today. Click any metric
              card or chart block to inspect detailed analytics.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {refreshing && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <span>Create Estimate</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Performance Indicators Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => setActiveModal(kpi.id)}
            className={`relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between group cursor-pointer ${
              kpi.wide ? "col-span-2 xl:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {kpi.label}
              </span>
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border group-hover:scale-105 transition-transform shrink-0 ${kpi.iconClass}`}
              >
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 min-w-0">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight tabular-nums truncate">
                {kpi.value}
              </h3>
              <p
                className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 flex items-center justify-between gap-1 ${kpi.captionClass}`}
              >
                <span className="truncate">{kpi.caption}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 text-amber-600 dark:text-amber-400 font-bold transition-opacity shrink-0">
                  View &rarr;
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Area Chart & Analytics Cards Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Income Trend Area Chart */}
        <div
          onClick={() => setActiveModal("revenue")}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between cursor-pointer group hover:border-amber-400/50 hover:-translate-y-0.5 transition-all min-w-0"
        >
          <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    Income &amp; Collection Trend
                  </h2>
                  <span className="text-xs text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity shrink-0">
                    Inspect Report &rarr;
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Collected:{" "}
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {currency(metrics?.totalPeriodRevenue || 0)}
                    </span>
                  </p>
                  {peakDay && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Peak day:{" "}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {peakDay.date}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto border border-slate-200 dark:border-slate-700 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
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
                    className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      chartTimeRange === tab.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-600"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 h-80 w-full min-w-0">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 text-xs bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    No collection data recorded yet
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Settled payments will automatically populate this trend
                    chart.
                  </span>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#D97706"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#D97706"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#334155"
                    strokeOpacity={0.15}
                    strokeDasharray="4 8"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value) =>
                      `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                    }
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#D97706",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                            <p className="font-bold text-amber-400">{label}</p>
                            <p className="font-mono text-sm font-bold tabular-nums">
                              {currency(Number(payload[0].value))}
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
                    stroke="#D97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{
                      r: 5,
                      fill: "#D97706",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column Stack: Performance Health & Client Demographics */}
        <div className="space-y-6 flex flex-col justify-between min-w-0">
          {/* Performance Health Ratios Card */}
          <div
            onClick={() => setActiveModal("performance")}
            className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between cursor-pointer group hover:border-amber-400/50 hover:-translate-y-0.5 transition-all min-w-0"
          >
            <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    Performance Health
                  </h2>
                  <span className="text-xs text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity shrink-0">
                    Details &rarr;
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Key operational conversion benchmarks
              </p>
            </div>

            <div className="py-5 space-y-4 min-w-0">
              {/* Metric 1: Invoice Collection Efficiency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate pr-2">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Collection Rate</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums font-bold shrink-0">
                    {collectionRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-lg overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-lg transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Estimate Conversion Velocity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate pr-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">Estimate Acceptance</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums font-bold shrink-0">
                    {estimateAcceptanceRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-lg overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-lg transition-all duration-500"
                    style={{ width: `${estimateAcceptanceRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Active Portfolio Ratio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate pr-2">
                    <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">Pending Invoices Load</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums font-bold shrink-0">
                    {metrics?.unpaidCount || 0} active
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-lg overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${Math.min(((metrics?.unpaidCount || 0) / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quotation Conversion Chart */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 min-w-0">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 truncate">
                  Quotation Pipeline Distribution
                </div>
                <div className="h-24 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={conversionBarData}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="category"
                        type="category"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={65}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl border border-slate-800">
                                <span className="font-semibold">
                                  {payload[0].payload.category}:{" "}
                                </span>
                                <span className="font-mono font-bold">
                                  {payload[0].value}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        barSize={12}
                        fill="#D97706"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Client Demographics Card */}
          <div
            onClick={() => setActiveModal("demographics")}
            className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between cursor-pointer group hover:border-amber-400/50 hover:-translate-y-0.5 transition-all min-w-0"
          >
            <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    Client Demographics
                  </h2>
                  <span className="text-xs text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity shrink-0">
                    Details &rarr;
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900/60 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Corporate vs. Personal account ratio
              </p>
            </div>

            <div className="py-5 flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Donut ring */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      totalCustomers > 0
                        ? `conic-gradient(#D97706 0% ${corporatePct}%, #6366F1 ${corporatePct}% 100%)`
                        : "#334155",
                  }}
                />
                <div className="absolute inset-1.5 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-none">
                    {totalCustomers}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    Accounts
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 min-w-0 pr-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Corporate</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                    {corporateCount}
                    <span className="text-slate-400 font-normal ml-1">
                      ({Math.round(corporatePct)}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 min-w-0 pr-1">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Personal</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                    {personalCount}
                    <span className="text-slate-400 font-normal ml-1">
                      ({Math.round(personalPct)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Total Directory</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {totalCustomers} Accounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* NEW DETAILED BREAKDOWN CHARDS SECTION                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* 1. Invoice Status Breakdown Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none min-w-0 flex flex-col justify-between">
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              Invoice Status Breakdown
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
              Paid, unpaid, and overdue by amount
            </p>
          </div>
          <div className="pt-6 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.invoiceStatusBreakdown || []}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#334155"
                  strokeOpacity={0.15}
                  strokeDasharray="4 8"
                />
                <XAxis
                  dataKey="status"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                        <p className="font-bold">{label}</p>
                        <p className="font-mono text-sm font-black">
                          {currency(Number(payload[0].value))}
                        </p>
                        <p className="text-slate-400">
                          {payload[0].payload.count} invoices
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {(metrics?.invoiceStatusBreakdown || []).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.status === "Paid"
                          ? "#10B981"
                          : entry.status === "Overdue"
                            ? "#E11D48"
                            : "#D97706"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Receivables Aging Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none min-w-0 flex flex-col justify-between">
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              Receivables Aging
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
              Unpaid invoices categorized by aging risk bucket
            </p>
          </div>
          <div className="pt-6 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.agingBuckets || []}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#334155"
                  strokeOpacity={0.15}
                  strokeDasharray="4 8"
                />
                <XAxis
                  dataKey="range"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                        <p className="font-bold">{label} Days</p>
                        <p className="font-mono text-sm font-black">
                          {currency(Number(payload[0].value))}
                        </p>
                        <p className="text-slate-400">
                          {payload[0].payload.count} invoices
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {(metrics?.agingBuckets || []).map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ["#FCD34D", "#F59E0B", "#DC2626", "#991B1B"][i] ||
                        "#D97706"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top Customers by Revenue Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none min-w-0 flex flex-col justify-between">
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              Top Customers by Revenue
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
              Highest contributing client accounts
            </p>
          </div>
          <div className="pt-6 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.topCustomers || []}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#334155"
                  strokeOpacity={0.15}
                  strokeDasharray="4 8"
                />
                <XAxis
                  type="number"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <YAxis
                  dataKey="customerName"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                        <p className="font-bold">{label}</p>
                        <p className="font-mono text-sm font-black">
                          {currency(Number(payload[0].value))}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar
                  dataKey="totalRevenue"
                  fill="#6366F1"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Monthly Revenue (12-Month Trend) Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none min-w-0 flex flex-col justify-between">
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              Monthly Revenue Trend
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
              Full-year historical collections performance
            </p>
          </div>
          <div className="pt-6 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.monthlyRevenue || []}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#334155"
                  strokeOpacity={0.15}
                  strokeDasharray="4 8"
                />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                        <p className="font-bold">{label}</p>
                        <p className="font-mono text-sm font-black">
                          {currency(Number(payload[0].value))}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="amount" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DETAILS MODAL OVERLAY                                            */}
      {/* ----------------------------------------------------------------- */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-200 dark:border-amber-800/60 shrink-0">
                  {activeModal === "revenue" && (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {activeModal === "unpaid" && <Clock className="w-4 h-4" />}
                  {activeModal === "activeQuotes" && (
                    <FileText className="w-4 h-4" />
                  )}
                  {activeModal === "acceptedQuotes" && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {activeModal === "customers" && <Users className="w-4 h-4" />}
                  {activeModal === "performance" && (
                    <Activity className="w-4 h-4" />
                  )}
                  {activeModal === "demographics" && (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {activeModal === "revenue" && "Paid Revenue Breakdown"}
                    {activeModal === "unpaid" && "Unpaid Invoices Breakdown"}
                    {activeModal === "activeQuotes" &&
                      "Active Estimates Breakdown"}
                    {activeModal === "acceptedQuotes" &&
                      "Accepted Estimates Breakdown"}
                    {activeModal === "customers" &&
                      "Customer Accounts Breakdown"}
                    {activeModal === "performance" &&
                      "Performance Health Metrics"}
                    {activeModal === "demographics" &&
                      "Client Demographics Analysis"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                    Detailed statistics and records summary
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {activeModal === "revenue" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        Total Settled Amount
                      </span>
                      <p className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-1">
                        {currency(metrics?.totalRevenue || 0)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    This figure represents all successfully collected payments
                    from completed invoices across your platform history. Review
                    individual statements inside the Invoices module.
                  </p>
                </div>
              )}

              {activeModal === "unpaid" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                        Pending Remittances
                      </span>
                      <p className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-1">
                        {metrics?.unpaidCount || 0} Invoices
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    These are invoices dispatched to clients awaiting payment
                    clearance. Check the Invoices page to follow up or update
                    statuses.
                  </p>
                </div>
              )}

              {activeModal === "activeQuotes" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                        Active Quotations
                      </span>
                      <p className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100 mt-1">
                        {metrics?.activeQuotesCount || 0} Draft/Sent
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Quotations currently in draft or sent status awaiting client
                    approval. Navigate to the Quotations hub to edit line items
                    or resend proposals.
                  </p>
                </div>
              )}

              {activeModal === "acceptedQuotes" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        Accepted Proposals
                      </span>
                      <p className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-1">
                        {metrics?.acceptedQuotesCount || 0} Approved
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Quotations approved by clients that are ready to be
                    converted into binding billing invoices.
                  </p>
                </div>
              )}

              {activeModal === "customers" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                        Total Active Accounts
                      </span>
                      <p className="text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-1">
                        {totalCustomers} Clients
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Corporate
                      </span>
                      <p className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                        {corporateCount}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Personal
                      </span>
                      <p className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                        {personalCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "performance" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Collection Rate Efficiency
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {collectionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Estimate Acceptance Velocity
                      </span>
                      <span className="font-mono text-blue-600 font-bold">
                        {estimateAcceptanceRate}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Performance health scores measure how quickly estimates
                    convert into paid revenue. Higher percentages indicate
                    optimal cash flow.
                  </p>
                </div>
              )}

              {activeModal === "demographics" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />{" "}
                        Corporate Accounts
                      </span>
                      <span className="font-mono font-bold">
                        {corporateCount} ({Math.round(corporatePct)}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-500" /> Personal
                        Accounts
                      </span>
                      <span className="font-mono font-bold">
                        {personalCount} ({Math.round(personalPct)}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Demographic distribution helps track whether your customer
                    acquisition strategy leans more towards B2B corporate
                    contracts or direct consumer accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (activeModal === "revenue" || activeModal === "unpaid")
                    navigate("/invoices");
                  else if (
                    activeModal === "activeQuotes" ||
                    activeModal === "acceptedQuotes"
                  )
                    navigate("/quotations");
                  else if (
                    activeModal === "customers" ||
                    activeModal === "demographics"
                  )
                    navigate("/customers");
                  else setActiveModal(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Go to Management Module</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
