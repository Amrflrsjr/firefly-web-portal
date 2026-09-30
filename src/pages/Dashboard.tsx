import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BarChart3, Plus, RefreshCw, X } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface ChartPoint {
  date: string;
  amount: number;
  /** Optional: if the backend sends it, the trend chart shows a second series. */
  collected?: number;
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
  totalInvoiced?: number;
  totalOutstanding?: number;
  overdueAmount?: number;
}

type ChartTimeRange = "7d" | "30d" | "90d" | "all";

type ModalState =
  | { kind: "receivables" }
  | { kind: "aging"; range: AgingBucket["range"] }
  | { kind: "status"; status: string }
  | { kind: "billed" }
  | { kind: "months" }
  | { kind: "customer"; name: string }
  | { kind: "estimates"; focus: "active" | "accepted" | "all" }
  | { kind: "clients" };

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const axisMoney = (v: number) =>
  `₱${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}`;

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

const OPEN_STATUSES = new Set(["unpaid", "overdue", "partiallypaid"]);

const STATUS_META: Record<string, { label: string; bar: string }> = {
  paid: { label: "Paid", bar: "bg-emerald-500" },
  closed: { label: "Closed", bar: "bg-indigo-500" },
  unpaid: { label: "Unpaid", bar: "bg-amber-500" },
  partiallypaid: { label: "Partially paid", bar: "bg-sky-500" },
  overdue: { label: "Overdue", bar: "bg-rose-500" },
};

// The Invoices page filters on Paid / Unpaid / PartiallyPaid / Cancelled / Closed.
const invoiceFilterFor = (status: string) => {
  switch (norm(status)) {
    case "paid":
      return "Paid";
    case "closed":
      return "Closed";
    case "partiallypaid":
      return "PartiallyPaid";
    default:
      return "Unpaid";
  }
};

const AGING_META: Record<AgingBucket["range"], { label: string; bar: string }> =
  {
    "0-30": { label: "0–30 days", bar: "bg-amber-300" },
    "31-60": { label: "31–60 days", bar: "bg-amber-500" },
    "61-90": { label: "61–90 days", bar: "bg-orange-600" },
    "90+": { label: "Over 90 days", bar: "bg-rose-600" },
  };

const RANGE_LABEL: Record<ChartTimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const panel =
  "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";
const gridLine = {
  stroke: "#94A3B8",
  strokeOpacity: 0.25,
  strokeDasharray: "3 6",
};

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, action, className = "", children }) => (
  <section className={`${panel} min-w-0 p-4 sm:p-6 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    <div className="mt-4 sm:mt-5">{children}</div>
  </section>
);

const TextLink: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded px-1 text-sm font-medium text-amber-700 hover:underline sm:min-h-0 dark:text-amber-400 ${focusRing}`}
  >
    {children}
  </button>
);

const EmptyState: React.FC<{ title: string; hint: string }> = ({
  title,
  hint,
}) => (
  <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
    <BarChart3 className="h-5 w-5 text-slate-400" aria-hidden />
    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
      {title}
    </p>
    <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
      {hint}
    </p>
  </div>
);

interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: number | string; name?: string }>;
}

