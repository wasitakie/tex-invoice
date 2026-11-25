import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Edit2, FileOutput, Wallet } from 'lucide-react'
import { useStore } from '../store/useStore'
import { calcTotals, formatCurrency, formatDate, STATUS_CONFIG } from '../utils/helpers'
import clsx from 'clsx'

export default function DocumentPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getDocument, company, convertToInvoice } = useStore()
  const doc = getDocument(id)

  if (!doc) return (
    <div className="p-8 text-center text-slate-400">ไม่พบเอกสาร</div>
  )

  const isInvoice = doc.type === 'invoice'
  const totals = calcTotals(doc)
  const cfg = STATUS_CONFIG[doc.status]
  const base = isInvoice ? '/invoices' : '/quotations'

  const handleConvert = () => {
    const inv = convertToInvoice(doc.id)
    if (inv) navigate(`/invoices/${inv.id}/preview`)
  }

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(base)} className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-sm font-bold text-slate-900">{doc.number}</span>
              <span className={clsx('badge ml-2', cfg.color)}>{cfg.label}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isInvoice && doc.status !== 'approved' && (
              <button onClick={handleConvert} className="btn-secondary">
                <FileOutput className="w-4 h-4" />
                แปลงเป็นใบแจ้งหนี้
              </button>
            )}
            {isInvoice && !['paid', 'cancelled'].includes(doc.status) && (
              <Link to={`/receipts/new/${doc.id}`} className="btn-secondary text-emerald-700">
                <Wallet className="w-4 h-4" />
                บันทึกรับชำระ
              </Link>
            )}
            <Link to={`${base}/${doc.id}/edit`} className="btn-secondary">
              <Edit2 className="w-4 h-4" />
              แก้ไข
            </Link>
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="w-4 h-4" />
              พิมพ์ / บันทึก PDF
            </button>
          </div>
        </div>
      </div>

      {/* Document Paper */}
      <div className="py-8 px-4 max-w-5xl mx-auto">
        <div
          id="print-area"
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
          style={{ minHeight: '297mm' }}
        >
          {/* Header Band */}
          <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-10 py-8 text-white">
            <div className="flex justify-between items-start">
              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Q</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{company.name}</div>
                    <div className="text-brand-200 text-xs">QuoteFlow System</div>
                  </div>
                </div>
                <div className="text-brand-100 text-xs space-y-0.5 mt-2">
                  <p>{company.address}</p>
                  {company.phone && <p>โทร: {company.phone}</p>}
                  {company.email && <p>อีเมล: {company.email}</p>}
                  {company.taxId && <p>เลขผู้เสียภาษี: {company.taxId}</p>}
                </div>
              </div>

              {/* Document Title */}
              <div className="text-right">
                <div className="text-3xl font-black tracking-tight mb-1">
                  {isInvoice ? 'ใบแจ้งหนี้' : 'ใบเสนอราคา'}
                </div>
                <div className="text-brand-200 text-sm uppercase tracking-widest mb-4">
                  {isInvoice ? 'Invoice' : 'Quotation'}
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 text-right">
                  <div className="text-xs text-brand-200 mb-0.5">เลขที่</div>
                  <div className="text-xl font-bold">{doc.number}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Info Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-10 py-4">
            <div className="flex gap-8">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">วันที่ออก</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatDate(doc.issueDate)}</div>
              </div>
              {isInvoice && doc.dueDate && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ครบกำหนด</div>
                  <div className={clsx('text-sm font-semibold mt-0.5', doc.status === 'overdue' ? 'text-orange-600' : 'text-slate-900')}>
                    {formatDate(doc.dueDate)}
                  </div>
                </div>
              )}
              {!isInvoice && doc.validUntil && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ใช้ได้ถึง</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatDate(doc.validUntil)}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">สถานะ</div>
                <div className="mt-0.5">
                  <span className={clsx('badge text-xs', cfg.color)}>{cfg.label}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-10 py-8">
            {/* Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 w-4"></div>
                  ผู้รับ
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="font-bold text-slate-900 text-base mb-1">{doc.clientName || '-'}</div>
                  {doc.clientAddress && <p className="text-sm text-slate-500 mb-2 leading-relaxed">{doc.clientAddress}</p>}
                  {doc.clientPhone && <p className="text-xs text-slate-500">📞 {doc.clientPhone}</p>}
                  {doc.clientEmail && <p className="text-xs text-slate-500">✉️ {doc.clientEmail}</p>}
                  {doc.clientTaxId && <p className="text-xs text-slate-500">🏢 เลขผู้เสียภาษี: {doc.clientTaxId}</p>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 w-4"></div>
                  สรุปยอด
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                  <div className="text-xs text-brand-600 mb-1 font-medium">ยอดรวมทั้งสิ้น</div>
                  <div className="text-3xl font-black text-brand-700">{formatCurrency(totals.total)}</div>
                  <div className="text-xs text-brand-500 mt-1">รวม VAT {doc.vatRate}%</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="h-px bg-slate-200 w-4"></div>
                รายการ
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-4 py-3 text-left text-xs font-semibold w-8">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">รายการ</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold w-20">จำนวน</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold w-16">หน่วย</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold w-28">ราคา/หน่วย</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold w-20">ส่วนลด</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold w-28">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((item, i) => {
                      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
                      return (
                        <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-xs text-center text-slate-500">{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-xs text-center text-slate-500">
                            {item.discount > 0 ? `${item.discount}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 py-1">
                  <span>ราคาก่อนหักส่วนลด</span>
                  <span>{formatCurrency(totals.subtotalBeforeDiscount)}</span>
                </div>
                {totals.itemsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-500 py-1">
                    <span>ส่วนลดรายการ</span>
                    <span>-{formatCurrency(totals.itemsDiscount)}</span>
                  </div>
                )}
                {totals.globalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500 py-1">
                    <span>ส่วนลดรวม ({doc.discountGlobal}%)</span>
                    <span>-{formatCurrency(totals.globalDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600 py-1">
                  <span>ราคาสุทธิ (ก่อน VAT)</span>
                  <span className="font-medium">{formatCurrency(totals.afterGlobalDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 py-1">
                  <span>ภาษีมูลค่าเพิ่ม ({doc.vatRate}%)</span>
                  <span>{formatCurrency(totals.vatAmount)}</span>
                </div>
                <div className="flex justify-between py-3 mt-1 border-t-2 border-brand-200 bg-brand-50 rounded-xl px-3">
                  <span className="font-bold text-brand-900">ยอดรวมทั้งสิ้น</span>
                  <span className="text-lg font-black text-brand-700">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes / Terms */}
            {(doc.notes || doc.paymentTerms) && (
              <div className="grid grid-cols-2 gap-6 mb-8">
                {doc.notes && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">หมายเหตุ</div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                      {doc.notes}
                    </p>
                  </div>
                )}
                {doc.paymentTerms && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">เงื่อนไขการชำระเงิน</div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                      {doc.paymentTerms}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-slate-100">
              <div className="text-center">
                <div className="border-b-2 border-slate-300 mb-3 pb-8"></div>
                <div className="text-xs text-slate-500">ลงชื่อผู้มีอำนาจ / Authorized Signature</div>
                <div className="text-xs text-slate-400 mt-1">{company.name}</div>
                <div className="text-xs text-slate-400 mt-1">วันที่ _______________</div>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-slate-300 mb-3 pb-8"></div>
                <div className="text-xs text-slate-500">ลงชื่อผู้รับ / Received by</div>
                <div className="text-xs text-slate-400 mt-1">{doc.clientName || '_________________'}</div>
                <div className="text-xs text-slate-400 mt-1">วันที่ _______________</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800 px-10 py-4 text-center">
            <p className="text-xs text-slate-400">
              {company.name} · {company.address}
              {company.phone && ` · โทร: ${company.phone}`}
              {company.website && ` · ${company.website}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">สร้างด้วย QuoteFlow System</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          #print-area {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .min-h-screen { min-height: auto; }
        }
      `}</style>
    </div>
  )
}
