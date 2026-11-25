import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  ScrollText,
  Settings,
  ChevronRight,
  Zap,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/quotations", icon: FileText, label: "ใบเสนอราคา" },
  { to: "/invoices", icon: Receipt, label: "ใบแจ้งหนี้" },
  { to: "/receipts", icon: Receipt, label: "ใบเสร็จรับเงิน" },
];

export default function Sidebar() {
  return (
    <aside className="no-print fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              QuoteFlow
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Invoice System
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">
          เมนูหลัก
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx("sidebar-link", isActive && "active")
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </NavLink>
        ))}

        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-5">
          ระบบ
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx("sidebar-link", isActive && "active")
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="flex-1">ตั้งค่า</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="text-[11px] text-slate-400 text-center">
          QuoteFlow v1.0 · © 2026
        </div>
      </div>
    </aside>
  );
}
