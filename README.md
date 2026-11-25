# QuoteFlow — Quotation & Invoice System

ระบบจัดการใบเสนอราคาและใบแจ้งหนี้ สร้างด้วย React + Vite + Tailwind CSS

## ฟีเจอร์

| หน้า | ฟีเจอร์ |
|------|---------|
| **Dashboard** | สรุปยอดรวม, เอกสารล่าสุด, เตือนเกินกำหนด |
| **ใบเสนอราคา** | สร้าง/แก้ไข/ลบ, กรองสถานะ, ค้นหา, แปลงเป็นใบแจ้งหนี้ |
| **ใบแจ้งหนี้** | สร้าง/แก้ไข/ลบ, กรองสถานะ, ค้นหา |
| **Preview & PDF** | ดูตัวอย่างเอกสาร, พิมพ์/บันทึก PDF |
| **ตั้งค่า** | ข้อมูลบริษัทที่ปรากฏในเอกสาร |

## การติดตั้ง

```bash
npm install
npm run dev
```

เปิดที่ http://localhost:5173

## การ Build

```bash
npm run build
```

## Stack

- **React 18** + **React Router v6**
- **Vite 6** — fast dev server & build tool
- **Tailwind CSS 3** — utility-first styling
- **Zustand** — state management + localStorage persistence
- **Lucide React** — icons

## โครงสร้างโปรเจกต์

```
src/
├── App.jsx               # Router
├── main.jsx              # Entry point
├── index.css             # Tailwind + custom styles
├── store/
│   └── useStore.js       # Zustand state (documents, company)
├── utils/
│   └── helpers.js        # Formatting, calculations
├── components/
│   └── Sidebar.jsx       # Navigation sidebar
└── pages/
    ├── Dashboard.jsx     # หน้าหลัก
    ├── QuotationList.jsx # รายการใบเสนอราคา
    ├── InvoiceList.jsx   # รายการใบแจ้งหนี้
    ├── DocumentForm.jsx  # ฟอร์มสร้าง/แก้ไข
    ├── DocumentPreview.jsx # Preview & Print
    └── Settings.jsx      # ตั้งค่าบริษัท
```
