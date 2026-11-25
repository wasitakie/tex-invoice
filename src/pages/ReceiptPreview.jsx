import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Edit2, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import {
  calcTotals, calcReceipt, formatCurrency, formatDate, bahtText, PAYMENT_METHODS,
} from '../utils/helpers'
import clsx from 'clsx'

function Check({ checked, label, detail }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={clsx(
        'w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-[10px] shrink-0',
        checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
      )}>
        {checked && '✓'}
      </span>
      <span className={checked ? 'text-slate-900 font-medium' : 'text-slate-400'}>
        {label}
        {checked && detail && <span className="font-normal text-slate-600"> {detail}</span>}
      </span>
    </div>
  )
}

const EMPTY_ARRAY = []

export default function ReceiptPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const receipts = useStore((s) => s.receipts || EMPTY_ARRAY)
  const documents = useStore((s) => s.documents || EMPTY_ARRAY)
  const company = useStore((s) => s.company)
  const [copy, setCopy] = useState('original')

  const r = receipts.find((x) => x.id === id)
  if (!r) return <div className="p-8 text-center text-slate-400">ไม่พบใบเสร็จ</div>

  const t = calcReceipt(r)
  const inv = r.invoiceId ? documents.find((d) => d.id === r.invoiceId) : null
  const invTotal = inv ? calcTotals(inv).total : 0
  const invPayments = inv
    ? receipts.filter((x) => x.invoiceId === inv.id).sort((a, b) => new Date(a.receiptDate) - new Date(b.receiptDate))
    : []
  const invPaid = invPayments.reduce((s, x) => s + (x.amount || 0), 0)

  const methodDetail = {
    transfer: [r.bankName, r.accountNumber && `บัญชี ${r.accountNumber}`, r.referenceNumber && `Ref ${r.referenceNumber}`].filter(Boolean).join(' · '),
    cheque: [r.bankName, r.chequeNumber && `เลขที่ ${r.chequeNumber}`, r.chequeDate && `ลงวันที่ ${formatDate(r.chequeDate)}`].filter(Boolean).join(' · '),
    credit: [r.cardLast4 && `**** ${r.cardLast4}`, r.referenceNumber && `Ref ${r.referenceNumber}`].filter(Boolean).join(' · '),
    promptpay: r.referenceNumber && `Ref ${r.referenceNumber}`,
    other: r.referenceNumber && `Ref ${r.referenceNumber}`,
    cash: '',
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/receipts')} className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-900">{r.number}</span>
            <span className="badge bg-emerald-100 text-emerald-700">รับชำระแล้ว</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl mr-2">
              {[['original', 'ต้นฉบับ'], ['copy', 'สำเนา']].map(([k, l]) => (
                <button key={k} onClick={() => setCopy(k)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold',
                    copy === k ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}>
                  {l}
                </button>
              ))}
            </div>
            <Link to={`/receipts/${r.id}/edit`} className="btn-secondary">
              <Edit2 className="w-4 h-4" /> แก้ไข
            </Link>
            <button onClick={() => window.print()} className="btn-primary">
              <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
            </button>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 max-w-5xl mx-auto">
        <div id="print-area" className="bg-white shadow-xl rounded-2xl overflow-hidden relative">
          {/* Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-[120px] font-black text-emerald-500/5 -rotate-12 select-none">PAID</div>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-10 py-8 text-white relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-bold">{company.name}</div>
                <div className="text-emerald-100 text-xs space-y-0.5 mt-2">
                  <p>{company.address}</p>
                  {company.phone && <p>โทร: {company.phone}</p>}
                  {company.email && <p>อีเมล: {company.email}</p>}
                  {company.taxId && <p>เลขประจำตัวผู้เสียภาษี: {company.taxId}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 mb-2">
                  {copy === 'original' ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY'}
                </div>
                <div className="text-3xl font-black tracking-tight">ใบเสร็จรับเงิน</div>
                <div className="text-emerald-100 text-sm uppercase tracking-widest mb-3">Receipt</div>
                <div className="bg-white/15 rounded-xl px-5 py-2.5">
                  <div className="text-xs text-emerald-100">เลขที่</div>
                  <div className="text-xl font-bold">{r.number}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-slate-50 border-b border-slate-100 px-10 py-4 flex gap-10 relative">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">วันที่รับชำระ</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatDate(r.receiptDate)}</div>
            </div>
            {r.invoiceRef && (
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">อ้างอิงใบแจ้งหนี้</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{r.invoiceRef}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ช่องทาง</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{PAYMENT_METHODS[r.paymentMethod]?.label}</div>
            </div>
          </div>

          <div className="px-10 py-8 relative">
            {/* Payer + amount */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">ได้รับเงินจาก</div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="font-bold text-slate-900 text-base mb-1">{r.clientName}</div>
                  {r.clientAddress && <p className="text-sm text-slate-500 mb-2 leading-relaxed">{r.clientAddress}</p>}
                  {r.clientPhone && <p className="text-xs text-slate-500">โทร: {r.clientPhone}</p>}
                  {r.clientTaxId && <p className="text-xs text-slate-500">เลขผู้เสียภาษี: {r.clientTaxId}</p>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">จำนวนเงินที่ได้รับ</div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="text-3xl font-black text-emerald-700">{formatCurrency(t.amount)}</div>
                  <div className="text-sm text-emerald-700 mt-1">({bahtText(t.amount)})</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-xl overflow-hidden border border-slate-100 mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">รายการ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold w-40">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((it, i) => (
                    <tr key={i} className={i % 2 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{it.description}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Payment method */}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">ชำระโดย</div>
                <div className="space-y-2">
                  {Object.entries(PAYMENT_METHODS).map(([k, cfg]) => (
                    <Check key={k} checked={r.paymentMethod === k} label={cfg.label} detail={methodDetail[k]} />
                  ))}
                </div>
              </div>
              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 py-1">
                  <span>มูลค่าก่อนภาษี</span><span>{formatCurrency(t.beforeVat)}</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1">
                  <span>ภาษีมูลค่าเพิ่ม ({r.vatRate}%)</span><span>{formatCurrency(t.vatAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 py-1 border-t border-slate-200">
                  <span>ยอดรับชำระรวม</span><span>{formatCurrency(t.amount)}</span>
                </div>
                {t.whtAmount > 0 && (
                  <div className="flex justify-between text-red-500 py-1">
                    <span>หัก ณ ที่จ่าย ({r.whtRate}%)</span><span>-{formatCurrency(t.whtAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-emerald-50 rounded-xl px-3 border-t-2 border-emerald-200">
                  <span className="font-bold text-emerald-900">รับเงินสุทธิ</span>
                  <span className="text-lg font-black text-emerald-700">{formatCurrency(t.netReceived)}</span>
                </div>
              </div>
            </div>

            {r.notes && (
              <div className="mb-8">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">หมายเหตุ</div>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">{r.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-14 pt-8 border-t border-slate-100">
              {['ผู้จ่ายเงิน / Payer', 'ผู้รับเงิน / Collector'].map((l, i) => (
                <div key={l} className="text-center">
                  <div className="border-b-2 border-slate-300 mb-3 pb-8" />
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className="text-xs text-slate-400 mt-1">{i === 0 ? r.clientName : company.name}</div>
                  <div className="text-xs text-slate-400 mt-1">วันที่ _______________</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-8 text-center">
              ใบเสร็จรับเงินนี้จะสมบูรณ์เมื่อบริษัทฯ ได้รับเงินเรียบร้อยแล้ว กรณีชำระด้วยเช็คจะสมบูรณ์เมื่อเรียกเก็บเงินได้
            </p>
          </div>

          <div className="bg-slate-800 px-10 py-4 text-center relative">
            <p className="text-xs text-slate-400">
              {company.name} · {company.address}{company.phone && ` · โทร: ${company.phone}`}
            </p>
          </div>
        </div>

        {/* Payment history for linked invoice (screen only) */}
        {inv && (
          <div className="no-print card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                ประวัติการชำระ — <Link to={`/invoices/${inv.id}/preview`} className="text-brand-600 hover:underline">{inv.number}</Link>
              </h3>
              <div className="text-sm text-slate-600">
                ชำระแล้ว <b className="text-emerald-600">{formatCurrency(invPaid)}</b> / {formatCurrency(invTotal)}
                {invTotal - invPaid > 0.01
                  ? <> · คงค้าง <b className="text-orange-600">{formatCurrency(invTotal - invPaid)}</b></>
                  : <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" />ครบแล้ว</span>}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {invPayments.map((p) => (
                <Link key={p.id} to={`/receipts/${p.id}/preview`}
                  className={clsx('flex items-center justify-between py-2.5 px-3 rounded-lg text-sm hover:bg-slate-50',
                    p.id === r.id && 'bg-emerald-50')}>
                  <span className="font-semibold text-emerald-700 w-28">{p.number}</span>
                  <span className="text-slate-500 w-40">{formatDate(p.receiptDate)}</span>
                  <span className="text-slate-600 flex-1">{PAYMENT_METHODS[p.paymentMethod]?.label}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          #print-area { box-shadow: none !important; border-radius: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
