import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}', 'tests/account/{unit,integration}/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/components/chat/ChatWindow.tsx',
        'src/components/chat/FloatingChatButton.tsx',
        'src/components/chat/ProductPicker.tsx',
        'src/components/admin/AdminChatPage.tsx',
        'src/contexts/SocketContext.tsx',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 75,
        lines: 70,
      }
    },
    testTimeout: 10000,
  },
})
