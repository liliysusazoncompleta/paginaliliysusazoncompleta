import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages project site is served under /<repo-name>/.
  base: '/paginaliliysusazoncompleta/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Fotos de producto servidas por el backend (backend/public/productos).
      // Asi en dev, http://localhost:5173/productos/x.jpg tambien funciona.
      '/productos': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
