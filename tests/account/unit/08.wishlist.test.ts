import { describe, expect, test } from 'vitest'
import { filterWishlist, isInWishlist, sortWishlist, toggleWishlist, wishlistItemDeleted } from '../helpers/account-unit'
import { products } from '../fixtures/products'

describe('account wishlist unit rules', () => {
  test('isInWishlist returns correct boolean', () => {
    expect(isInWishlist(products.active, 'prod-1')).toBe(true)
  })

  test('toggleWishlist adds if not in list', () => {
    expect(toggleWishlist([], { id: 'prod-1' })).toHaveLength(1)
  })

  test('toggleWishlist removes if already in list', () => {
    expect(toggleWishlist([{ id: 'prod-1' }], { id: 'prod-1' })).toHaveLength(0)
  })

  test('filterWishlist by availability works', () => {
    expect(filterWishlist(products.active, 'out-of-stock')).toHaveLength(1)
  })

  test('sortWishlist by date added works', () => {
    expect(sortWishlist(products.active, 'date')[0].id).toBe('prod-2')
  })

  test('sortWishlist by price works', () => {
    expect(sortWishlist(products.active, 'price')[0].id).toBe('prod-1')
  })

  test('wishlistItemDeleted removed gracefully when product deleted', () => {
    expect(wishlistItemDeleted([...products.active, products.deleted] as any[])).toHaveLength(products.active.length)
  })
})
