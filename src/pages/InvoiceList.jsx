import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit2, Trash2, Search, Filter, Wallet } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, calcTotals, STATUS_CONFIG, INVOICE_STATUSES } from '../utils/helpers'
import clsx from 'clsx'

function ConfirmModal({ doc, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full fade-in">
        <h3 className="font-bold text-lg text-slate-900 mb-2">ลบเอกสาร?</h3>
        <p className="text-sm text-slate-500 mb-6">
          ต้องการลบ <strong>{doc.number}</strong> ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">ยกเลิก</button>
          <button onClick={onConfirm} className="bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">ลบ</button>
        </div>
      </div>
    </div>
  )
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const { getDocumentsByType, deleteDocument, updateDocument } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const invoices = getDocumentsByType('invoice')

  const filtered = invoices.filter((d) => {
    const matchSearch =
      d.number.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPending = invoices
    .filter((d) => ['sent', 'draft', 'partial'].includes(d.status))
    .reduce((sum, d) => sum + calcTotals(d).total, 0)

  return (
    <div className="p-8 fade-in">
      {deleteTarget && (
        <ConfirmModal
          doc={deleteTarget}
          onConfirm={() => { deleteDocument(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ใบแจ้งหนี้</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoices.length} รายการ · รอชำระ {formatCurrency(totalPending)}
          </p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          สร้างใบแจ้งหนี้
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(['all', 'draft', 'sent', 'partial', 'paid', 'overdue']).map((s) => {
          const count = s === 'all' ? invoices.length : invoices.filter((d) => d.status === s).length
          const cfg = s === 'all' ? { label: 'ทั้งหมด', color: 'bg-slate-100 text-slate-700' } : STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all',
                statusFilter === s
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="text-xl font-bold text-slate-900">{count}</div>
              <div className={clsx('text-xs font-semibold mt-1 inline-block px-1.5 py-0.5 rounded-md', cfg.color)}>
                {cfg.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่หรือลูกค้า..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left table-header">เลขที่</th>
              <th className="px-5 py-3 text-left table-header">ลูกค้า</th>
              <th className="px-5 py-3 text-left table-header">วันที่ออก</th>
              <th className="px-5 py-3 text-left table-header">ครบกำหนด</th>
              <th className="px-5 py-3 text-right table-header">มูลค่า</th>
              <th className="px-5 py-3 text-left table-header">สถานะ</th>
              <th className="px-5 py-3 text-right table-header">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                  {search || statusFilter !== 'all' ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีใบแจ้งหนี้'}
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const { total } = calcTotals(doc)
                const cfg = STATUS_CONFIG[doc.status]
                const isOverdue = doc.status === 'overdue'
                return (
                  <tr key={doc.id} className={clsx('hover:bg-slate-50/60 transition-colors', isOverdue && 'bg-orange-50/30')}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-brand-600">{doc.number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{doc.clientName}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[180px]">{doc.clientEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{formatDate(doc.issueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('text-sm', isOverdue ? 'text-orange-600 font-semibold' : 'text-slate-600')}>
                        {formatDate(doc.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={clsx('badge', cfg.color)}>{cfg.label}</span>
                        <select
                          value={doc.status}
                          onChange={(e) => updateDocument(doc.id, { status: e.target.value })}
                          className="text-xs border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-400"
                        >
                          {INVOICE_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {!['paid', 'cancelled'].includes(doc.status) && (
                          <Link
                            to={`/receipts/new/${doc.id}`}
                            className="btn-ghost p-2 text-emerald-600 hover:bg-emerald-50"
                            title="บันทึกรับชำระ / ออกใบเสร็จ"
                          >
                            <Wallet className="w-4 h-4" />
                          </Link>
                        )}
                        <Link to={`/invoices/${doc.id}/preview`} className="btn-ghost p-2">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/invoices/${doc.id}/edit`} className="btn-ghost p-2">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
