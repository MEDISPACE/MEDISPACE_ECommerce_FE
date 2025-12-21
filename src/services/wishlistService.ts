import { apiClient } from './apiClient'
import type { Product } from '../types/product'
import { API_ENDPOINTS } from '../constants'

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
            const response = await apiClient.get<{ message: string; result: Product[] }>(API_ENDPOINTS.USERS.WISHLIST)
            return response.data.result
        } catch (error) {

            throw error
        }
    }

    async addToWishlist(productId: string): Promise<void> {
        try {
            await apiClient.post<{ message: string }>(API_ENDPOINTS.USERS.WISHLIST, { productId })
        } catch (error) {

            throw error
        }
    }

    async removeFromWishlist(productId: string): Promise<void> {
        try {
            await apiClient.delete(API_ENDPOINTS.USERS.WISHLIST_ITEM(productId))
        } catch (error) {

            throw error
        }
    }
}

export const wishlistService = new WishlistService()
export default wishlistService
