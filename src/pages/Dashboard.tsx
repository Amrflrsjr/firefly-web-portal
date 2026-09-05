import React, { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
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

  // Highest single collection day within the selected range — a real,
  // non-fabricated signal to surface next to the trend chart.
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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ---------------------------------------------------------------------
  // Loading skeleton — mirrors the final layout so nothing "jumps" in
  // ---------------------------------------------------------------------
  if (loading && !metrics) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0">
        <div className="h-40 sm:h-44 rounded-3xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-32 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-850 animate-pulse ${
                i === 0 ? "col-span-2 xl:col-span-1" : ""
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
          <div className="space-y-6">
            <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
            <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-850 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 sm:mx-0 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 text-slate-700 dark:text-slate-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Paid Revenue",
      value: currency(metrics?.totalRevenue || 0),
      caption: "Fully settled collections",
      captionClass: "text-emerald-600 dark:text-emerald-400",
      icon: TrendingUp,
      iconClass:
        "bg-amber-50 dark:bg-amber-950/50 text-[#DB9A28] dark:text-amber-400 border-amber-100/60 dark:border-amber-800/50",
      accent: "from-amber-400 to-amber-300",
      wide: true,
    },
    {
      label: "Unpaid Invoices",
      value: metrics?.unpaidCount || 0,
      caption: "Pending remittances",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: Clock,
      iconClass:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100/60 dark:border-amber-800/50",
      accent: "from-amber-400 to-amber-300",
    },
    {
      label: "Active Estimates",
      value: metrics?.activeQuotesCount || 0,
      caption: "Sent or draft quotes",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: FileText,
      iconClass:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100/60 dark:border-blue-800/50",
      accent: "from-blue-400 to-blue-300",
    },
    {
      label: "Accepted Estimates",
      value: metrics?.acceptedQuotesCount || 0,
      caption: "Ready for invoice",
      captionClass: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-800/50",
      accent: "from-emerald-400 to-emerald-300",
    },
    {
      label: "Active Clients",
      value: totalCustomers,
      caption: "Registered accounts",
      captionClass: "text-slate-400 dark:text-slate-400",
      icon: Users,
      iconClass:
        "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100/60 dark:border-indigo-800/50",
      accent: "from-indigo-400 to-indigo-300",
    },
  ];

  const navModules = [
    {
      label: "Customers",
      caption: "Directory",
      icon: Building2,
      path: "/customers",
      hoverIcon:
        "group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/50 dark:group-hover:text-indigo-400",
      hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
    },
    {
      label: "Products",
      caption: "Catalog",
      icon: Package,
      path: "/products",
      hoverIcon:
        "group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-950/50 dark:group-hover:text-purple-400",
      hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
    },
    {
      label: "Quotations",
      caption: "Estimates",
      icon: FileText,
      path: "/quotations",
      hoverIcon:
        "group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-400",
      hoverBorder: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    {
      label: "Invoices",
      caption: "Billing",
      icon: Receipt,
      path: "/invoices",
      hoverIcon:
        "group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-400",
      hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    {
      label: "Archive",
      caption: "Trash & Recovery",
      icon: Trash2,
      path: "/trash",
      hoverIcon:
        "group-hover:bg-rose-50 group-hover:text-rose-600 dark:group-hover:bg-rose-950/50 dark:group-hover:text-rose-400",
      hoverBorder: "hover:border-rose-300 dark:hover:border-rose-700",
      wideOnSm: true,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Business Command Center</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, {username || "Admin"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Here is your real-time business health metrics, financial
              overview, and quick catalog shortcuts for today.
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <span>Create Estimate</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Performance Indicators Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none hover:shadow-2xl hover:-translate-y-0.5 transition-all flex flex-col justify-between group ${
              kpi.wide ? "col-span-2 xl:col-span-1" : ""
            }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${kpi.accent} opacity-70`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                {kpi.label}
              </span>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${kpi.iconClass}`}
              >
                <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight tabular-nums truncate">
                {kpi.value}
              </h3>
              <p
                className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 ${kpi.captionClass}`}
              >
                {kpi.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Area Chart (Left 2 Cols) & Analytics Cards Stack (Right Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Income Trend Area Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none flex flex-col justify-between">
          <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Income &amp; Collection Trend
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Collected:{" "}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      {currency(metrics?.totalPeriodRevenue || 0)}
                    </span>
                  </p>
                  {peakDay && (
                    <p className="text-xs text-slate-400 dark:text-slate-400">
                      Peak day:{" "}
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {peakDay.date}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
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
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                      chartTimeRange === tab.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-600"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                </div>
                <span className="italic">
                  No collections recorded in this range.
                </span>
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
                      <stop offset="5%" stopColor="#F9B53F" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#F9B53F"
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
                      stroke: "#F9B53F",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl border border-slate-800 space-y-1">
                            <p className="font-bold text-amber-300">{label}</p>
                            <p className="font-mono text-sm font-black tabular-nums">
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
                    stroke="#F9B53F"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{
                      r: 5,
                      fill: "#F9B53F",
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
        <div className="space-y-6 flex flex-col justify-between">
          {/* Performance Health Ratios Card */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Performance Health
                </h2>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#DB9A28] dark:text-amber-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Key operational conversion benchmarks
              </p>
            </div>

            <div className="py-5 space-y-4">
              {/* Metric 1: Invoice Collection Efficiency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Collection Rate
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {collectionRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Estimate Conversion Velocity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Estimate Acceptance
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {estimateAcceptanceRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${estimateAcceptanceRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Active Portfolio Ratio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Pending Invoices Load
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {metrics?.unpaidCount || 0} active
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Client Demographics
                </h2>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Corporate vs. Personal account ratio
              </p>
            </div>

            <div className="py-5 flex items-center gap-5">
              {/* Donut ring */}
              <div className="relative w-24 h-24 shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      totalCustomers > 0
                        ? `conic-gradient(#F9B53F 0% ${corporatePct}%, #6366F1 ${corporatePct}% 100%)`
                        : "#334155",
                  }}
                />
                <div className="absolute inset-1.75 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums leading-none">
                    {totalCustomers}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase mt-1">
                    Accounts
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Corporate</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                    {corporateCount}
                    <span className="text-slate-400 dark:text-slate-400 font-medium ml-1">
                      ({Math.round(corporatePct)}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Personal</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                    {personalCount}
                    <span className="text-slate-400 dark:text-slate-400 font-medium ml-1">
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

      {/* Modern Sleek & Compact Navigation Hub */}
      <div className="space-y-3 pt-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Navigation Hub
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            Quick links to manage your application modules
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {navModules.map((mod) => (
            <button
              key={mod.label}
              type="button"
              onClick={() => navigate(mod.path)}
              className={`bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                mod.hoverBorder
              } ${mod.wideOnSm ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-all shadow-2xs shrink-0 ${mod.hoverIcon}`}
                >
                  <mod.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white transition-colors truncate">
                    {mod.label}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                    {mod.caption}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
