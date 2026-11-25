import { useState } from 'react'
import { Save, Building, Phone, Mail, Globe, Hash, CheckCircle } from 'lucide-react'
import { useStore } from '../store/useStore'

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function Settings() {
  const { company, updateCompany } = useStore()
  const [form, setForm] = useState({ ...company })
  const [saved, setSaved] = useState(false)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    updateCompany(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าบริษัท</h1>
        <p className="text-sm text-slate-500 mt-0.5">ข้อมูลนี้จะปรากฏในใบเสนอราคาและใบแจ้งหนี้ทุกใบ</p>
      </div>

      <div className="card p-6 mb-5">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
            <Building className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <h2 className="font-semibold text-slate-900">ข้อมูลบริษัท</h2>
        </div>

        <div className="space-y-4">
          <FormField label="ชื่อบริษัท">
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" className="input pl-9"
                placeholder="บริษัท ตัวอย่าง จำกัด"
                value={form.name} onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </FormField>

          <FormField label="ที่อยู่">
            <textarea
              rows={3} className="input resize-none"
              placeholder="ที่อยู่บริษัท..."
              value={form.address} onChange={(e) => set('address', e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="เบอร์โทรศัพท์">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel" className="input pl-9"
                  placeholder="02-xxx-xxxx"
                  value={form.phone} onChange={(e) => set('phone', e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="อีเมล">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email" className="input pl-9"
                  placeholder="info@company.co.th"
                  value={form.email} onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="เลขประจำตัวผู้เสียภาษี">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" className="input pl-9"
                  placeholder="0105xxxxxxxxx"
                  value={form.taxId} onChange={(e) => set('taxId', e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="เว็บไซต์">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" className="input pl-9"
                  placeholder="www.company.co.th"
                  value={form.website} onChange={(e) => set('website', e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className={saved ? 'btn-secondary text-green-600 border-green-200 bg-green-50' : 'btn-primary'}>
          {saved ? (
            <><CheckCircle className="w-4 h-4" />บันทึกแล้ว!</>
          ) : (
            <><Save className="w-4 h-4" />บันทึกการตั้งค่า</>
          )}
        </button>
      </div>

      {/* Preview Card */}
      <div className="card p-6 mt-6 border-dashed border-2 border-slate-200 bg-slate-50">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">ตัวอย่างข้อมูลบนเอกสาร</div>
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-xl p-5 text-white text-sm">
          <div className="font-bold text-lg mb-1">{form.name || 'ชื่อบริษัท'}</div>
          <div className="text-brand-200 text-xs space-y-0.5">
            {form.address && <p>{form.address}</p>}
            {form.phone && <p>โทร: {form.phone}</p>}
            {form.email && <p>อีเมล: {form.email}</p>}
            {form.taxId && <p>เลขผู้เสียภาษี: {form.taxId}</p>}
            {form.website && <p>{form.website}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
