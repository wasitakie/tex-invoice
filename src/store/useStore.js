import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const generateNumber = (prefix, count) => `${prefix}-${String(count).padStart(4, '0')}`

// ========== SAMPLE RECEIPTS ==========
const SAMPLE_RECEIPTS = [
  {
    id: 'rec1',
    number: 'REC-0001',
    invoiceRef: 'INV-0001',
    invoiceId: 'inv1',
    receiptDate: '2026-11-14',
    clientName: 'บริษัท ซี คอร์ป จำกัด',
    clientAddress: '321 ถนนสีลม เขตบางรัก กรุงเทพฯ',
    clientPhone: '02-456-7890',
    clientEmail: 'finance@ccorp.co.th',
    clientTaxId: '0105550987654',
    paymentMethod: 'transfer',
    bankName: 'ธนาคารกสิกรไทย',
    accountName: 'บริษัท ตัวอย่าง จำกัด',
    accountNumber: '123-4-56789-0',
    referenceNumber: 'TRF20261114001',
    amount: 19795,         // ยอดที่ชำระ (รวม VAT)
    vatAmount: 1295,
    notes: 'ชำระค่าบริการรายเดือน ตุลาคม 2566',
    items: [
      { description: 'ค่าบริการรายเดือน ตุลาคม 2566', amount: 16050 },
      { description: 'ค่า Server Hosting', amount: 3745 },
    ],
    vatRate: 7,
    whtRate: 0,
    createdAt: '2026-11-14T10:30:00Z',
  },
]

const DEFAULT_COMPANY = {
  name: 'บริษัท ตัวอย่าง จำกัด',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  email: 'info@example.co.th',
  taxId: '0105560123456',
  website: 'www.example.co.th',
}

const SAMPLE_QUOTATIONS = [
  {
    id: 'q1',
    number: 'QT-0001',
    type: 'quotation',
    status: 'approved',
    clientName: 'บริษัท ลูกค้า เอ จำกัด',
    clientAddress: '456 ถนนรัชดาภิเษก กรุงเทพฯ',
    clientPhone: '081-234-5678',
    clientEmail: 'contact@client-a.co.th',
    clientTaxId: '0105560654321',
    issueDate: '2026-11-01',
    dueDate: '2026-11-30',
    validUntil: '2026-11-30',
    items: [
      { id: 'i1', description: 'ออกแบบเว็บไซต์ (5 หน้า)', quantity: 1, unit: 'งาน', unitPrice: 25000, discount: 0 },
      { id: 'i2', description: 'พัฒนาระบบหลังบ้าน', quantity: 1, unit: 'งาน', unitPrice: 45000, discount: 10 },
      { id: 'i3', description: 'ติดตั้งและ Deploy', quantity: 1, unit: 'งาน', unitPrice: 8000, discount: 0 },
    ],
    discountGlobal: 0,
    vatRate: 7,
    notes: 'ราคานี้รวม VAT 7% แล้ว ระยะเวลาดำเนินการ 30 วันทำการ',
    paymentTerms: 'ชำระ 50% ก่อนเริ่มงาน และ 50% เมื่องานเสร็จ',
    createdAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'q2',
    number: 'QT-0002',
    type: 'quotation',
    status: 'sent',
    clientName: 'ห้างหุ้นส่วน บีซี เทรด',
    clientAddress: '789 ถนนพระราม 9 กรุงเทพฯ',
    clientPhone: '089-876-5432',
    clientEmail: 'bc.trade@email.com',
    clientTaxId: '',
    issueDate: '2026-11-10',
    dueDate: '2026-12-10',
    validUntil: '2026-12-10',
    items: [
      { id: 'i1', description: 'โปรแกรม ERP สำหรับคลังสินค้า', quantity: 1, unit: 'ชุด', unitPrice: 120000, discount: 5 },
      { id: 'i2', description: 'อบรมการใช้งาน', quantity: 2, unit: 'วัน', unitPrice: 15000, discount: 0 },
    ],
    discountGlobal: 0,
    vatRate: 7,
    notes: '',
    paymentTerms: 'Net 30',
    createdAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'inv1',
    number: 'INV-0001',
    type: 'invoice',
    status: 'paid',
    clientName: 'บริษัท ซี คอร์ป จำกัด',
    clientAddress: '321 ถนนสีลม เขตบางรัก กรุงเทพฯ',
    clientPhone: '02-456-7890',
    clientEmail: 'finance@ccorp.co.th',
    clientTaxId: '0105550987654',
    issueDate: '2026-10-15',
    dueDate: '2026-11-14',
    validUntil: '',
    items: [
      { id: 'i1', description: 'ค่าบริการรายเดือน ตุลาคม 2566', quantity: 1, unit: 'เดือน', unitPrice: 15000, discount: 0 },
      { id: 'i2', description: 'ค่า Server Hosting', quantity: 1, unit: 'เดือน', unitPrice: 3500, discount: 0 },
    ],
    discountGlobal: 0,
    vatRate: 7,
    notes: '',
    paymentTerms: 'กรุณาชำระภายใน 30 วัน',
    createdAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'inv2',
    number: 'INV-0002',
    type: 'invoice',
    status: 'overdue',
    clientName: 'ร้าน ดี มาร์ท',
    clientAddress: '55 ตลาดนัดสวนจตุจักร กรุงเทพฯ',
    clientPhone: '091-111-2222',
    clientEmail: '',
    clientTaxId: '',
    issueDate: '2026-10-01',
    dueDate: '2026-10-31',
    validUntil: '',
    items: [
      { id: 'i1', description: 'ออกแบบป้ายโฆษณา', quantity: 3, unit: 'ชิ้น', unitPrice: 2500, discount: 0 },
    ],
    discountGlobal: 0,
    vatRate: 7,
    notes: '',
    paymentTerms: 'กรุณาชำระภายใน 30 วัน',
    createdAt: '2026-10-01T09:00:00Z',
  },
]

