import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// สร้าง 404.html และ .nojekyll อัตโนมัติตอน build เพื่อให้ React Router ทำงานบน GitHub Pages ได้ทุกหน้า
const githubPagesSpaPlugin = () => ({
  name: 'github-pages-spa',
  closeBundle() {
    const outDir = resolve('dist')
    try {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
      writeFileSync(resolve(outDir, '.nojekyll'), '')
    } catch {
      // ignore if dist not present
    }
  },
})

export default defineConfig({
  plugins: [react(), githubPagesSpaPlugin()],
  base: '/tex-invoice/',
})
