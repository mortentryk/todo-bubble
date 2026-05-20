import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Matches vercel.json / Public/_headers so `vite preview` behaves like production. */
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; media-src 'self'; worker-src 'self'; manifest-src 'self'; upgrade-insecure-requests",
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    publicDir: 'Public',
    preview: {
      headers: securityHeaders,
    },
})
