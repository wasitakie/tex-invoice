import { Link } from "react-router-dom";
import {
  TrendingUp,
  FileText,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../store/useStore";
import {
  formatCurrency,
  formatDate,
  calcTotals,
  STATUS_CONFIG,
} from "../utils/helpers";
import clsx from "clsx";

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="card p-5 flex items-start justify-between group hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          color,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { documents, getStats } = useStore();
  const stats = getStats();

  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const overdueDocs = documents.filter((d) => d.status === "overdue");

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ภาพรวมระบบใบเสนอราคาและใบแจ้งหนี้
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/quotations/new" className="btn-secondary">
            <FileText className="w-4 h-4" />
            สร้างใบเสนอราคา
          </Link>
          <Link to="/invoices/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            สร้างใบแจ้งหนี้
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="รายรับทั้งหมด"
          value={formatCurrency(stats.totalRevenue)}
          sub="จากใบแจ้งหนี้ที่ชำระแล้ว"
          icon={TrendingUp}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="รอชำระ"
          value={formatCurrency(stats.pendingAmount)}
          sub={`${stats.totalInvoices - stats.paidInvoices} ใบ`}
          icon={Clock}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="เกินกำหนด"
          value={formatCurrency(stats.overdueAmount)}
          sub={`${stats.overdueInvoices} ใบ`}
          icon={AlertCircle}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          label="อัตราแปลง QT→INV"
          value={`${stats.conversionRate}%`}
          sub={`${stats.totalQuotations} ใบเสนอราคา`}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="xl:col-span-2 card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">เอกสารล่าสุด</h2>
            <div className="flex gap-2">
              <Link to="/quotations" className="btn-ghost text-xs">
                ใบเสนอราคา <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/invoices" className="btn-ghost text-xs">
                ใบแจ้งหนี้ <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {recentDocs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                ยังไม่มีเอกสาร
              </div>
            ) : (
              recentDocs.map((doc) => {
                const { total } = calcTotals(doc);
                const cfg = STATUS_CONFIG[doc.status];
                return (
                  <Link
                    key={doc.id}
                    to={`/${doc.type === "quotation" ? "quotations" : "invoices"}/${doc.id}/preview`}
                    className="flex items-center px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center mr-3 shrink-0">
                      {doc.type === "quotation" ? (
                        <FileText className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Receipt className="w-4 h-4 text-brand-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {doc.number}
                        </span>
                        <span className={clsx("badge text-[10px]", cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {doc.clientName}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(total)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(doc.issueDate)}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 ml-3 group-hover:text-brand-500 transition-colors" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Summary + Overdue */}
        <div className="space-y-4">
          {/* Quick Summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">สรุปเอกสาร</h3>
            <div className="space-y-3">
              {[
                {
                  label: "ใบเสนอราคาทั้งหมด",
                  value: stats.totalQuotations,
                  to: "/quotations",
                },
                {
                  label: "ใบแจ้งหนี้ทั้งหมด",
                  value: stats.totalInvoices,
                  to: "/invoices",
                },
                {
                  label: "ชำระแล้ว",
                  value: stats.paidInvoices,
                  to: "/invoices",
                },
                {
                  label: "เกินกำหนด",
                  value: stats.overdueInvoices,
                  to: "/invoices",
                },
              ].map(({ label, value, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-bold text-slate-900">
                    {value}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Overdue alert */}
          {overdueDocs.length > 0 && (
            <div className="card p-5 border-orange-200 bg-orange-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-orange-900 text-sm">
                  เกินกำหนดชำระ
                </h3>
              </div>
              <div className="space-y-2">
                {overdueDocs.slice(0, 3).map((doc) => {
                  const { total } = calcTotals(doc);
                  return (
                    <Link
                      key={doc.id}
                      to={`/invoices/${doc.id}/preview`}
                      className="flex justify-between items-center text-sm hover:opacity-80 transition-opacity"
                    >
                      <span className="text-orange-800 font-medium">
                        {doc.number}
                      </span>
                      <span className="font-bold text-orange-900">
                        {formatCurrency(total)}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {overdueDocs.length > 3 && (
                <Link
                  to="/invoices"
                  className="text-xs text-orange-700 font-semibold mt-3 inline-block hover:underline"
                >
                  ดูทั้งหมด {overdueDocs.length} รายการ →
                </Link>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">สร้างเอกสาร</h3>
            <div className="space-y-2">
              <Link
                to="/quotations/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700">
                  ใบเสนอราคาใหม่
                </span>
                <Plus className="w-4 h-4 ml-auto text-slate-400 group-hover:text-brand-500" />
              </Link>
              <Link
                to="/invoices/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-brand-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700">
                  ใบแจ้งหนี้ใหม่
                </span>
                <Plus className="w-4 h-4 ml-auto text-slate-400 group-hover:text-brand-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
