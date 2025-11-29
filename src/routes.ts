import { index, layout, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

export default [
  // Auth routes (standalone - no main layout wrapper)
  route('login', 'routes/login.tsx'),
  route('login/oauth', 'routes/login.oauth.tsx'),
  route('register', 'routes/register.tsx'),
  route('forgot-password', 'routes/forgot-password.tsx'),
  route('reset-password/:token', 'routes/reset-password.$token.tsx'),
  route('verify-email/:token', 'routes/verify-email.$token.tsx'),

  // Main layout for all other routes
  layout('routes/_layout.tsx', [
    index('routes/_index.tsx'),

    // Products
    route('products', 'routes/products/_layout.tsx', [
      index('routes/products/index.tsx'),
      route('compare', 'routes/products/compare.tsx'),
      route(':slug', 'routes/products/$slug.tsx'),
      route('category/:slug', 'routes/products/category.$slug.tsx'),
      route('brand/:slug', 'routes/products/brand.$slug.tsx'),
    ]),

    // Categories
    route('categories', 'routes/categories/_index.tsx'),
    route('categories/:slug', 'routes/categories/$slug.tsx'),
    route('categories/:slug/:subSlug', 'routes/categories/$slug/$subSlug.tsx'),

    // Cart
    route('cart', 'routes/cart/_index.tsx'),
    route('cart/checkout', 'routes/cart/checkout.tsx'),
    route('cart/success', 'routes/cart/success.tsx'),

    // Account
    route('account', 'routes/account/_layout.tsx', [
      index('routes/account/index.tsx'),
      route('profile', 'routes/account/profile.tsx'),
      route('addresses', 'routes/account/addresses.tsx'),
      route('change-password', 'routes/account/change-password.tsx'),
      route('notifications', 'routes/account/notifications.tsx'),
      route('orders', 'routes/account/orders/index.tsx'),
      route('orders/:orderId', 'routes/account/orders/$orderId.tsx'),
      route('payment-methods', 'routes/account/payment-methods.tsx'),
      route('prescriptions', 'routes/account/prescriptions/index.tsx'),
      route('prescriptions/upload', 'routes/account/prescriptions/upload.tsx'),
      route('prescriptions/:id', 'routes/account/prescriptions/$id.tsx'),
      route('rewards', 'routes/account/rewards.tsx'),
      route('wishlist', 'routes/account/wishlist.tsx'),
      route('reviews', 'routes/account/reviews.tsx'),
      route('settings', 'routes/account/settings.tsx'),
    ]),

    // Health
    route('health', 'routes/health/_index.tsx'),

    // Consultation
    route('consultation', 'routes/consultation/_index.tsx'),

    // Search
    route('search', 'routes/search.tsx'),

    // Order
    route('order/success', 'routes/order/success.tsx'),
    route('order/failure', 'routes/order/failure.tsx'),
    route('order/:id', 'routes/order/$id.tsx'),

    // Other routes
    route('about', 'routes/about.tsx'),
    route('contact', 'routes/contact.tsx'),
    route('faq', 'routes/faq.tsx'),
    route('privacy', 'routes/privacy.tsx'),
    route('terms', 'routes/terms.tsx'),
    route('shipping-policy', 'routes/shipping-policy.tsx'),
    route('upload-prescription', 'routes/upload-prescription.tsx'),
    route('dashboard', 'routes/dashboard.tsx'),

    // 404
    route('*', 'routes/$.tsx'),
  ]),

  // Pharmacist routes (separate layout)
  route('pharmacist', 'routes/pharmacist/_layout.tsx', [
    index('routes/pharmacist/_index.tsx'),
    route('dashboard', 'routes/pharmacist/dashboard.tsx'),
    route('prescriptions', 'routes/pharmacist/prescriptions.tsx'),
    route('create-order', 'routes/pharmacist/create-order.tsx'),
    route('orders', 'routes/pharmacist/orders.tsx'),
    route('chat', 'routes/pharmacist/chat.tsx'),
    route('drug-database', 'routes/pharmacist/drug-database.tsx'),
    route('patient-history', 'routes/pharmacist/patient-history.tsx'),
    route('reports', 'routes/pharmacist/reports.tsx'),
    route('settings', 'routes/pharmacist/settings.tsx'),
  ]),

  // Admin routes (separate layout)
  route('admin', 'routes/admin/_layout.tsx', [
    index('routes/admin/_index.tsx'),
    route('dashboard', 'routes/admin/dashboard.tsx'),
    route('categories', 'routes/admin/categories.tsx'),
    route('content', 'routes/admin/content.tsx'),
    route('customers', 'routes/admin/customers/index.tsx'),
    route('inventory', 'routes/admin/inventory/index.tsx'),
    route('orders', 'routes/admin/orders.tsx'),
    route('orders/list', 'routes/admin/orders/index.tsx'),
    route('orders/:id', 'routes/admin/orders/$id.tsx'),
    route('pharmacists', 'routes/admin/pharmacists.tsx'),
    route('products', 'routes/admin/products.tsx'),
    route('products/list', 'routes/admin/products/index.tsx'),
    route('products/new', 'routes/admin/products/new.tsx'),
    route('products/:id/edit', 'routes/admin/products/$id.edit.tsx'),
    route('prescriptions', 'routes/admin/prescriptions.tsx'),
    route('prescriptions/list', 'routes/admin/prescriptions/index.tsx'),
    route('prescriptions/pending', 'routes/admin/prescriptions/pending.tsx'),
    route('reports', 'routes/admin/reports.tsx'),
    route('settings', 'routes/admin/settings.tsx'),
    route('settings/general', 'routes/admin/settings/index.tsx'),
    route('users', 'routes/admin/users.tsx'),
  ]),
] satisfies RouteConfig