const MoneyTip: React.FC<TipProps & { showName?: boolean }> = ({
  active,
  label,
  payload,
  showName,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-lg">
      <p className="mb-1 font-medium text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums">
          {showName && p.name ? `${p.name}: ` : ""}
          <span className="font-semibold">{currency(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

const useIsMobile = (query = "(max-width: 639px)") => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

const Stat: React.FC<{
  label: string;
  value: string;
  hint?: string;
  className?: string;
}> = ({ label, value, hint, className = "" }) => (
  <div
    className={`rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 ${className}`}
  >
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-0.5 wrap-break-word text-base font-semibold tabular-nums text-slate-900 dark:text-white">
      {value}
    </p>
    {hint && (
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    )}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
    {children}
  </h3>
);

const BarRow: React.FC<{
  label: string;
  value: string;
  share: number;
  bar: string;
  hint?: string;
}> = ({ label, value, share, bar, hint }) => (
  <li>
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0 text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={`h-full rounded-full ${bar}`}
        style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }}
      />
    </div>
    {hint && (
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    )}
  </li>
);

const Modal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, footer, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5 dark:border-slate-800">
          <div className="min-w-0">
            <h2
              id="dashboard-modal-title"
              className="wrap-break-word text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${focusRing}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {children}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end dark:border-slate-800">
          {footer}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { username } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>("30d");

  // Backend Month Filter state (defaults to empty so it loads all history or matches existing mock data unless chosen)
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const closeModal = useCallback(() => setModal(null), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardMetrics = async () => {
      setRefreshing((prev) => (metrics !== null ? true : prev));
      if (!metrics) setLoading(true);
      setError(null);
      try {
        const response = await api.get("/dashboard/metrics", {
          params: {
            timeRange: chartTimeRange,
            month: selectedMonth || undefined,
          },
        });
        if (isMounted) setMetrics(response.data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            axios.isAxiosError(err)
              ? err.response?.data?.message ||
                  "Failed to load dashboard metrics"
              : "An unexpected error occurred",
          );
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
  }, [chartTimeRange, selectedMonth, reloadKey]);

  /* ---- Receivables summary (amount based, not count based) -------------- */
  const summary = useMemo(() => {
    const rows = (metrics?.invoiceStatusBreakdown ?? []).filter(
      (r) => norm(r.status) !== "cancelled",
    );
    const paidRow = rows.find((r) => norm(r.status) === "paid");
    const openRows = rows.filter((r) => OPEN_STATUSES.has(norm(r.status)));
    const overdueRow = rows.find((r) => norm(r.status) === "overdue");

    const collected = paidRow?.amount ?? metrics?.totalRevenue ?? 0;
    const outstanding =
      metrics?.totalOutstanding ?? openRows.reduce((s, r) => s + r.amount, 0);
    const totalInvoiced = metrics?.totalInvoiced ?? collected + outstanding;
    const openCount =
      openRows.reduce((s, r) => s + r.count, 0) || metrics?.unpaidCount || 0;
    const segmentRows = [paidRow, ...openRows].filter(
      (r): r is InvoiceStatusBreakdown => Boolean(r),
    );

    return {
      rows,
      segmentRows,
      collected,
      outstanding,
      totalInvoiced,
      openCount,
      invoiceCount: rows.reduce((s, r) => s + r.count, 0),
      overdueAmount: metrics?.overdueAmount ?? overdueRow?.amount ?? 0,
      overdueCount: overdueRow?.count ?? 0,
      collectionRate: pct(collected, totalInvoiced),
    };
  }, [metrics]);

  const chartData = useMemo(() => metrics?.chartData ?? [], [metrics]);
  const hasCollectedSeries = chartData.some(
    (p) => typeof p.collected === "number",
  );
  const peakDay = useMemo(
    () =>
      chartData.length
        ? chartData.reduce((max, p) => (p.amount > max.amount ? p : max))
        : null,
    [chartData],
  );

  const topCustomers = metrics?.topCustomers ?? [];
  const topMax = Math.max(...topCustomers.map((c) => c.totalRevenue), 1);

  const active = metrics?.activeQuotesCount ?? 0;
  const accepted = metrics?.acceptedQuotesCount ?? 0;
  const totalQuotes = active + accepted;

  const clients = metrics?.totalCustomersCount ?? 0;
  const corporate = metrics?.corporateCustomersCount ?? 0;
  const personal = metrics?.personalCustomersCount ?? 0;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /* ---- Loading / error -------------------------------------------------- */
  if (loading && !metrics) {
    const block = "animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60";
    return (
      <div className="space-y-6 px-4 pb-10 sm:px-0" aria-busy="true">
        <div className={`h-12 w-72 ${block}`} />
        <div className={`h-80 ${block}`} />
        <div className={`h-24 ${block}`} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`h-96 lg:col-span-2 ${block}`} />
          <div className={`h-96 ${block}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 sm:mx-0 sm:flex-row sm:items-center dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className={`cursor-pointer rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-rose-900/50 ${focusRing}`}
        >
          Try again
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Billed this period",
      value: currency(metrics?.totalPeriodRevenue ?? 0),
      caption: RANGE_LABEL[chartTimeRange],
      modal: { kind: "billed" } as ModalState,
    },
    {
      label: "Estimates awaiting a decision",
      value: String(active),
      caption: "Draft or sent",
      modal: { kind: "estimates", focus: "active" } as ModalState,
    },
    {
      label: "Accepted estimates",
      value: String(accepted),
      caption: "Ready to invoice",
      modal: { kind: "estimates", focus: "accepted" } as ModalState,
    },
    {
      label: "Clients",
      value: String(clients),
      caption: `${corporate} corporate, ${personal} personal`,
      modal: { kind: "clients" } as ModalState,
    },
  ];

  const goTo = (to: string) => {
    setModal(null);
    navigate(to);
  };

  const statusBar = (status: string) =>
    STATUS_META[norm(status)]?.bar ?? "bg-slate-400";

  let modalNode: React.ReactNode = null;
  if (modal) {
    let title = "";
    let subtitle: string | undefined;
    let body: React.ReactNode = null;
    let action: { label: string; to: string } = {
      label: "View invoices",
      to: "/invoices",
    };

    switch (modal.kind) {
      case "receivables": {
        title = "Total to collect";
        subtitle = "What clients still owe, and how old it is";
        action = {
          label: "Review unpaid invoices",
          to: "/invoices?status=Unpaid",
        };
        body = (
          <>
            <div>
              <p className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {currency(summary.outstanding)}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {plural(summary.openCount, "open invoice", "open invoices")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Total invoiced"
                value={currency(summary.totalInvoiced)}
              />
              <Stat
                label="Collected"
                value={currency(summary.collected)}
                hint={`${summary.collectionRate}% of invoiced`}
              />
              <Stat
                label="Overdue"
                value={currency(summary.overdueAmount)}
                hint={plural(summary.overdueCount, "invoice", "invoices")}
              />
              <Stat
                label="Average open invoice"
                value={currency(
                  summary.openCount > 0
                    ? summary.outstanding / summary.openCount
                    : 0,
                )}
              />
            </div>
            <div>
              <SectionTitle>By status</SectionTitle>
              <ul className="mt-3 space-y-3">
                {summary.rows.map((r) => (
                  <BarRow
                    key={r.status}
                    label={STATUS_META[norm(r.status)]?.label ?? r.status}
                    value={currency(r.amount)}
                    share={pct(r.amount, summary.totalInvoiced)}
                    bar={statusBar(r.status)}
                    hint={plural(r.count, "invoice", "invoices")}
                  />
                ))}
              </ul>
            </div>
            <div>
              <SectionTitle>By age</SectionTitle>
              <ul className="mt-3 space-y-3">
                {(metrics?.agingBuckets ?? []).map((b) => (
                  <BarRow
                    key={b.range}
                    label={AGING_META[b.range].label}
                    value={currency(b.amount)}
                    share={pct(b.amount, summary.outstanding)}
                    bar={AGING_META[b.range].bar}
                    hint={plural(b.count, "invoice", "invoices")}
                  />
                ))}
              </ul>
            </div>
          </>
        );
        break;
      }

      case "aging": {
        const b = metrics?.agingBuckets.find((x) => x.range === modal.range);
        const amount = b?.amount ?? 0;
        const count = b?.count ?? 0;
        title =
          modal.range === "90+"
            ? "Invoices over 90 days old"
            : `Invoices ${AGING_META[modal.range].label} old`;
        subtitle = "Unpaid invoices grouped by age";
        action = {
          label: "Review unpaid invoices",
          to: "/invoices?status=Unpaid",
        };
        body =
          count === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Nothing is outstanding in this age range.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Amount" value={currency(amount)} />
              <Stat label="Invoices" value={String(count)} />
              <Stat
                label="Share of total to collect"
                value={`${pct(amount, summary.outstanding)}%`}
              />
              <Stat label="Average invoice" value={currency(amount / count)} />
            </div>
          );
        break;
      }

      case "status": {
        const r = summary.rows.find((x) => x.status === modal.status);
        const label = STATUS_META[norm(modal.status)]?.label ?? modal.status;
        const filter = invoiceFilterFor(modal.status);
        title = `${label} invoices`;
        subtitle = `${pct(r?.amount ?? 0, summary.totalInvoiced)}% of everything invoiced`;
        action = {
          label: `View ${filter === "PartiallyPaid" ? "partially paid" : filter.toLowerCase()} invoices`,
          to: `/invoices?status=${filter}`,
        };
        body = (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Amount" value={currency(r?.amount ?? 0)} />
            <Stat label="Invoices" value={String(r?.count ?? 0)} />
            <Stat
              label="Share of total invoiced"
              value={`${pct(r?.amount ?? 0, summary.totalInvoiced)}%`}
            />
            <Stat
              label="Average invoice"
              value={currency(r && r.count > 0 ? r.amount / r.count : 0)}
            />
          </div>
        );
        break;
      }

      case "billed": {
        const activeDays = chartData.filter((p) => p.amount > 0);
        const dayMax = Math.max(...chartData.map((p) => p.amount), 1);
        const total = metrics?.totalPeriodRevenue ?? 0;
        title = "Billed this period";
        subtitle = RANGE_LABEL[chartTimeRange];
        body = (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total billed" value={currency(total)} />
              <Stat
                label="Best day"
                value={peakDay ? peakDay.date : "None"}
                hint={peakDay ? currency(peakDay.amount) : undefined}
              />
              <Stat
                label="Days with invoices"
                value={String(activeDays.length)}
                hint={`of ${chartData.length} shown`}
              />
              <Stat
                label="Average per active day"
                value={currency(
                  activeDays.length ? total / activeDays.length : 0,
                )}
              />
            </div>
            {chartData.length > 0 && (
              <div>
                <SectionTitle>By date</SectionTitle>
                <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto overscroll-contain pr-1">
                  {[...chartData].reverse().map((p) => (
                    <BarRow
                      key={p.date}
                      label={p.date}
                      value={currency(p.amount)}
                      share={(p.amount / dayMax) * 100}
                      bar="bg-amber-500"
                      hint={
                        typeof p.collected === "number"
                          ? `Collected ${currency(p.collected)}`
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        );
        break;
      }

      case "months": {
        const months = metrics?.monthlyRevenue ?? [];
        const total = months.reduce((s, m) => s + m.amount, 0);
        const best = months.reduce(
          (m, x) => (x.amount > m.amount ? x : m),
          months[0] ?? { month: "None", amount: 0 },
        );
        const monthMax = Math.max(...months.map((m) => m.amount), 1);
        title = "Monthly billing";
        subtitle = "Invoiced amount, last 12 months";
        body = (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="12-month total" value={currency(total)} />
              <Stat
                label="Best month"
                value={best.amount > 0 ? best.month : "None"}
                hint={best.amount > 0 ? currency(best.amount) : undefined}
              />
              <Stat
                label="Average per month"
                value={currency(months.length ? total / months.length : 0)}
              />
              <Stat
                label="Months with invoices"
                value={String(months.filter((m) => m.amount > 0).length)}
              />
            </div>
            <ul className="max-h-64 space-y-3 overflow-y-auto overscroll-contain pr-1">
              {[...months].reverse().map((m) => (
                <BarRow
                  key={m.month}
                  label={m.month}
                  value={currency(m.amount)}
                  share={(m.amount / monthMax) * 100}
                  bar="bg-amber-600"
                />
              ))}
            </ul>
          </>
        );
        break;
      }

      case "customer": {
        const idx = topCustomers.findIndex(
          (c) => c.customerName === modal.name,
        );
        const c = topCustomers[idx];
        title = modal.name;
        subtitle = "Paid revenue only. Open invoices are not counted here.";
        action = { label: "View clients", to: "/customers" };
        body = (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Paid revenue"
                value={currency(c?.totalRevenue ?? 0)}
              />
              <Stat
                label="Share of all collected"
                value={`${pct(c?.totalRevenue ?? 0, summary.collected)}%`}
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ranked {idx + 1} of {topCustomers.length} by paid revenue.
            </p>
          </>
        );
        break;
      }

      case "estimates": {
        title =
          modal.focus === "active"
            ? "Estimates awaiting a decision"
            : modal.focus === "accepted"
              ? "Accepted estimates"
              : "Estimates";
        subtitle =
          modal.focus === "active"
            ? "Draft or sent, not yet accepted by the client"
            : modal.focus === "accepted"
              ? "Accepted by the client and ready to invoice"
              : "Your estimate pipeline";
        action = { label: "Open estimates", to: "/quotations" };
        body = (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Draft or sent" value={String(active)} />
            <Stat label="Accepted" value={String(accepted)} />
            <Stat
              label="Acceptance rate"
              value={`${pct(accepted, totalQuotes)}%`}
            />
            <Stat label="Total estimates" value={String(totalQuotes)} />
          </div>
        );
        break;
      }

      case "clients": {
        title = "Clients";
        subtitle = "Accounts in your directory";
        action = { label: "View clients", to: "/customers" };
        body = (
          <div className="grid grid-cols-2 gap-3">
            <Stat
              className="col-span-2"
              label="Total accounts"
              value={String(clients)}
            />
            <Stat
              label="Corporate"
              value={String(corporate)}
              hint={`${pct(corporate, clients)}% of accounts`}
            />
            <Stat
              label="Personal"
              value={String(personal)}
              hint={`${pct(personal, clients)}% of accounts`}
            />
          </div>
        );
        break;
      }
    }

    modalNode = (
      <Modal
        title={title}
        subtitle={subtitle}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className={`min-h-11 cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 sm:min-h-0 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => goTo(action.to)}
              className={`min-h-11 cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 sm:min-h-0 ${focusRing}`}
            >
              {action.label}
            </button>
          </>
        }
      >
        {body}
      </Modal>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-10 sm:px-0">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {getGreeting()}, {username || "Admin"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Backend Month Filter */}
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            />
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth("")}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                title="Clear month filter"
              >
                All
              </button>
            )}
          </div>

          {refreshing && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Updating
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${focusRing}`}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create estimate
          </button>
        </div>
      </header>

      {/* Receivables hero: the amount still to be collected */}
      <section
        aria-labelledby="receivables-heading"
        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white dark:border-slate-700"
      >
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-end lg:gap-12">
          <div className="min-w-0">
            <h2
              id="receivables-heading"
              className="text-sm font-medium text-slate-300"
            >
              Total to collect
            </h2>
            <p className="mt-2 wrap-break-word text-3xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {currency(summary.outstanding)}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              {summary.outstanding > 0
                ? `${plural(summary.openCount, "open invoice", "open invoices")} awaiting payment`
                : "Every invoice has been paid"}
            </p>
            {summary.overdueAmount > 0 && (
              <p className="mt-1 text-sm font-medium text-rose-300">
                {currency(summary.overdueAmount)} is overdue across{" "}
                {plural(summary.overdueCount, "invoice", "invoices")}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    summary.outstanding > 0
                      ? "/invoices?status=Unpaid"
                      : "/invoices",
                  )
                }
                className={`inline-flex cursor-pointer items-center justify-center rounded-lg bg-amber-500 px-4 py-3 text-sm sm:py-2.5 font-semibold text-slate-950 hover:bg-amber-400 ${focusRing}`}
              >
                {summary.outstanding > 0
                  ? "Review unpaid invoices"
                  : "View invoices"}
              </button>
              <button
                type="button"
                onClick={() => setModal({ kind: "receivables" })}
                className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/25 px-4 py-3 text-sm sm:py-2.5 font-medium text-white hover:bg-white/10 ${focusRing}`}
              >
                See breakdown
              </button>
            </div>
          </div>

          {/* Ledger: billed = collected + outstanding */}
          <div className="min-w-0">
            <div
              className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={`${summary.collectionRate}% of ${currency(summary.totalInvoiced)} invoiced has been collected`}
            >
              {summary.segmentRows
                .filter((r) => r.amount > 0)
                .map((r) => (
                  <div
                    key={r.status}
                    className={
                      STATUS_META[norm(r.status)]?.bar ?? "bg-amber-500"
                    }
                    style={{
                      width: `${(r.amount / (summary.totalInvoiced || 1)) * 100}%`,
                    }}
                  />
                ))}
            </div>

            <dl className="mt-5 divide-y divide-white/10 text-sm">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-slate-300">Total invoiced</dt>
                <dd className="text-right font-medium tabular-nums">
                  {currency(summary.totalInvoiced)}
                  <span className="ml-2 text-xs text-slate-400">
                    {plural(summary.invoiceCount, "invoice", "invoices")}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Collected
                </dt>
                <dd className="text-right font-medium tabular-nums">
                  {currency(summary.collected)}
                  <span className="ml-2 text-xs text-slate-400">
                    {summary.collectionRate}%
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Outstanding
                </dt>
                <dd className="text-right font-semibold tabular-nums">
                  {currency(summary.outstanding)}
                  <span className="ml-2 text-xs text-slate-400">
                    {100 - summary.collectionRate}%
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Aging of what is still owed */}
        <div className="border-t border-white/10">
          <p className="px-4 pt-4 text-xs text-slate-400 sm:px-8">
            Outstanding by invoice age
          </p>
          <div className="mt-3 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {(metrics?.agingBuckets ?? []).map((b) => {
              const meta = AGING_META[b.range];
              return (
                <button
                  key={b.range}
                  type="button"
                  onClick={() => setModal({ kind: "aging", range: b.range })}
                  className={`cursor-pointer bg-slate-900 px-4 py-3.5 text-left hover:bg-slate-800 sm:px-8 sm:py-4 ${focusRing} focus-visible:-outline-offset-2`}
                >
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <span className={`h-2 w-2 rounded-full ${meta.bar}`} />
                    {meta.label}
                  </span>
                  <span
                    className={`mt-1 block text-base font-semibold tabular-nums ${
                      b.amount > 0 ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {currency(b.amount)}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {plural(b.count, "invoice", "invoices")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => setModal(kpi.modal)}
            className={`cursor-pointer bg-white p-4 text-left hover:bg-slate-50 sm:p-5 dark:bg-slate-900 dark:hover:bg-slate-800/70 ${focusRing} focus-visible:-outline-offset-2`}
          >
            <span className="block text-sm text-slate-500 dark:text-slate-400">
              {kpi.label}
            </span>
            <span className="mt-1 block wrap-break-word text-lg font-semibold tabular-nums text-slate-900 sm:text-2xl dark:text-white">
              {kpi.value}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              {kpi.caption}
            </span>
          </button>
        ))}
      </div>

      {/* Trend + invoice status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Billing trend"
          subtitle={`Invoiced per day, ${RANGE_LABEL[chartTimeRange].toLowerCase()}`}
          action={
            <div
              className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
              role="group"
              aria-label="Time range"
            >
              {(
                [
                  ["7d", "7D"],
                  ["30d", "30D"],
                  ["90d", "90D"],
                  ["all", "All"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={chartTimeRange === id}
                  onClick={() => setChartTimeRange(id)}
                  className={`min-h-10 cursor-pointer rounded-md px-3.5 text-xs font-medium sm:min-h-0 sm:px-3 sm:py-1 ${focusRing} ${
                    chartTimeRange === id
                      ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Billed{" "}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {currency(metrics?.totalPeriodRevenue ?? 0)}
              </span>
            </span>
            {peakDay && peakDay.amount > 0 && (
              <span>
                Best day{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {peakDay.date}
                </span>{" "}
                <span className="tabular-nums">
                  ({currency(peakDay.amount)})
                </span>
              </span>
            )}
            <TextLink onClick={() => setModal({ kind: "billed" })}>
              See amounts by date
            </TextLink>
          </div>
          <div className="h-60 w-full min-w-0 sm:h-72">
            {chartData.length === 0 ? (
              <EmptyState
                title="No invoices in this period"
                hint="Billing activity will appear here as invoices are created."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#D97706"
                        stopOpacity={0.22}
                      />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} {...gridLine} />
                  <XAxis
                    dataKey="date"
                    minTickGap={24}
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={axisMoney}
                  />
                  <Tooltip
                    content={<MoneyTip showName={hasCollectedSeries} />}
                  />
                  <Area
                    type="monotone"
                    name="Billed"
                    dataKey="amount"
                    stroke="#D97706"
                    strokeWidth={2}
                    fill="url(#fillBilled)"
                  />
                  {hasCollectedSeries && (
                    <Area
                      type="monotone"
                      name="Collected"
                      dataKey="collected"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="none"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Invoices by status"
          subtitle="Amount and share of everything invoiced"
          action={
            <TextLink onClick={() => navigate("/invoices")}>View all</TextLink>
          }
        >
          {summary.rows.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              hint="Convert an accepted estimate to create your first invoice."
            />
          ) : (
            <div className="space-y-4">
              {summary.rows.map((r) => {
                const meta = STATUS_META[norm(r.status)];
                const share = pct(r.amount, summary.totalInvoiced);
                return (
                  <button
                    key={r.status}
                    type="button"
                    onClick={() =>
                      setModal({ kind: "status", status: r.status })
                    }
                    className={`block w-full cursor-pointer rounded-lg text-left ${focusRing}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${meta?.bar ?? "bg-slate-400"}`}
                        />
                        {meta?.label ?? r.status}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {currency(r.amount)}
                      </span>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <span
                        className={`block h-full rounded-full ${meta?.bar ?? "bg-slate-400"}`}
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {plural(r.count, "invoice", "invoices")}, {share}% of
                      total
                    </span>
                  </button>
                );
              })}
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Total invoiced
                </span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {currency(summary.totalInvoiced)}
                </span>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Customers + monthly */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Top customers"
          subtitle="By paid revenue"
          action={
            <TextLink onClick={() => navigate("/customers")}>View all</TextLink>
          }
        >
          {topCustomers.length === 0 ? (
            <EmptyState
              title="No paid invoices yet"
              hint="Your highest-paying clients will be ranked here."
            />
          ) : (
            <ul className="space-y-4">
              {topCustomers.map((c) => (
                <li key={c.customerName}>
                  <button
                    type="button"
                    onClick={() =>
                      setModal({ kind: "customer", name: c.customerName })
                    }
                    className={`block w-full cursor-pointer rounded-lg text-left ${focusRing}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 wrap-break-word text-sm font-medium text-slate-800 dark:text-slate-100">
                        {c.customerName}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {currency(c.totalRevenue)}
                      </span>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <span
                        className="block h-full rounded-full bg-indigo-500"
                        style={{ width: `${(c.totalRevenue / topMax) * 100}%` }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Monthly billing"
          subtitle="Invoiced amount over the last 12 months"
          action={
            <TextLink onClick={() => setModal({ kind: "months" })}>
              View table
            </TextLink>
          }
        >
          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.monthlyRevenue ?? []}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} {...gridLine} />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={isMobile ? 1 : 0}
                  tickFormatter={(v: string) => v.split(" ")[0]}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={axisMoney}
                />
                <Tooltip
                  cursor={{ fill: "#94A3B8", fillOpacity: 0.12 }}
                  content={<MoneyTip />}
                />
                <Bar
                  dataKey="amount"
                  fill="#D97706"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  className="cursor-pointer"
                  onClick={() => setModal({ kind: "months" })}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Estimates + clients */}
      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="Estimates"
          subtitle={
            totalQuotes > 0
              ? `${pct(accepted, totalQuotes)}% of ${totalQuotes} estimates accepted`
              : "No estimates yet"
          }
          action={
            <TextLink
              onClick={() => setModal({ kind: "estimates", focus: "all" })}
            >
              Details
            </TextLink>
          }
        >
          <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="bg-emerald-500"
              style={{ width: `${pct(accepted, totalQuotes)}%` }}
            />
            <div
              className="bg-blue-500"
              style={{ width: `${pct(active, totalQuotes)}%` }}
            />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Accepted, ready to invoice
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {accepted}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Draft or sent
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {active}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel
          title="Clients"
          subtitle={`${plural(clients, "account", "accounts")} in your directory`}
          action={
            <TextLink onClick={() => setModal({ kind: "clients" })}>
              Details
            </TextLink>
          }
        >
          <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="bg-amber-500"
              style={{ width: `${pct(corporate, clients)}%` }}
            />
            <div
              className="bg-indigo-500"
              style={{ width: `${pct(personal, clients)}%` }}
            />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Corporate
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {corporate}
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  {pct(corporate, clients)}%
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Personal
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {personal}
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  {pct(personal, clients)}%
                </span>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      {modalNode}
    </div>
  );
};
