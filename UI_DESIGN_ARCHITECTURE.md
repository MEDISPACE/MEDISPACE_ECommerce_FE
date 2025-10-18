# MEDISPACE E-Commerce Platform - UI Design Architecture

## 🏗️ SYSTEM OVERVIEW

**Project**: Pharmacy E-commerce Platform  
**Tech Stack**: React 19 + TypeScript + React Router v7 + TailwindCSS + shadcn/ui  
**Architecture**: Professional domain-based component organization

## 📋 MAIN USER FLOWS

### 🔐 Authentication Flow

```
/auth/login → /auth/register → /auth/forgot-password → /auth/reset-password
Components: LoginPage, RegisterPage, ForgotPasswordPage, GoogleLoginButton
Layout: AuthLayout (centered, medical-themed background)
```

### 🏠 Public Pages Flow

```
/ (Homepage) → /products → /categories → /brands → /search → /about → /contact
Components: HomePage, ProductsPage, ProductCard
Layout: MainLayout (Header + Content + Footer)
```

### 🛒 Shopping Flow

```
/products → /products/:slug → /cart → /cart/checkout → /cart/success
Components: ProductCard, ProductsPage, CartPage, CartItem
Features: Add to cart, quantity management, checkout process
```

### 👤 User Account Flow

```
/account → /account/profile → /account/orders → /account/prescriptions → /account/addresses
Components: AccountLayout, AccountSidebar
Sections: Profile, Orders, Prescriptions, Wishlist, Settings
```

### 🔧 Admin Panel Flow

```
/admin → /admin/products → /admin/orders → /admin/customers → /admin/prescriptions
Components: AdminSidebar, AdminTopbar
Sections: Products, Orders, Customers, Inventory, Settings
```

## 🎨 UI COMPONENT STRUCTURE

### Layout Components (/components/layout/)

- **Header.tsx**: Top navigation, search bar, user menu, cart icon
- **Footer.tsx**: Links, contact info, social media
- **AuthLayout.tsx**: Authentication pages layout
- **MainLayout.tsx**: Main application layout

### UI Components (/components/ui/)

Professional shadcn/ui components:

- Navigation: button, dropdown-menu, navigation-menu
- Forms: input, textarea, select, checkbox, radio-group
- Data Display: table, card, badge, avatar, separator
- Feedback: alert, dialog, toast (sonner), progress
- Layout: sheet, sidebar, tabs, accordion, collapsible

### Domain Components

- **auth/**: Login, Register, Forgot Password forms
- **products/**: Product cards, product pages, filters
- **cart/**: Shopping cart, checkout forms
- **account/**: User profile, order history, prescriptions
- **admin/**: Admin dashboard, management interfaces

## 🎯 KEY PAGES TO DESIGN

### 1. Homepage (/)

**Purpose**: Main landing page for pharmacy e-commerce
**Components**: Hero section, featured categories, popular products, services
**Style**: Medical-themed, professional, trustworthy

### 2. Product Catalog (/products)

**Purpose**: Browse and search pharmaceutical products
**Components**: Product grid, filters, search, pagination
**Features**: Category filtering, price range, prescription requirements

### 3. Product Detail (/products/:slug)

**Purpose**: Detailed product information
**Components**: Image gallery, product info, specifications, reviews
**Features**: Add to cart, prescription requirements, dosage info

### 4. Shopping Cart (/cart)

**Purpose**: Review and modify cart items
**Components**: Cart items list, quantity controls, totals
**Features**: Update quantities, remove items, prescription verification

### 5. Checkout (/cart/checkout)

**Purpose**: Complete purchase process
**Components**: Shipping address, payment method, order summary
**Features**: Address management, payment processing, prescription upload

### 6. User Account (/account)

**Purpose**: User profile and order management
**Layout**: Sidebar navigation + content area
**Sections**:

- Profile management
- Order history
- Prescription management
- Address book
- Wishlist

### 7. Admin Dashboard (/admin)

**Purpose**: Administrative interface
**Layout**: Admin sidebar + content area
**Sections**:

- Product management
- Order processing
- Customer management
- Prescription verification
- Inventory tracking

## 🎨 DESIGN SYSTEM

### Color Palette

- **Primary**: Blue gradient (blue-600 to cyan-500)
- **Secondary**: Gray scale for text and backgrounds
- **Accent**: Medical green for health-related elements
- **Status**: Red for alerts, yellow for warnings, green for success

### Typography

- **Font**: Inter (Google Fonts)
- **Hierarchy**: Clear heading levels, readable body text
- **Medical Context**: Professional, trustworthy typography

### Components Style

- **Modern**: Clean, minimal design
- **Professional**: Medical/pharmacy industry standards
- **Accessible**: WCAG compliant, high contrast
- **Responsive**: Mobile-first design approach

## 📱 RESPONSIVE BREAKPOINTS

- **Mobile**: < 768px (1 column layout)
- **Tablet**: 768px - 1024px (2-3 column layout)
- **Desktop**: > 1024px (full layout with sidebars)

## 🔧 TECHNICAL FEATURES

### State Management

- **AuthContext**: User authentication state
- **Cart**: Shopping cart functionality (useCart hook)
- **Redux Slices**: User, Cart, Admin state management

### API Integration

- **Products API**: Product catalog and details
- **Cart API**: Shopping cart operations
- **Orders API**: Order processing and history
- **Prescriptions API**: Prescription management
- **Auth API**: User authentication

### Form Validation

- **Zod schemas**: Type-safe form validation
- **React Hook Form**: Form state management
- **Validated components**: FormInput, ValidatedInput

## 🚀 DEVELOPMENT STATUS

### ✅ Completed Structure

- Complete routing system (70+ routes)
- Component architecture
- TypeScript definitions
- API service layer
- Authentication foundation

### 🔄 Ready for UI Development

- All route files created
- Component structure established
- Design system foundation
- Responsive layout framework

## 💡 UI DESIGN PRIORITIES

1. **Homepage**: Hero section + featured categories
2. **Product Catalog**: Grid layout + filtering
3. **Authentication**: Login/Register forms
4. **Shopping Cart**: Cart management interface
5. **User Account**: Dashboard layout
6. **Admin Panel**: Management interface

## 🎨 BRAND IDENTITY

- **Name**: MEDISPACE
- **Tagline**: "Nhà thuốc trực tuyến #1 Việt Nam"
- **Industry**: Pharmaceutical E-commerce
- **Values**: Trust, Safety, Convenience, Professional Care
