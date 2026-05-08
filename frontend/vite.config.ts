import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// credits.html is shipped as a self-contained static page from public/.
// If it ever needs to share React code, move it to repo root and add to
// build.rollupOptions.input here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
