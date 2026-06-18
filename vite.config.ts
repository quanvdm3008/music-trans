import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  optimizeDeps: {
    // Verovio ships a ~7 MB single-file WASM module that breaks esbuild's
    // dependency pre-bundling; we import it dynamically at runtime instead.
    exclude: ['verovio'],
    // note.worker.ts imports this sub-path from inside a Worker, where Vite's
    // dependency scanner doesn't see it at startup. Without this, the first
    // transcription discovers it mid-run and forces a full-page reload,
    // wiping in-progress state so the result never renders.
    include: ['@spotify/basic-pitch/esm/toMidi'],
  },
  server: {
    port: 3000,
    // Fail loudly if 3000 is taken instead of silently moving to 3001.
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: ["demo.thuannt.id.vn"]
  },
})