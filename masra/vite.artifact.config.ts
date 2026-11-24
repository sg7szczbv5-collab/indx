import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds one self-contained HTML file (dist-artifact/artifact.html) for sharing as a hosted page.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-artifact', rollupOptions: { input: 'artifact.html' }, chunkSizeWarningLimit: 2000 },
})
