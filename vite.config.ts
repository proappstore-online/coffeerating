import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Real PWA: generate + auto-register a service worker (offline + installable).
    // manifest:false keeps the existing public/manifest.json.
    VitePWA({ registerType: 'autoUpdate', manifest: false }),
  ],
})
