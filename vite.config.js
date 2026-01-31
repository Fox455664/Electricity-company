import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // هذا السطر هو الحل لمشكلة عدم تحميل PDF
    global: 'window',
  },
})
