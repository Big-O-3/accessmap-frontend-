import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS is enabled so getUserMedia works on phones over LAN (browsers only
// expose camera access on https:// or localhost). host: true binds to 0.0.0.0
// so you can hit the dev server from another device on the same network.
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
    https: true,
  },
})
