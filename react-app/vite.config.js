import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 固定端口：让 dev(5173) 与 preview(4173) 共享同一个 origin，
// 避免重新编译运行后 localStorage 失效导致评分丢失
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
