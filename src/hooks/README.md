# MEDISPACE Hooks Documentation

Custom React hooks organized by domain for better maintainability and discoverability.

## 🏗️ Architecture

```
src/hooks/
├── index.ts                 # Main export file
├── cart/                    # Shopping cart hooks
│   ├── index.ts
│   └── useCart.ts
├── ui/                      # UI interaction hooks
│   ├── index.ts
│   ├── useImageLightbox.ts
│   ├── useCarousel.ts
│   └── useResponsiveGrid.ts
├── navigation/              # Navigation & routing hooks
│   ├── index.ts
│   └── useBreadcrumb.ts
├── common/                  # Utility hooks
│   ├── index.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── product/                 # Product domain hooks
│   ├── index.ts
│   ├── useProductDetail.ts
│   └── useProductFilter.ts
└── user/                    # User & auth hooks (future)
    └── index.ts
```

## 🎯 Domain Breakdown

### Cart Domain (`/cart`)

- `useCart`: Shopping cart state management with localStorage persistence

### UI Domain (`/ui`)

- `useImageLightbox`: Image gallery lightbox with keyboard navigation
- `useCarousel`: Responsive carousel with auto-scroll capabilities
- `useResponsiveGrid`: Dynamic grid layout calculations
- `useProductGrid`: Pre-configured grid for product listings
- `useCarouselGrid`: Pre-configured grid for carousels

### Navigation Domain (`/navigation`)

- `useBreadcrumb`: Dynamic breadcrumb generation
- `useCategoryBreadcrumb`: Category-specific breadcrumbs
- `useSearchBreadcrumb`: Search results breadcrumbs

### Common Domain (`/common`)

- `useLocalStorage`: Type-safe localStorage with error handling
- `useMediaQuery`: Responsive breakpoint detection

### Product Domain (`/product`)

- `useProductDetail`: Product data fetching and related products
- `useProductFilter`: Comprehensive product filtering and search

## 📖 Usage Examples

### Quick Import (Recommended)

```tsx
import { useCart, useImageLightbox, useBreadcrumb } from '~/hooks'
```

### Domain-Specific Import

```tsx
import { useImageLightbox, useCarousel } from '~/hooks/ui'
import { useCart } from '~/hooks/cart'
import { useBreadcrumb } from '~/hooks/navigation'
```

### Component Example

```tsx
function ProductDetailPage() {
  const lightbox = useImageLightbox({
    images: product.images,
    initialIndex: 0,
  })

  const carousel = useCarousel({
    itemsCount: relatedProducts.length,
    autoScroll: false,
  })

  const breadcrumbs = useBreadcrumb({ product })

  return (
    <div>
      <Breadcrumb items={breadcrumbs} />
      {/* ... rest of component */}
    </div>
  )
}
```

## 🧪 Testing

Each hook is designed to be testable in isolation:

```tsx
import { renderHook } from '@testing-library/react'
import { useImageLightbox } from '~/hooks/ui'

test('useImageLightbox should handle navigation', () => {
  const { result } = renderHook(() => useImageLightbox({ images: ['img1.jpg', 'img2.jpg'] }))

  expect(result.current.currentIndex).toBe(0)

  act(() => {
    result.current.nextImage()
  })

  expect(result.current.currentIndex).toBe(1)
})
```

## 🔮 Future Expansion

### Planned Hook Domains:

- **User Domain**: Authentication, profiles, preferences
- **Order Domain**: Order management, tracking
- **Search Domain**: Advanced search, filters, suggestions
- **Analytics Domain**: Event tracking, user behavior
- **Notification Domain**: Toast, alerts, push notifications

### Adding New Hooks:

1. Create hook in appropriate domain folder
2. Export from domain's `index.ts`
3. Add to main `index.ts` if commonly used
4. Update this documentation

## 🎨 Design Principles

1. **Single Responsibility**: Each hook has one clear purpose
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Reusability**: Designed for use across multiple components
4. **Performance**: Optimized with useMemo, useCallback where needed
5. **Error Handling**: Graceful error states and fallbacks
6. **Accessibility**: ARIA support where applicable

## 🚀 Best Practices

1. **Prefer domain imports** for better tree-shaking
2. **Use TypeScript interfaces** for all hook parameters and returns
3. **Include JSDoc comments** for complex hooks
4. **Handle loading states** for async operations
5. **Provide sensible defaults** for optional parameters
6. **Test hooks independently** before integration
