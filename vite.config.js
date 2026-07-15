import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ตั้งค่าคอนฟิกสำหรับ Vite เพื่อเตรียมพร้อมสำหรับ Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    // กำหนดโฟลเดอร์ปลายทางหลังจากการ Build (Vercel จะตรวจจับโฟลเดอร์ 'dist' นี้อัตโนมัติ)
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true
  }
})