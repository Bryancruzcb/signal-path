import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Serve from /signal-path/ everywhere (GitHub Pages, dev, and preview).
  // The app uses hash routing, so a fixed base keeps `vite preview` working
  // against the built assets while leaving dev unaffected.
  base: '/signal-path/',
  plugins: [react()],
  server: {
    // Quick Tunnel hostnames are randomly generated on each run. This keeps
    // the allowlist limited to Cloudflare's tunnel domain for local review.
    allowedHosts: ['.trycloudflare.com'],
  },
})
