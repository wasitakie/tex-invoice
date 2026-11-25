import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Eye, Plus, Trash2, User, Building, Phone, Mail, Hash,
  Wallet, Link2, AlertTriangle, CheckCircle2, FileText,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import {
  calcTotals, calcReceipt, formatCurrency, formatDate, today, uid, PAYMENT_METHODS, STATUS_CONFIG,
} from '../utils/helpers'
import clsx from 'clsx'

const WHT_RATES = [0, 1, 2, 3, 5]

const emptyForm = () => ({
  invoiceId: '',
  invoiceRef: '',
  receiptDate: today(),
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  clientTaxId: '',
  paymentMethod: 'transfer',
  bankName: '',
  accountName: '',
  accountNumber: '',
  referenceNumber: '',
  chequeNumber: '',
  chequeDate: '',
  cardLast4: '',
  items: [{ id: uid(), description: '', amount: 0 }],
  vatRate: 7,
  whtRate: 0,
  notes: '',
})

// ยอดในรายการเป็นยอดรวม VAT แล้ว — ดู calcReceipt ใน helpers

function Section({ title, icon: Icon, children, right }) {
  return (
    <div className="card p-6 mb-5">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children, className = '', error }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input className="input pl-9" {...props} />
    </div>
  )
}

const EMPTY_ARRAY = []

