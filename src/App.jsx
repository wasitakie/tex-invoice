import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import QuotationList from './pages/QuotationList'
import InvoiceList from './pages/InvoiceList'
import DocumentForm from './pages/DocumentForm'
import DocumentPreview from './pages/DocumentPreview'
import Settings from './pages/Settings'
import ReceiptList from './pages/ReceiptList'
import ReceiptForm from './pages/ReceiptForm'
import ReceiptPreview from './pages/ReceiptPreview'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/new" element={<DocumentForm type="quotation" />} />
          <Route path="/quotations/:id/edit" element={<DocumentForm type="quotation" />} />
          <Route path="/quotations/:id/preview" element={<DocumentPreview />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<DocumentForm type="invoice" />} />
          <Route path="/invoices/:id/edit" element={<DocumentForm type="invoice" />} />
          <Route path="/invoices/:id/preview" element={<DocumentPreview />} />
          <Route path="/receipts" element={<ReceiptList />} />
          <Route path="/receipts/new" element={<ReceiptForm />} />
          <Route path="/receipts/new/:invoiceId" element={<ReceiptForm />} />
          <Route path="/receipts/:id/edit" element={<ReceiptForm />} />
          <Route path="/receipts/:id/preview" element={<ReceiptPreview />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
