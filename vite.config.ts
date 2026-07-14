import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Quick Tunnel hostnames are randomly generated on each run. This keeps
    // the allowlist limited to Cloudflare's tunnel domain for local review.
    allowedHosts: ['.trycloudflare.com'],
  },
})
