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
  route('community/video-events/:eventId', 'routes/community/video-events.$eventId.tsx'),

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
      route('orders/:orderId/return', 'routes/account/orders/$orderId.return.tsx'),
      route('payment-methods', 'routes/account/payment-methods.tsx'),
      route('prescriptions', 'routes/account/prescriptions/index.tsx'),
      route('prescriptions/:id', 'routes/account/prescriptions/$id.tsx'),
      route('returns', 'routes/account/returns/index.tsx'),
      route('returns/:requestId', 'routes/account/returns/$requestId.tsx'),
      route('loyalty', 'routes/account/loyalty.tsx'),
      route('rewards', 'routes/account/rewards.tsx'),
      route('wishlist', 'routes/account/wishlist.tsx'),
      route('reviews', 'routes/account/reviews.tsx'),
      route('settings', 'routes/account/settings.tsx'),
    ]),

    // Health
    route('health', 'routes/health/_index.tsx'),
    route('health/search', 'routes/health/search.tsx'),
    route('health/checker', 'routes/health/checker.tsx'),
    route('health/article/:slug', 'routes/health/article.$slug.tsx'),
    route('health/category/:slug', 'routes/health/category.$slug.tsx'),

    // Health needs
    route('health-needs', 'routes/health-needs/_index.tsx'),
    route('health-needs/:slug', 'routes/health-needs/$slug.tsx'),

    // Community
    route('community', 'routes/community/_index.tsx'),
    route('community/video-events', 'routes/community/video-events._index.tsx'),
    route('community/:roomId/t/:threadId', 'routes/community/$roomId.t.$threadId.tsx'),
    route('community/:roomId', 'routes/community/$roomId.tsx'),

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
    route('orders/:id', 'routes/pharmacist/orders/$id.tsx'),
    route('returns', 'routes/pharmacist/returns.tsx'),
    route('drug-database', 'routes/pharmacist/drug-database.tsx'),
    route('patient-history', 'routes/pharmacist/patient-history.tsx'),
    route('settings', 'routes/pharmacist/settings.tsx'),
    route('chat', 'routes/pharmacist/chat.tsx'),
    route('notifications', 'routes/pharmacist/notifications.tsx'),
    route('articles', 'routes/pharmacist/articles/_index.tsx'),
    route('articles/new', 'routes/pharmacist/articles/new.tsx'),
    route('articles/:id/edit', 'routes/pharmacist/articles/$id.edit.tsx'),
  ]),

  // Admin routes (separate layout)
  route('admin', 'routes/admin/_layout.tsx', [
    index('routes/admin/_index.tsx'),
    route('dashboard', 'routes/admin/dashboard.tsx'),
    route('create-order', 'routes/admin/create-order.tsx'),
    route('categories', 'routes/admin/categories.tsx'),
    route('brands', 'routes/admin/brands.tsx'),
    route('content', 'routes/admin/content.tsx'),
    route('reviews', 'routes/admin/reviews.tsx'),
    route('customers', 'routes/admin/customers/index.tsx'),
    route('inventory', 'routes/admin/inventory/index.tsx'),
    route('orders', 'routes/admin/orders.tsx'),
    route('returns', 'routes/admin/returns.tsx'),
    route('orders/list', 'routes/admin/orders/index.tsx'),
    route('orders/:id', 'routes/admin/orders/$id.tsx'),
    route('pharmacists', 'routes/admin/pharmacists.tsx'),
    route('products', 'routes/admin/products.tsx'),
    route('products/list', 'routes/admin/products/index.tsx'),
    route('products/new', 'routes/admin/products/new.tsx'),
    route('products/:id/edit', 'routes/admin/products/$id.edit.tsx'),
    route('articles', 'routes/admin/articles/_index.tsx'),
    route('articles/new', 'routes/admin/articles/new.tsx'),
    route('articles/:id/edit', 'routes/admin/articles/$id.edit.tsx'),
    route('prescriptions', 'routes/admin/prescriptions.tsx'),
    route('prescriptions/list', 'routes/admin/prescriptions/index.tsx'),
    route('prescriptions/pending', 'routes/admin/prescriptions/pending.tsx'),
    route('reports', 'routes/admin/reports.tsx'),
    route('settings', 'routes/admin/settings.tsx'),
    route('settings/general', 'routes/admin/settings/index.tsx'),
    route('users', 'routes/admin/users.tsx'),
    route('chat', 'routes/admin/chat.tsx'),
    route('community', 'routes/admin/community.tsx'),
    route('video-events', 'routes/admin/video-events.tsx'),
    route('moderation', 'routes/admin/moderation.tsx'),
    route('coupons', 'routes/admin/coupons.tsx'),
    route('loyalty', 'routes/admin/loyalty.tsx'),
    route('notifications', 'routes/admin/notifications.tsx'),
  ]),
] satisfies RouteConfig
