import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Eye, Edit2, Trash2, Search, Wallet, CalendarDays, ScrollText,
  TrendingUp, ChevronDown, ChevronRight, Receipt, History, Download,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import {
  calcTotals, formatCurrency, formatDate, PAYMENT_METHODS, STATUS_CONFIG,
} from '../utils/helpers'
import clsx from 'clsx'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

function ConfirmModal({ receipt, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full fade-in">
        <h3 className="font-bold text-lg text-slate-900 mb-2">ลบใบเสร็จ?</h3>
        <p className="text-sm text-slate-500 mb-6">
          ต้องการลบ <strong>{receipt.number}</strong> ใช่หรือไม่?
          {receipt.invoiceRef && <> สถานะของใบแจ้งหนี้ <strong>{receipt.invoiceRef}</strong> จะถูกคำนวณใหม่</>}
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">ยกเลิก</button>
          <button onClick={onConfirm} className="bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">ลบ</button>
        </div>
      </div>
    </div>
  )
}

// export CSV ประวัติการชำระ
const exportCsv = (rows) => {
  const header = ['เลขที่ใบเสร็จ', 'วันที่', 'ผู้ชำระ', 'อ้างอิงใบแจ้งหนี้', 'ช่องทาง', 'เลขอ้างอิง', 'ยอดรับชำระ', 'หัก ณ ที่จ่าย', 'รับสุทธิ']
  const lines = rows.map((r) => [
    r.number, r.receiptDate, r.clientName, r.invoiceRef || '', PAYMENT_METHODS[r.paymentMethod]?.label || '',
    r.referenceNumber || r.chequeNumber || '', (r.amount || 0).toFixed(2), (r.whtAmount || 0).toFixed(2),
    ((r.amount || 0) - (r.whtAmount || 0)).toFixed(2),
  ])
  const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `payment-history-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

const EMPTY_ARRAY = []

export default function ReceiptList() {
  const receipts = useStore((s) => s.receipts || EMPTY_ARRAY)
  const documents = useStore((s) => s.documents || EMPTY_ARRAY)
  const deleteReceipt = useStore((s) => s.deleteReceipt)

  const [tab, setTab] = useState('receipts')
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [expanded, setExpanded] = useState({})

  const sorted = useMemo(
    () =>
      [...receipts].sort(
        (a, b) =>
          new Date(b.receiptDate || 0) - new Date(a.receiptDate || 0) ||
          (b.createdAt || '').localeCompare(a.createdAt || '')
      ),
    [receipts]
  )

  const filtered = sorted.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q || [r.number, r.clientName, r.invoiceRef, r.referenceNumber]
      .some((v) => (v || '').toLowerCase().includes(q))
    const matchMethod = method === 'all' || r.paymentMethod === method
    const matchFrom = !dateFrom || r.receiptDate >= dateFrom
    const matchTo = !dateTo || r.receiptDate <= dateTo
    return matchSearch && matchMethod && matchFrom && matchTo
  })

  // Stats
  const now = new Date()
  const totalAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0)
  const monthRows = receipts.filter((r) => {
    const d = new Date(r.receiptDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthAmount = monthRows.reduce((s, r) => s + (r.amount || 0), 0)
  const filteredTotal = filtered.reduce((s, r) => s + (r.amount || 0), 0)

  // ยอดแยกตามช่องทาง
  const byMethod = Object.keys(PAYMENT_METHODS)
    .map((k) => ({ key: k, amount: receipts.filter((r) => r.paymentMethod === k).reduce((s, r) => s + (r.amount || 0), 0) }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  // ประวัติตามใบแจ้งหนี้
  const invoiceHistory = documents
    .filter((d) => d.type === 'invoice' && d.status !== 'cancelled')
    .map((inv) => {
      const total = calcTotals(inv).total
      const payments = receipts
        .filter((r) => r.invoiceId === inv.id)
        .sort((a, b) => new Date(a.receiptDate) - new Date(b.receiptDate))
      const paid = payments.reduce((s, r) => s + (r.amount || 0), 0)
      return { inv, total, payments, paid, outstanding: Math.max(0, total - paid) }
    })
    .filter(({ inv }) => {
      const q = search.toLowerCase()
      return !q || inv.number.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q)
    })
    .sort((a, b) => b.outstanding - a.outstanding)

  const totalOutstanding = invoiceHistory.reduce((s, x) => s + x.outstanding, 0)

  return (
    <div className="p-8 fade-in">
      {deleteTarget && (
        <ConfirmModal
          receipt={deleteTarget}
          onConfirm={() => { deleteReceipt(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ใบเสร็จรับเงิน</h1>
          <p className="text-sm text-slate-500 mt-0.5">ออกใบเสร็จ บันทึก และตรวจสอบประวัติการชำระเงิน</p>
        </div>
        <Link to="/receipts/new" className="btn-primary">
          <Plus className="w-4 h-4" /> ออกใบเสร็จรับเงิน
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="รับชำระทั้งหมด" value={formatCurrency(totalAmount)} sub={`${receipts.length} ใบเสร็จ`}
          icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="รับชำระเดือนนี้" value={formatCurrency(monthAmount)} sub={`${monthRows.length} รายการ`}
          icon={CalendarDays} color="bg-brand-50 text-brand-600" />
        <StatCard label="ยอดคงค้างรับ" value={formatCurrency(totalOutstanding)}
          sub={`${invoiceHistory.filter((x) => x.outstanding > 0.01).length} ใบแจ้งหนี้`}
          icon={Wallet} color="bg-orange-50 text-orange-600" />
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">แยกตามช่องทาง</p>
          {byMethod.length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {byMethod.slice(0, 3).map(({ key, amount }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{PAYMENT_METHODS[key].icon} {PAYMENT_METHODS[key].label}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(amount / totalAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          {[
            { key: 'receipts', label: 'ใบเสร็จทั้งหมด', icon: ScrollText },
            { key: 'history', label: 'ประวัติตามใบแจ้งหนี้', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        {tab === 'receipts' && (
          <button onClick={() => exportCsv(filtered)} disabled={!filtered.length} className="btn-secondary disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="ค้นหาเลขที่ ลูกค้า หรือเลขอ้างอิง..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {tab === 'receipts' && (
          <>
            <select className="input w-44 cursor-pointer" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="all">ทุกช่องทาง</option>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="date" className="input w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span className="text-slate-400 text-sm">ถึง</span>
              <input type="date" className="input w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            {(search || method !== 'all' || dateFrom || dateTo) && (
              <button className="btn-ghost text-xs"
                onClick={() => { setSearch(''); setMethod('all'); setDateFrom(''); setDateTo('') }}>
                ล้างตัวกรอง
              </button>
            )}
          </>
        )}
      </div>

      {tab === 'receipts' ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left table-header">เลขที่</th>
                <th className="px-5 py-3 text-left table-header">วันที่รับชำระ</th>
                <th className="px-5 py-3 text-left table-header">ผู้ชำระ</th>
                <th className="px-5 py-3 text-left table-header">อ้างอิง</th>
                <th className="px-5 py-3 text-left table-header">ช่องทาง</th>
                <th className="px-5 py-3 text-right table-header">ยอดรับชำระ</th>
                <th className="px-5 py-3 text-right table-header">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    {receipts.length ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีใบเสร็จรับเงิน'}
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">{r.number}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{formatDate(r.receiptDate)}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{r.clientName}</div>
                    {r.referenceNumber && <div className="text-xs text-slate-400">Ref: {r.referenceNumber}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {r.invoiceId ? (
                      <Link to={`/invoices/${r.invoiceId}/preview`} className="text-brand-600 font-medium hover:underline">
                        {r.invoiceRef}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-slate-100 text-slate-700">
                      {PAYMENT_METHODS[r.paymentMethod]?.icon} {PAYMENT_METHODS[r.paymentMethod]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(r.amount)}</div>
                    {r.whtAmount > 0 && <div className="text-xs text-slate-400">หัก ณ ที่จ่าย {formatCurrency(r.whtAmount)}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Link to={`/receipts/${r.id}/preview`} className="btn-ghost p-2" title="Preview"><Eye className="w-4 h-4" /></Link>
                      <Link to={`/receipts/${r.id}/edit`} className="btn-ghost p-2" title="แก้ไข"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => setDeleteTarget(r)} className="btn-ghost p-2 text-red-500 hover:bg-red-50" title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-100">
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-600">
                    รวม {filtered.length} รายการ
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-emerald-700">{formatCurrency(filteredTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {invoiceHistory.length === 0 && (
            <div className="card py-16 text-center text-sm text-slate-400">ไม่พบใบแจ้งหนี้</div>
          )}
          {invoiceHistory.map(({ inv, total, payments, paid, outstanding }) => {
            const pct = total ? Math.min(100, (paid / total) * 100) : 0
            const open = expanded[inv.id]
            const cfg = STATUS_CONFIG[inv.status]
            return (
              <div key={inv.id} className="card overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [inv.id]: !e[inv.id] }))}
                    className="btn-ghost p-1.5"
                    disabled={!payments.length}
                  >
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className={clsx('w-4 h-4', !payments.length && 'opacity-30')} />}
                  </button>
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Link to={`/invoices/${inv.id}/preview`} className="text-sm font-bold text-slate-900 hover:text-brand-600">
                        {inv.number}
                      </Link>
                      <span className={clsx('badge text-[10px]', cfg?.color)}>{cfg?.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[220px]">{inv.clientName}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">ชำระแล้ว {formatCurrency(paid)} / {formatCurrency(total)}</span>
                      <span className="font-semibold text-slate-700">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={clsx('h-full transition-all', pct >= 99.99 ? 'bg-emerald-500' : 'bg-amber-400')}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right w-36">
                    <div className="text-xs text-slate-500">คงค้าง</div>
                    <div className={clsx('text-sm font-bold', outstanding > 0.01 ? 'text-orange-600' : 'text-emerald-600')}>
                      {outstanding > 0.01 ? formatCurrency(outstanding) : 'ครบแล้ว'}
                    </div>
                  </div>
                  <div className="w-36 flex justify-end">
                    {outstanding > 0.01 && (
                      <Link to={`/receipts/new/${inv.id}`} className="btn-secondary text-xs px-3 py-1.5">
                        <Plus className="w-3.5 h-3.5" /> รับชำระ
                      </Link>
                    )}
                  </div>
                </div>

                {open && payments.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
                      {payments.map((r, i) => {
                        const cumulative = payments.slice(0, i + 1).reduce((s, p) => s + (p.amount || 0), 0)
                        return (
                          <div key={r.id} className="relative flex items-center gap-4 py-2">
                            <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                            <div className="w-32 text-xs text-slate-500">{formatDate(r.receiptDate)}</div>
                            <Link to={`/receipts/${r.id}/preview`} className="text-sm font-semibold text-emerald-600 hover:underline w-24">
                              {r.number}
                            </Link>
                            <div className="text-xs text-slate-600 flex-1">
                              {PAYMENT_METHODS[r.paymentMethod]?.icon} {PAYMENT_METHODS[r.paymentMethod]?.label}
                              {r.referenceNumber && <span className="text-slate-400"> · Ref {r.referenceNumber}</span>}
                            </div>
                            <div className="text-sm font-bold text-slate-900 w-32 text-right">{formatCurrency(r.amount)}</div>
                            <div className="text-xs text-slate-400 w-40 text-right">สะสม {formatCurrency(cumulative)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
