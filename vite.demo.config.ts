import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
export default defineConfig({ base: './', plugins: [react()], css: { postcss: { plugins: [tailwindcss()] } }, build: { outDir: 'dist', chunkSizeWarningLimit: 1200 } });
