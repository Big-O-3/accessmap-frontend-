import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// HTTPS is required so getUserMedia works on phones over LAN (browsers only
// expose camera access on https:// or localhost). host:true binds 0.0.0.0
// so a phone on the same Wi-Fi can hit https://<LAN-IP>:5173.
//
// Cert files live outside the repo (../certs/) and are git-ignored. Generate
// once with the openssl steps in the project README; teammates re-generate
// their own. If the cert files are missing (fresh clone), we fall back to
// HTTP so `npm run dev` never blows up.
const CERT_DIR = path.resolve(__dirname, '../certs')
const CERT = path.join(CERT_DIR, 'dev-cert.pem')
const KEY  = path.join(CERT_DIR, 'dev-key.pem')
const hasCert = fs.existsSync(CERT) && fs.existsSync(KEY)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    ...(hasCert
      ? { https: { cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) } }
      : {}),
  },
})
