import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  css: {
    devSourcemap: true,
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
  },
  preview: {
    port: 3000,
  },
  plugins: [
    reactRouter(), // React Router v7
    tsconfigPaths(), // Path aliases support
  ],
})
