import type { Config } from '@react-router/dev/config'

export default {
  // Single Page Application mode for client-side routing
  ssr: false,
  // Use src directory instead of app
  appDirectory: 'src',
  // Build output directory
  buildDirectory: 'build',
  // Use file-based routing (automatic route detection from src/routes/)
  basename: '/',
} satisfies Config
