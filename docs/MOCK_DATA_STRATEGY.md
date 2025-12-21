/\*\*

- MEDISPACE DEVELOPMENT STRATEGY - Mock Data Usage
-
- Current Status:
- ✅ Backend Auth API - Ready to use
- 🚧 Other APIs (Products, Orders, Cart, etc.) - Use Mock Data temporarily
-
- This document outlines how to organize mock data usage while waiting for BE APIs
  \*/

## API Status Overview

| Feature         | Backend Status | Frontend Strategy       |
| --------------- | -------------- | ----------------------- |
| Authentication  | ✅ Ready       | Use real BE API         |
| User Management | ❌ Not Ready   | Use mockUserData.ts     |
| Products        | ❌ Not Ready   | Use mockData.ts         |
| Categories      | ❌ Not Ready   | Use mockCategoryData.ts |
| Cart            | ❌ Not Ready   | Use localStorage + mock |
| Orders          | ❌ Not Ready   | Use mock data           |
| Search          | ❌ Not Ready   | Use mock filtering      |
| Reviews         | ❌ Not Ready   | Use mock data           |

## Mock Data Files Structure

```
src/utils/
├── mockData.ts              # Main products data (701 lines)
├── mockDataRegistry.ts      # Central registry for all mock data
├── mockCategoryData.ts      # Categories with filters (807 lines)
├── mockUserData.ts          # User profiles (not used for auth)
└── constants.ts             # Config flags
```

## Recommended Approach

### 1. Service Layer Pattern

Create service files that can switch between mock and real APIs:

```typescript
// src/services/productService.ts
export const getProducts = async () => {
  if (USE_MOCK_DATA) {
    return mockDataRegistry.products
  } else {
    return await api.get('/products')
  }
}
```

### 2. Environment Configuration

Use environment variables to control data sources:

```env
VITE_USE_MOCK_PRODUCTS=true
VITE_USE_MOCK_CATEGORIES=true
VITE_USE_MOCK_ORDERS=true
VITE_AUTH_API_URL=http://localhost:3001/api/auth
```

### 3. Type Alignment

Ensure mock data matches TypeScript interfaces in types/

### 4. Gradual Migration

As BE APIs become ready:

1. Update service layer to use real API
2. Change environment variable
3. No component code changes needed

## Immediate Actions Needed

### Fix Product Interface Conflicts

- mockData.ts uses `salePrice`, `originalPrice`
- types/product.ts uses `price`
- Need to align these to prevent type errors

### Update Import Strategy

- Components should import from services, not direct mock files
- Use mockDataRegistry as single source of truth
- Avoid scattered mock data imports

## Benefits of This Approach

✅ **Clean separation** between mock and real data
✅ **Easy migration** when BE APIs are ready  
✅ **Type safety** maintained throughout
✅ **No component refactoring** needed later
✅ **Team can work in parallel** on FE/BE

## Next Steps

1. Standardize Product interface
2. Create service layer with mock/real API switching
3. Update components to use services
4. Setup environment configuration
5. Test auth integration with real BE
