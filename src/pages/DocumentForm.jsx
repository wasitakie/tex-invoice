import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save, Eye, ArrowLeft, Plus, Trash2, GripVertical,
  User, Building, Phone, Mail, FileText, Receipt,
  Calendar, Hash, Percent, ChevronDown
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { calcTotals, formatCurrency, today, addDays, uid } from '../utils/helpers'
import clsx from 'clsx'

const DEFAULT_ITEM = () => ({
  id: uid(),
  description: '',
  quantity: 1,
  unit: 'ชิ้น',
  unitPrice: 0,
  discount: 0,
})

const DEFAULT_FORM = (type) => ({
  type,
  status: 'draft',
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  clientTaxId: '',
  issueDate: today(),
  dueDate: addDays(today(), 30),
  validUntil: type === 'quotation' ? addDays(today(), 30) : '',
  items: [DEFAULT_ITEM()],
  discountGlobal: 0,
  vatRate: 7,
  notes: '',
  paymentTerms: type === 'invoice' ? 'กรุณาชำระภายใน 30 วันนับจากวันที่ออกใบแจ้งหนี้' : '',
})

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="card p-6 mb-5">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-600" />
        </div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FormField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function DocumentForm({ type }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getDocument, addDocument, updateDocument, company } = useStore()

  const existing = id ? getDocument(id) : null
  const [form, setForm] = useState(existing || DEFAULT_FORM(type))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) setForm(existing)
  }, [id])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setItem = (itemId, key, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    }))

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, DEFAULT_ITEM()] }))
  const removeItem = (itemId) =>
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== itemId) }))

  const totals = calcTotals(form)
  const isInvoice = type === 'invoice'
  const isEditing = !!existing

  const handleSave = async (andPreview = false) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    let saved
    if (isEditing) {
      updateDocument(id, form)
      saved = { ...form, id }
    } else {
      saved = addDocument(form)
    }
    setSaving(false)
    const base = isInvoice ? '/invoices' : '/quotations'
    if (andPreview) navigate(`${base}/${saved.id}/preview`)
    else navigate(base)
  }

  return (
    <div className="p-8 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isInvoice ? '/invoices' : '/quotations')}
            className="btn-ghost p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'แก้ไข' : 'สร้าง'}
              {isInvoice ? 'ใบแจ้งหนี้' : 'ใบเสนอราคา'}
            </h1>
            {isEditing && (
              <p className="text-sm text-slate-500">{existing?.number}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
            <Eye className="w-4 h-4" />
            บันทึก & Preview
          </button>
        </div>
      </div>

      {/* Document Info */}
      <FormSection title="ข้อมูลเอกสาร" icon={isInvoice ? Receipt : FileText}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="วันที่ออกเอกสาร">
            <input type="date" className="input" value={form.issueDate}
              onChange={(e) => set('issueDate', e.target.value)} />
          </FormField>
          {isInvoice ? (
            <FormField label="วันครบกำหนด">
              <input type="date" className="input" value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)} />
            </FormField>
          ) : (
            <FormField label="ใบเสนอราคาใช้ได้ถึง">
              <input type="date" className="input" value={form.validUntil}
                onChange={(e) => set('validUntil', e.target.value)} />
            </FormField>
          )}
          <FormField label="สถานะ">
            <select className="input cursor-pointer" value={form.status}
              onChange={(e) => set('status', e.target.value)}>
              {(isInvoice
                ? ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled']
                : ['draft', 'sent', 'approved', 'rejected', 'cancelled']
              ).map((s) => (
                <option key={s} value={s}>{{
                  draft: 'ร่าง', sent: 'ส่งแล้ว', paid: 'ชำระแล้ว', partial: 'ชำระบางส่วน',
                  overdue: 'เกินกำหนด', cancelled: 'ยกเลิก',
                  approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ'
                }[s]}</option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Client Info */}
      <FormSection title="ข้อมูลลูกค้า" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="ชื่อบริษัท / ลูกค้า" className="md:col-span-2">
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="input pl-9" placeholder="บริษัท ลูกค้า จำกัด"
                value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
            </div>
          </FormField>
          <FormField label="ที่อยู่" className="md:col-span-2">
            <textarea rows={2} className="input resize-none" placeholder="ที่อยู่..."
              value={form.clientAddress} onChange={(e) => set('clientAddress', e.target.value)} />
          </FormField>
          <FormField label="เบอร์โทรศัพท์">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" className="input pl-9" placeholder="02-xxx-xxxx"
                value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />
            </div>
          </FormField>
          <FormField label="อีเมล">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" className="input pl-9" placeholder="contact@company.com"
                value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} />
            </div>
          </FormField>
          <FormField label="เลขประจำตัวผู้เสียภาษี">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="input pl-9" placeholder="0105xxxxxxxxx"
                value={form.clientTaxId} onChange={(e) => set('clientTaxId', e.target.value)} />
            </div>
          </FormField>
        </div>
      </FormSection>

      {/* Items */}
      <div className="card mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <h2 className="font-semibold text-slate-900">รายการสินค้า / บริการ</h2>
          </div>
          <button onClick={addItem} className="btn-secondary text-xs px-3 py-1.5">
            <Plus className="w-3.5 h-3.5" />
            เพิ่มรายการ
          </button>
        </div>

        {/* Items header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-2.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
          <div className="col-span-5">รายการ</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-1 text-center">หน่วย</div>
          <div className="col-span-2 text-right">ราคา/หน่วย</div>
          <div className="col-span-1 text-center">ส่วนลด%</div>
          <div className="col-span-1 text-right">รวม</div>
          <div className="col-span-1"></div>
        </div>

        {/* Items rows */}
        <div className="divide-y divide-slate-50">
          {form.items.map((item, index) => {
            const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-6 py-3 items-center hover:bg-slate-50/50 group">
                <div className="col-span-5">
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder={`รายการที่ ${index + 1}`}
                    value={item.description}
                    onChange={(e) => setItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    className="input text-sm text-center"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => setItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <select
                    className="input text-sm cursor-pointer px-2"
                    value={item.unit}
                    onChange={(e) => setItem(item.id, 'unit', e.target.value)}
                  >
                    {['ชิ้น', 'งาน', 'ชุด', 'เดือน', 'วัน', 'ชั่วโมง', 'กล่อง', 'แพ็ค', 'ใบ', 'ม้วน', 'กิโลกรัม', 'ลิตร'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="input text-sm text-right"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => setItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    className="input text-sm text-center"
                    min="0" max="100"
                    value={item.discount}
                    onChange={(e) => setItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={form.items.length === 1}
                    className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50">
          <div className="max-w-xs ml-auto space-y-2.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>ราคาก่อนหักส่วนลด</span>
              <span className="font-medium">{formatCurrency(totals.subtotalBeforeDiscount)}</span>
            </div>
            {totals.itemsDiscount > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>ส่วนลดรายการ</span>
                <span className="text-red-500">-{formatCurrency(totals.itemsDiscount)}</span>
              </div>
            )}
            {/* Global discount */}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span>ส่วนลดรวม (%)</span>
                <input
                  type="number"
                  min="0" max="100"
                  className="w-14 px-2 py-0.5 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-brand-400"
                  value={form.discountGlobal}
                  onChange={(e) => set('discountGlobal', parseFloat(e.target.value) || 0)}
                />
              </div>
              <span className="text-red-500">-{formatCurrency(totals.globalDiscountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>ราคาสุทธิ (ก่อน VAT)</span>
              <span className="font-medium">{formatCurrency(totals.afterGlobalDiscount)}</span>
            </div>
            {/* VAT */}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span>VAT (%)</span>
                <input
                  type="number"
                  min="0" max="100"
                  className="w-14 px-2 py-0.5 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-brand-400"
                  value={form.vatRate}
                  onChange={(e) => set('vatRate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <span>{formatCurrency(totals.vatAmount)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">รวมทั้งสิ้น</span>
              <span className="text-lg font-bold text-brand-600">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <FormSection title="หมายเหตุและเงื่อนไข" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="หมายเหตุ">
            <textarea rows={3} className="input resize-none"
              placeholder="หมายเหตุเพิ่มเติม..."
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </FormField>
          <FormField label="เงื่อนไขการชำระเงิน">
            <textarea rows={3} className="input resize-none"
              placeholder="เงื่อนไขการชำระเงิน..."
              value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={() => navigate(isInvoice ? '/invoices' : '/quotations')} className="btn-secondary">
          ยกเลิก
        </button>
        <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
          <Eye className="w-4 h-4" />
          บันทึก & Preview
        </button>
      </div>
    </div>
  )
}
