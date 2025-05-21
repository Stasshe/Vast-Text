import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3038,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  optimizeDeps: {
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/commands',
      'dexie'
    ]
  }
});
