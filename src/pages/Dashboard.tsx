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
  CreditCard,
  ArrowUpRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Payment {
  paymentId: number;
  invoiceId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string;
  createdAt: string;
}

interface Invoice {
  invoiceId: number;
  invoiceNumber: string;
  companyName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  isActive?: boolean;
  payments?: Payment[];
  [key: string]: unknown;
}

interface Quotation {
  quotationId: number;
  status: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

interface Customer {
  customerId: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export const Dashboard: React.FC = () => {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, quoteRes, custRes, prodRes] = await Promise.all([
          api.get("/invoices"),
          api.get("/quotations"),
          api.get("/customers"),
          api.get("/products"),
        ]);

        if (isMounted) {
          setInvoices(invRes.data);
          setQuotations(quoteRes.data);
          setCustomers(custRes.data);
          void prodRes;
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

    initFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter out soft-deleted or inactive records
  const activeInvoices = invoices.filter(
    (i) => i.isDeleted !== true && !i.deletedAt && i.isActive !== false,
  );
  const activeQuotations = quotations.filter(
    (q) => q.isDeleted !== true && !q.deletedAt && q.isActive !== false,
  );
  const activeCustomers = customers.filter(
    (c) => c.isDeleted !== true && !c.deletedAt && c.isActive !== false,
  );

  // Metrics computations
  const totalRevenue = activeInvoices
    .filter((i) => i.status?.toLowerCase() === "paid")
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const unpaidCount = activeInvoices.filter(
    (i) =>
      i.status?.toLowerCase() === "unpaid" ||
      i.status?.toLowerCase() === "partiallypaid",
  ).length;

  const activeQuotesCount = activeQuotations.filter(
    (q) =>
      q.status?.toLowerCase() === "created" ||
      q.status?.toLowerCase() === "sent",
  ).length;

  const acceptedQuotesCount = activeQuotations.filter((q) => {
    const status = q.status?.toLowerCase();
    return status === "accepted" || status === "approved";
  }).length;

  const totalCustomersCount = activeCustomers.length;

  // Flatten and sort recent payments
  const allPayments = activeInvoices.flatMap((invoice) =>
    (invoice.payments || []).map((payment) => ({
      ...payment,
      invoiceNumber: invoice.invoiceNumber,
      companyName: invoice.companyName,
    })),
  );

  const recentPayments = [...allPayments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Compute revenue grouped by date for the bar chart
  const revenueByDateMap = allPayments.reduce(
    (acc: Record<string, number>, payment) => {
      const dateKey = new Date(payment.createdAt).toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
        },
      );
      acc[dateKey] = (acc[dateKey] || 0) + (payment.amountPaid || 0);
      return acc;
    },
    {},
  );

  const chartData = Object.entries(revenueByDateMap)
    .map(([date, amount]) => ({ date, amount }))
    .slice(-6); // Keep latest 6 data points for clean spacing

  const maxChartAmount = Math.max(...chartData.map((d) => d.amount), 1);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 font-medium text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        Loading executive dashboard overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-3xl flex items-center justify-between shadow-xs">
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

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Business Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome back, {username || "Admin"}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl font-normal leading-relaxed">
              Here is your real-time business health metrics, financial
              overview, and quick catalog shortcuts for today.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              className="px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Create Estimate</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Performance Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Paid Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Paid Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F9B53F] flex items-center justify-center border border-amber-100/60 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ₱
              {totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Fully settled collections
            </p>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Unpaid Invoices
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {unpaidCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Pending client remittances
            </p>
          </div>
        </div>

        {/* Active Estimates */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Estimates
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {activeQuotesCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Sent or draft quotations
            </p>
          </div>
        </div>

        {/* Accepted Estimates */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Accepted Estimates
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {acceptedQuotesCount}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Ready for invoice conversion
            </p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Clients
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalCustomersCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Registered accounts
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Payments & Income Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments Feed (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Recent Transactions Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest payment remittances recorded across invoices
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 py-2">
            {recentPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50 px-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold flex items-center gap-2">
                          <span>{payment.companyName}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            {payment.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Method:{" "}
                          <span className="font-semibold text-slate-600">
                            {payment.paymentMethod}
                          </span>{" "}
                          {payment.referenceNumber
                            ? `• Ref: ${payment.referenceNumber}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-emerald-600 text-sm">
                        +₱
                        {payment.amountPaid.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {new Date(payment.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Income / Revenue Trend Bar Chart Card (Spans 1 column) */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Income Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Payment collections over time
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F9B53F] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="py-6 flex-1 flex items-end justify-between gap-2 h-52">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                No payment history available for chart.
              </div>
            ) : (
              chartData.map((item, idx) => {
                const heightPercentage = Math.max(
                  (item.amount / maxChartAmount) * 100,
                  12,
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₱{item.amount.toLocaleString()}
                    </div>
                    <div className="w-full bg-slate-100 rounded-xl overflow-hidden h-36 flex items-end">
                      <div
                        style={{ height: `${heightPercentage}%` }}
                        className="w-full bg-linear-to-t from-amber-500 to-[#F9B53F] rounded-t-lg group-hover:brightness-110 transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full">
                      {item.date}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Navigation Hub */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Navigation Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a module below to quickly manage your portal sections
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Customers */}
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between aspect-square group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 transition-colors">
                Customers
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Manage client directories & contact persons
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-800 pt-2 transition-colors">
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Products */}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between aspect-square group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-2xs">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 transition-colors">
                Products
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Manage catalog items, SKUs & variants
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-800 pt-2 transition-colors">
              <span>View Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Quotations */}
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between aspect-square group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-2xs">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 transition-colors">
                Quotations
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Create estimates & convert to invoices
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-800 pt-2 transition-colors">
              <span>View Estimates</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Invoices */}
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between aspect-square group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-2xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 transition-colors">
                Invoices
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Track billing, balances & payments
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-800 pt-2 transition-colors">
              <span>View Invoices</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Archive / Trash */}
          <button
            type="button"
            onClick={() => navigate("/trash")}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between aspect-square group text-left sm:col-span-2 lg:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 transition-colors">
                Archive
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Restore or purge soft-deleted records
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-800 pt-2 transition-colors">
              <span>View Archive</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