export default function ReceiptForm() {
  const navigate = useNavigate()
  const { id, invoiceId: invoiceIdParam } = useParams()
  const documents = useStore((s) => s.documents || EMPTY_ARRAY)
  const receipts = useStore((s) => s.receipts || EMPTY_ARRAY)
  const { addReceipt, updateReceipt, getPaidAmount } = useStore()

  const existing = id ? receipts.find((r) => r.id === id) : null
  const isEditing = !!existing

  const buildFromInvoice = (base, invId) => {
    const inv = documents.find((d) => d.id === invId)
    if (!inv) return { ...base, invoiceId: '', invoiceRef: '' }
    const outstanding = Math.max(0, calcTotals(inv).total - getPaidAmount(inv.id, existing?.id))
    return {
      ...base,
      invoiceId: inv.id,
      invoiceRef: inv.number,
      clientName: inv.clientName,
      clientAddress: inv.clientAddress,
      clientPhone: inv.clientPhone,
      clientEmail: inv.clientEmail,
      clientTaxId: inv.clientTaxId,
      vatRate: inv.vatRate ?? 7,
      items: [{
        id: uid(),
        description: `ชำระค่าสินค้า/บริการ ตามใบแจ้งหนี้เลขที่ ${inv.number}`,
        amount: Math.round(outstanding * 100) / 100,
      }],
    }
  }

  const [form, setForm] = useState(() => {
    if (existing) return { ...emptyForm(), ...existing, items: existing.items.map((i) => ({ id: uid(), ...i })) }
    if (invoiceIdParam) return buildFromInvoice(emptyForm(), invoiceIdParam)
    return emptyForm()
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setItem = (itemId, k, v) =>
    setForm((f) => ({ ...f, items: f.items.map((i) => (i.id === itemId ? { ...i, [k]: v } : i)) }))

  const invoices = documents.filter((d) => d.type === 'invoice')
  const selectableInvoices = invoices.filter(
    (d) => !['paid', 'cancelled'].includes(d.status) || d.id === form.invoiceId
  )

  const linkedInvoice = invoices.find((d) => d.id === form.invoiceId)
  const invoiceTotal = linkedInvoice ? calcTotals(linkedInvoice).total : 0
  const paidBefore = linkedInvoice ? getPaidAmount(linkedInvoice.id, existing?.id) : 0
  const outstanding = Math.max(0, invoiceTotal - paidBefore)
  const linkedHistory = useMemo(
    () => receipts
      .filter((r) => r.invoiceId && r.invoiceId === form.invoiceId && r.id !== existing?.id)
      .sort((a, b) => new Date(a.receiptDate) - new Date(b.receiptDate)),
    [receipts, form.invoiceId, existing?.id]
  )

  const totals = calcReceipt(form)
  const overpaid = linkedInvoice && totals.amount > outstanding + 0.01
  const remainingAfter = linkedInvoice ? Math.max(0, outstanding - totals.amount) : 0

  const handleInvoiceChange = (invId) => {
    if (!invId) return setForm((f) => ({ ...f, invoiceId: '', invoiceRef: '' }))
    setForm((f) => buildFromInvoice(f, invId))
  }

  const validate = () => {
    const e = {}
    if (!form.clientName.trim()) e.clientName = 'กรุณาระบุชื่อผู้ชำระเงิน'
    if (!form.receiptDate) e.receiptDate = 'กรุณาระบุวันที่รับชำระ'
    if (totals.amount <= 0) e.amount = 'ยอดรับชำระต้องมากกว่า 0'
    if (form.items.some((i) => !i.description.trim())) e.items = 'กรุณาระบุรายละเอียดทุกรายการ'
    if (form.paymentMethod === 'cheque' && !form.chequeNumber.trim()) e.chequeNumber = 'กรุณาระบุเลขที่เช็ค'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = (andPreview) => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      items: form.items.map(({ description, amount }) => ({ description, amount: Number(amount) || 0 })),
      amount: totals.amount,
      vatAmount: totals.vatAmount,
      whtAmount: totals.whtAmount,
      netReceived: totals.netReceived,
    }
    let saved
    if (isEditing) {
      updateReceipt(id, payload)
      saved = { id }
    } else {
      saved = addReceipt(payload)
    }
    setSaving(false)
    navigate(andPreview ? `/receipts/${saved.id}/preview` : '/receipts')
  }

  const m = form.paymentMethod

  return (
    <div className="p-8 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/receipts')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'แก้ไขใบเสร็จรับเงิน' : 'ออกใบเสร็จรับเงิน'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditing ? existing.number : 'บันทึกการรับชำระเงินและออกใบเสร็จ'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
            <Save className="w-4 h-4" /> บันทึก
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
            <Eye className="w-4 h-4" /> บันทึก & Preview
          </button>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">กรุณาตรวจสอบข้อมูล</p>
            <ul className="list-disc ml-4 mt-1">
              {Object.values(errors).map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Link invoice */}
      <Section title="อ้างอิงใบแจ้งหนี้" icon={Link2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="ใบแจ้งหนี้ (ไม่บังคับ)" className="md:col-span-2">
            <select
              className="input cursor-pointer"
              value={form.invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
            >
              <option value="">— ไม่อ้างอิงใบแจ้งหนี้ —</option>
              {selectableInvoices.map((inv) => {
                const t = calcTotals(inv).total
                const left = t - getPaidAmount(inv.id, existing?.id)
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} · {inv.clientName} · ค้างชำระ {formatCurrency(Math.max(0, left))}
                  </option>
                )
              })}
            </select>
          </Field>
          <Field label="วันที่รับชำระ" error={errors.receiptDate}>
            <input type="date" className="input" value={form.receiptDate}
              onChange={(e) => set('receiptDate', e.target.value)} />
          </Field>
        </div>

        {linkedInvoice && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">ยอดใบแจ้งหนี้</div>
                <div className="font-bold text-slate-900">{formatCurrency(invoiceTotal)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ชำระแล้ว</div>
                <div className="font-bold text-emerald-600">{formatCurrency(paidBefore)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">คงค้าง</div>
                <div className="font-bold text-orange-600">{formatCurrency(outstanding)}</div>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${invoiceTotal ? Math.min(100, (paidBefore / invoiceTotal) * 100) : 0}%` }}
              />
            </div>
            {linkedHistory.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 mb-2">ประวัติการชำระของใบแจ้งหนี้นี้</div>
                <div className="space-y-1">
                  {linkedHistory.map((r) => (
                    <div key={r.id} className="flex justify-between text-xs text-slate-600">
                      <span>{r.number} · {formatDate(r.receiptDate)} · {PAYMENT_METHODS[r.paymentMethod]?.label}</span>
                      <span className="font-semibold">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Payer */}
      <Section title="ข้อมูลผู้ชำระเงิน" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ชื่อบริษัท / ผู้ชำระ" className="md:col-span-2" error={errors.clientName}>
            <IconInput icon={Building} placeholder="บริษัท ลูกค้า จำกัด"
              value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
          </Field>
          <Field label="ที่อยู่" className="md:col-span-2">
            <textarea rows={2} className="input resize-none" value={form.clientAddress}
              onChange={(e) => set('clientAddress', e.target.value)} />
          </Field>
          <Field label="เบอร์โทรศัพท์">
            <IconInput icon={Phone} value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />
          </Field>
          <Field label="อีเมล">
            <IconInput icon={Mail} value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} />
          </Field>
          <Field label="เลขประจำตัวผู้เสียภาษี">
            <IconInput icon={Hash} value={form.clientTaxId} onChange={(e) => set('clientTaxId', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Payment info */}
      <Section title="ข้อมูลการชำระเงิน" icon={Wallet}>
        <label className="label">ช่องทางการชำระ</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
          {Object.entries(PAYMENT_METHODS).map(([key, cfg]) => (
            <button
              type="button"
              key={key}
              onClick={() => set('paymentMethod', key)}
              className={clsx(
                'p-3 rounded-xl border text-center transition-all',
                m === key
                  ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="text-xl">{cfg.icon}</div>
              <div className={clsx('text-xs font-semibold mt-1', m === key ? 'text-emerald-700' : 'text-slate-600')}>
                {cfg.label}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(m === 'transfer' || m === 'cheque') && (
            <Field label="ธนาคาร">
              <input className="input" placeholder="เช่น ธนาคารกสิกรไทย" value={form.bankName}
                onChange={(e) => set('bankName', e.target.value)} />
            </Field>
          )}
          {m === 'transfer' && (
            <>
              <Field label="เข้าบัญชีชื่อ">
                <input className="input" value={form.accountName}
                  onChange={(e) => set('accountName', e.target.value)} />
              </Field>
              <Field label="เลขที่บัญชี">
                <input className="input" placeholder="xxx-x-xxxxx-x" value={form.accountNumber}
                  onChange={(e) => set('accountNumber', e.target.value)} />
              </Field>
            </>
          )}
          {m === 'cheque' && (
            <>
              <Field label="เลขที่เช็ค" error={errors.chequeNumber}>
                <input className="input" value={form.chequeNumber}
                  onChange={(e) => set('chequeNumber', e.target.value)} />
              </Field>
              <Field label="ลงวันที่เช็ค">
                <input type="date" className="input" value={form.chequeDate}
                  onChange={(e) => set('chequeDate', e.target.value)} />
              </Field>
            </>
          )}
          {m === 'credit' && (
            <Field label="เลขบัตร 4 หลักท้าย">
              <input className="input" maxLength={4} placeholder="1234" value={form.cardLast4}
                onChange={(e) => set('cardLast4', e.target.value.replace(/\D/g, ''))} />
            </Field>
          )}
          {m !== 'cash' && (
            <Field label="เลขอ้างอิง / เลขที่รายการ">
              <input className="input" placeholder="เช่น เลขที่สลิปโอน" value={form.referenceNumber}
                onChange={(e) => set('referenceNumber', e.target.value)} />
            </Field>
          )}
        </div>
      </Section>

      {/* Items & amounts */}
      <div className="card mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-900">รายการรับชำระ</h2>
            <span className="text-xs text-slate-400">(ยอดรวมภาษีมูลค่าเพิ่มแล้ว)</span>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, items: [...f.items, { id: uid(), description: '', amount: 0 }] }))}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {form.items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 px-6 py-3 items-center">
              <div className="col-span-1 text-xs text-slate-400 font-medium">{idx + 1}</div>
              <div className="col-span-7">
                <input className="input text-sm" placeholder="รายละเอียด" value={item.description}
                  onChange={(e) => setItem(item.id, 'description', e.target.value)} />
              </div>
              <div className="col-span-3">
                <input type="number" min="0" step="0.01" className="input text-sm text-right" value={item.amount}
                  onChange={(e) => setItem(item.id, 'amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  disabled={form.items.length === 1}
                  onClick={() => setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== item.id) }))}
                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50">
          <div className="max-w-sm ml-auto space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>มูลค่าก่อนภาษี</span>
              <span>{formatCurrency(totals.beforeVat)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span>VAT (%)</span>
                <input type="number" min="0" max="100"
                  className="w-14 px-2 py-0.5 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={form.vatRate} onChange={(e) => set('vatRate', parseFloat(e.target.value) || 0)} />
              </div>
              <span>{formatCurrency(totals.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-200">
              <span>ยอดรับชำระรวม</span>
              <span>{formatCurrency(totals.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span>หัก ณ ที่จ่าย</span>
                <select
                  className="px-2 py-0.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={form.whtRate} onChange={(e) => set('whtRate', parseFloat(e.target.value))}
                >
                  {WHT_RATES.map((r) => <option key={r} value={r}>{r === 0 ? 'ไม่มี' : `${r}%`}</option>)}
                </select>
              </div>
              <span className="text-red-500">{totals.whtAmount > 0 ? `-${formatCurrency(totals.whtAmount)}` : '-'}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">รับเงินสุทธิ</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totals.netReceived)}</span>
            </div>
          </div>

          {linkedInvoice && (
            <div className={clsx(
              'mt-4 p-3 rounded-xl text-sm flex items-center gap-2',
              overpaid ? 'bg-amber-50 text-amber-700' : remainingAfter <= 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
            )}>
              {overpaid ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {overpaid
                ? `ยอดรับชำระเกินยอดคงค้าง ${formatCurrency(totals.amount - outstanding)}`
                : remainingAfter <= 0.01
                  ? `ชำระครบ — ใบแจ้งหนี้ ${linkedInvoice.number} จะเปลี่ยนเป็น "${STATUS_CONFIG.paid.label}"`
                  : `ชำระบางส่วน — คงค้างหลังรับชำระ ${formatCurrency(remainingAfter)}`}
            </div>
          )}
        </div>
      </div>

      <Section title="หมายเหตุ" icon={FileText}>
        <textarea rows={3} className="input resize-none" placeholder="หมายเหตุเพิ่มเติม..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Section>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/receipts')} className="btn-secondary">ยกเลิก</button>
        <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
          <Save className="w-4 h-4" /> บันทึก
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
          <Eye className="w-4 h-4" /> บันทึก & Preview
        </button>
      </div>
    </div>
  )
}
