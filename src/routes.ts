import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  // Main layout for all routes except auth
  layout('routes/_layout.tsx', [
    // Home page
    index('routes/_index.tsx'),

    // Products routes
    route('products', 'routes/products/_layout.tsx', [
      index('routes/products/index.tsx'), // /products
      route('category/:slug', 'routes/products/category.$slug.tsx'), // /products/category/:slug
      route('brand/:slug', 'routes/products/brand.$slug.tsx'), // /products/brand/:slug
      route(':slug', 'routes/products/$slug.tsx'), // /products/:slug
    ]),

    // Cart routes
    route('cart', 'routes/cart/index.tsx'), // /cart
    route('cart/checkout', 'routes/cart/checkout.tsx'), // /cart/checkout
    route('cart/success', 'routes/cart/success.tsx'), // /cart/success

    // Account routes (protected)
    route('account', 'routes/account/_layout.tsx', [
      index('routes/account/index.tsx'), // /account
      route('profile', 'routes/account/profile.tsx'), // /account/profile
      route('addresses', 'routes/account/addresses.tsx'), // /account/addresses
      route('orders', 'routes/account/orders/index.tsx'), // /account/orders
      route('orders/:orderId', 'routes/account/orders/$orderId.tsx'), // /account/orders/:id
      route('prescriptions', 'routes/account/prescriptions/index.tsx'), // /account/prescriptions
      route('prescriptions/upload', 'routes/account/prescriptions/upload.tsx'), // /account/prescriptions/upload
      route('prescriptions/:id', 'routes/account/prescriptions/$id.tsx'), // /account/prescriptions/:id
      route('wishlist', 'routes/account/wishlist.tsx'), // /account/wishlist
      route('reviews', 'routes/account/reviews.tsx'), // /account/reviews
      route('settings', 'routes/account/settings.tsx'), // /account/settings
    ]),

    // Search & Categories
    route('search', 'routes/search.tsx'), // /search
    route('categories', 'routes/categories.tsx'), // /categories
    route('brands', 'routes/brands.tsx'), // /brands
    route('promotions', 'routes/promotions.tsx'), // /promotions

    // Static pages
    route('about', 'routes/pages/about.tsx'), // /about
    route('contact', 'routes/pages/contact.tsx'), // /contact
    route('faq', 'routes/pages/faq.tsx'), // /faq
    route('terms', 'routes/pages/terms.tsx'), // /terms
    route('privacy', 'routes/pages/privacy.tsx'), // /privacy
    route('shipping-policy', 'routes/pages/shipping-policy.tsx'), // /shipping-policy

    // Dashboard (temporary - will be moved to account)
    route('dashboard', 'routes/dashboard.tsx'),

    // 404 catch-all
    route('*', 'routes/$.tsx'),
  ]),

  // Auth routes (separate layout)
  route('auth', 'routes/auth/_layout.tsx', [
    route('login', 'routes/auth/login.tsx'),
    route('register', 'routes/auth/register.tsx'),
    route('forgot-password', 'routes/auth/forgot-password.tsx'),
    route('reset-password/:token', 'routes/auth/reset-password.$token.tsx'),
  ]),

  // Admin routes (separate layout - future)
  route('admin', 'routes/admin/_layout.tsx', [
    index('routes/admin/index.tsx'), // /admin
    route('products', 'routes/admin/products/index.tsx'), // /admin/products
    route('products/new', 'routes/admin/products/new.tsx'), // /admin/products/new
    route('products/:id/edit', 'routes/admin/products/$id.edit.tsx'), // /admin/products/:id/edit
    route('orders', 'routes/admin/orders/index.tsx'), // /admin/orders
    route('orders/:id', 'routes/admin/orders/$id.tsx'), // /admin/orders/:id
    route('customers', 'routes/admin/customers/index.tsx'), // /admin/customers
    route('prescriptions', 'routes/admin/prescriptions/index.tsx'), // /admin/prescriptions
    route('prescriptions/pending', 'routes/admin/prescriptions/pending.tsx'), // /admin/prescriptions/pending
    route('inventory', 'routes/admin/inventory/index.tsx'), // /admin/inventory
    route('settings', 'routes/admin/settings/index.tsx'), // /admin/settings
  ]),
] satisfies RouteConfig
