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
      '/api': process.env.BACKEND ?? 'http://localhost:8080',
      '/ferrtrap': {
        target: process.env.FERRTRAP_BACKEND ?? 'http://localhost:8085',
        rewrite: (path) => path.replace(/^\/ferrtrap/, ''),
      },
    },
  },
  // `vite preview` (used by the layout-test screenshot harness) otherwise inherits
  // server.open, which steals focus and pops a browser tab on every run.
  preview: {
    open: false,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
