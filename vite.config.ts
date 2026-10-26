import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    {
      name: 'build-identity',
      transformIndexHtml: () => [{
        tag: 'meta',
        attrs: { name: 'build-commit', content: loadEnv(mode, process.cwd()).VITE_COMMIT_SHA || 'development' },
        injectTo: 'head',
      }],
    },
    react(),
    tailwindcss(),
    // Real PWA: generate + auto-register a service worker (offline + installable).
    // manifest:false keeps the existing manifest linked from index.html.
    VitePWA({ registerType: 'autoUpdate', manifest: false }),
  ],
}))
