// Format Thai currency
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

// Format number with commas
export const formatNumber = (n) =>
  new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

// Format Thai date
export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Calculate document totals
export const calcTotals = (doc) => {
  const subtotalBeforeDiscount = doc.items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice
  }, 0)

  const itemsDiscount = doc.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice
    return sum + lineTotal * ((item.discount || 0) / 100)
  }, 0)

  const subtotal = subtotalBeforeDiscount - itemsDiscount
  const globalDiscountAmount = subtotal * ((doc.discountGlobal || 0) / 100)
  const afterGlobalDiscount = subtotal - globalDiscountAmount
  const vatAmount = afterGlobalDiscount * ((doc.vatRate || 7) / 100)
  const total = afterGlobalDiscount + vatAmount

  return {
    subtotalBeforeDiscount,
    itemsDiscount,
    subtotal,
    globalDiscountAmount,
    afterGlobalDiscount,
    vatAmount,
    total,
  }
}

// Status config
export const STATUS_CONFIG = {
  draft:    { label: 'ร่าง', color: 'bg-slate-100 text-slate-600' },
  sent:     { label: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-600' },
  paid:     { label: 'ชำระแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  partial:  { label: 'ชำระบางส่วน', color: 'bg-amber-100 text-amber-700' },
  overdue:  { label: 'เกินกำหนด', color: 'bg-orange-100 text-orange-700' },
  cancelled:{ label: 'ยกเลิก', color: 'bg-slate-100 text-slate-500' },
}

export const QUOTATION_STATUSES = ['draft', 'sent', 'approved', 'rejected', 'cancelled']
export const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled']

// Payment method config
export const PAYMENT_METHODS = {
  transfer:  { label: 'โอนเงิน', icon: '🏦' },
  cash:      { label: 'เงินสด', icon: '💵' },
  cheque:    { label: 'เช็ค', icon: '📄' },
  credit:    { label: 'บัตรเครดิต', icon: '💳' },
  promptpay: { label: 'พร้อมเพย์', icon: '📱' },
  other:     { label: 'อื่นๆ', icon: '💰' },
}

// Today's date as YYYY-MM-DD
export const today = () => new Date().toISOString().split('T')[0]

// Add days to date
export const addDays = (dateStr, days) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Generate unique id
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`


// ========== RECEIPT ==========
// ยอดในรายการใบเสร็จเป็นยอดรวม VAT แล้ว → แยกภาษีออก + คำนวณหัก ณ ที่จ่าย
export const calcReceipt = (r) => {
  const amount = (r.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const rate = Number(r.vatRate) || 0
  const vatAmount = (amount * rate) / (100 + rate)
  const beforeVat = amount - vatAmount
  const whtAmount = beforeVat * ((Number(r.whtRate) || 0) / 100)
  return { amount, vatAmount, beforeVat, whtAmount, netReceived: amount - whtAmount }
}

// แปลงตัวเลขเป็นคำอ่านภาษาไทย เช่น 1250.50 → "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"
const TH_DIGITS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const TH_POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

const readThaiInt = (str) => {
  str = str.replace(/^0+/, '')
  if (!str) return ''
  if (str.length > 6) return readThaiInt(str.slice(0, -6)) + 'ล้าน' + readThaiInt(str.slice(-6))
  let out = ''
  const len = str.length
  for (let i = 0; i < len; i++) {
    const d = Number(str[i])
    const pos = len - i - 1
    if (d === 0) continue
    if (pos === 0 && d === 1 && len > 1) out += 'เอ็ด'
    else if (pos === 1 && d === 2) out += 'ยี่สิบ'
    else if (pos === 1 && d === 1) out += 'สิบ'
    else out += TH_DIGITS[d] + TH_POS[pos]
  }
  return out
}

export const bahtText = (num) => {
  const cents = Math.round((Number(num) || 0) * 100)
  const baht = Math.floor(cents / 100)
  const satang = cents % 100
  const bahtPart = baht > 0 ? readThaiInt(String(baht)) + 'บาท' : satang ? '' : 'ศูนย์บาท'
  return bahtPart + (satang ? readThaiInt(String(satang)) + 'สตางค์' : 'ถ้วน')
}