export const useStore = create(
  persist(
    (set, get) => ({
      documents: SAMPLE_QUOTATIONS,
      receipts: SAMPLE_RECEIPTS,
      company: DEFAULT_COMPANY,
      quotationCount: 2,
      invoiceCount: 2,
      receiptCount: 1,

      // Company
      updateCompany: (data) => set({ company: { ...get().company, ...data } }),

      // Documents CRUD
      addDocument: (doc) => {
        const state = get()
        const isInvoice = doc.type === 'invoice'
        const count = isInvoice ? state.invoiceCount + 1 : state.quotationCount + 1
        const number = generateNumber(isInvoice ? 'INV' : 'QT', count)
        const newDoc = {
          ...doc,
          id: generateId(),
          number,
          createdAt: new Date().toISOString(),
          status: 'draft',
        }
        set({
          documents: [newDoc, ...state.documents],
          quotationCount: isInvoice ? state.quotationCount : count,
          invoiceCount: isInvoice ? count : state.invoiceCount,
        })
        return newDoc
      },

      updateDocument: (id, data) =>
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),

      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),

      convertToInvoice: (quotationId) => {
        const state = get()
        const qt = state.documents.find((d) => d.id === quotationId)
        if (!qt) return null
        const count = state.invoiceCount + 1
        const newDoc = {
          ...qt,
          id: generateId(),
          number: generateNumber('INV', count),
          type: 'invoice',
          status: 'draft',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          validUntil: '',
          createdAt: new Date().toISOString(),
          convertedFrom: quotationId,
        }
        set({
          documents: [newDoc, ...state.documents],
          invoiceCount: count,
        })
        // Mark original as approved
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === quotationId ? { ...d, status: 'approved' } : d
          ),
        }))
        return newDoc
      },

      getDocument: (id) => get().documents.find((d) => d.id === id),

      getDocumentsByType: (type) =>
        get().documents.filter((d) => d.type === type).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ),

      getStats: () => {
        const { documents } = get()
        const quotations = documents.filter((d) => d.type === 'quotation')
        const invoices = documents.filter((d) => d.type === 'invoice')

        const calcTotal = (doc) => {
          const subtotal = doc.items.reduce((sum, item) => {
            const lineTotal = item.quantity * item.unitPrice
            return sum + lineTotal * (1 - (item.discount || 0) / 100)
          }, 0)
          const afterGlobal = subtotal * (1 - (doc.discountGlobal || 0) / 100)
          const vat = afterGlobal * ((doc.vatRate || 7) / 100)
          return afterGlobal + vat
        }

        const totalRevenue = invoices
          .filter((d) => d.status === 'paid')
          .reduce((sum, d) => sum + calcTotal(d), 0)

        const pendingAmount = invoices
          .filter((d) => ['sent', 'draft', 'partial'].includes(d.status))
          .reduce((sum, d) => sum + calcTotal(d), 0)

        const overdueAmount = invoices
          .filter((d) => d.status === 'overdue')
          .reduce((sum, d) => sum + calcTotal(d), 0)

        return {
          totalQuotations: quotations.length,
          totalInvoices: invoices.length,
          paidInvoices: invoices.filter((d) => d.status === 'paid').length,
          overdueInvoices: invoices.filter((d) => d.status === 'overdue').length,
          totalRevenue,
          pendingAmount,
          overdueAmount,
          conversionRate: quotations.length
            ? Math.round(
                (quotations.filter((d) => d.status === 'approved').length / quotations.length) * 100
              )
            : 0,
        }
      },

      // ========== RECEIPT ACTIONS ==========
      addReceipt: (data) => {
        const state = get()
        const currentReceipts = Array.isArray(state.receipts) ? state.receipts : []
        const count = (Number(state.receiptCount) || currentReceipts.length) + 1
        const newReceipt = {
          ...data,
          id: generateId(),
          number: generateNumber('REC', count),
          createdAt: new Date().toISOString(),
        }
        set({
          receipts: [newReceipt, ...currentReceipts],
          receiptCount: count,
        })
        if (data.invoiceId) get().syncInvoicePaymentStatus(data.invoiceId)
        return newReceipt
      },

      updateReceipt: (id, data) => {
        const currentReceipts = Array.isArray(get().receipts) ? get().receipts : []
        const prev = currentReceipts.find((r) => r.id === id)
        set((state) => ({
          receipts: (Array.isArray(state.receipts) ? state.receipts : []).map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        }))
        if (prev?.invoiceId) get().syncInvoicePaymentStatus(prev.invoiceId)
        if (data.invoiceId && data.invoiceId !== prev?.invoiceId) get().syncInvoicePaymentStatus(data.invoiceId)
      },

      deleteReceipt: (id) => {
        const currentReceipts = Array.isArray(get().receipts) ? get().receipts : []
        const prev = currentReceipts.find((r) => r.id === id)
        set((state) => ({
          receipts: (Array.isArray(state.receipts) ? state.receipts : []).filter((r) => r.id !== id),
        }))
        if (prev?.invoiceId) get().syncInvoicePaymentStatus(prev.invoiceId)
      },

      // ยอดที่รับชำระแล้วของใบแจ้งหนี้
      getPaidAmount: (invoiceId, excludeReceiptId = null) =>
        (Array.isArray(get().receipts) ? get().receipts : [])
          .filter((r) => r.invoiceId === invoiceId && r.id !== excludeReceiptId)
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),

      getReceiptsByInvoice: (invoiceId) =>
        (Array.isArray(get().receipts) ? get().receipts : [])
          .filter((r) => r.invoiceId === invoiceId)
          .sort((a, b) => new Date(a.receiptDate) - new Date(b.receiptDate)),

      // ปรับสถานะใบแจ้งหนี้ตามยอดที่รับจริง
      syncInvoicePaymentStatus: (invoiceId) => {
        const inv = get().documents.find((d) => d.id === invoiceId)
        if (!inv) return
        const subtotal = inv.items.reduce(
          (s, it) => s + it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100), 0)
        const after = subtotal * (1 - (inv.discountGlobal || 0) / 100)
        const total = after * (1 + (inv.vatRate ?? 7) / 100)
        const paid = get().getPaidAmount(invoiceId)
        let status = inv.status
        if (paid >= total - 0.01) status = 'paid'
        else if (paid > 0) status = 'partial'
        else if (['paid', 'partial'].includes(inv.status)) {
          status = inv.dueDate && new Date(inv.dueDate) < new Date() ? 'overdue' : 'sent'
        }
        if (status !== inv.status) get().updateDocument(invoiceId, { status })
      },

      getReceipt: (id) => (Array.isArray(get().receipts) ? get().receipts : []).find((r) => r.id === id),

      getReceiptStats: () => {
        const receipts = Array.isArray(get().receipts) ? get().receipts : []
        const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)
        const byMethod = receipts.reduce((acc, r) => {
          acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + (r.amount || 0)
          return acc
        }, {})
        return {
          totalReceipts: receipts.length,
          totalAmount,
          byMethod,
          thisMonth: receipts.filter((r) => {
            const d = new Date(r.receiptDate)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length,
          thisMonthAmount: receipts
            .filter((r) => {
              const d = new Date(r.receiptDate)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            .reduce((sum, r) => sum + (r.amount || 0), 0),
        }
      },
    }),
    {
      name: 'quoteflow-storage',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState
        return {
          ...persistedState,
          documents: Array.isArray(persistedState.documents) ? persistedState.documents : SAMPLE_QUOTATIONS,
          receipts: Array.isArray(persistedState.receipts) && persistedState.receipts.length > 0
            ? persistedState.receipts
            : SAMPLE_RECEIPTS,
          company: persistedState.company || DEFAULT_COMPANY,
          quotationCount: Number(persistedState.quotationCount) || 2,
          invoiceCount: Number(persistedState.invoiceCount) || 2,
          receiptCount: Number(persistedState.receiptCount) || 1,
        }
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        documents: Array.isArray(persistedState?.documents) ? persistedState.documents : currentState.documents,
        receipts: Array.isArray(persistedState?.receipts) ? persistedState.receipts : currentState.receipts,
        receiptCount: Number(persistedState?.receiptCount) || currentState.receiptCount,
      }),
    }
  )
)
