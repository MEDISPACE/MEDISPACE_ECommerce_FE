import { apiClient } from './apiClient'
import type { Product } from '../types/product'

export interface WishlistItem {
    _id: string
    user: string
    product: Product
    createdAt: string
    updatedAt: string
}

class WishlistService {
    async getWishlist(): Promise<Product[]> {
        try {
            const response = await apiClient.get<{ message: string; result: Product[] }>('/users/wishlist')
            return response.data.result
        } catch (error) {
            console.error('Failed to get wishlist:', error)
            throw error
        }
    }

    async addToWishlist(productId: string): Promise<void> {
        try {
            await apiClient.post<{ message: string }>('/users/wishlist', { productId })
        } catch (error) {
            console.error('Failed to add to wishlist:', error)
            throw error
        }
    }

    async removeFromWishlist(productId: string): Promise<void> {
        try {
            await apiClient.delete(`/users/wishlist/${productId}`)
        } catch (error) {
            console.error('Failed to remove from wishlist:', error)
            throw error
        }
    }
}

export const wishlistService = new WishlistService()
export default wishlistService
