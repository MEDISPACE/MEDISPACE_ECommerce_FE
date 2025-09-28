import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  // Main layout for all routes except auth
  layout('routes/_layout.tsx', [
    // Home page
    index('routes/_index.tsx'),
    // Dashboard
    route('dashboard', 'routes/dashboard.tsx'),
    // 404 catch-all
    route('*', 'routes/$.tsx'),
  ]),

  // Auth routes (separate layout)
  route('auth', 'routes/auth/_layout.tsx', [
    route('login', 'routes/auth/login.tsx'),
    route('register', 'routes/auth/register.tsx'),
    route('forgot-password', 'routes/auth/forgot-password.tsx'),
  ]),
] satisfies RouteConfig
