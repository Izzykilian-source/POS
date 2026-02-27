import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // <--- INI KUNCI AGAR TIDAK BLANK PUTIH DI APK
  plugins: [
    react(), 
    tailwindcss()
  ]
})