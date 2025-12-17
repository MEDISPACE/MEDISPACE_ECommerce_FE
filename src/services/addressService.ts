import { apiClient } from './apiClient'
import type { Address } from '../types/user'
import { API_ENDPOINTS } from '../constants'

class AddressService {
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<{ message: string; addresses: Address[] }>(API_ENDPOINTS.ADDRESSES.BASE)
      return response.data.addresses
    } catch (error) {

      throw error
    }
  }

  async addAddress(addressData: Omit<Address, 'id'>): Promise<Address> {
    try {
      const response = await apiClient.post<{ message: string; address: Address }>(API_ENDPOINTS.ADDRESSES.BASE, addressData)
      return response.data.address
    } catch (error) {

      throw error
    }
  }

  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    try {
      const response = await apiClient.put<{ message: string; address: Address }>(API_ENDPOINTS.ADDRESSES.BY_ID(addressId), addressData)
      return response.data.address
    } catch (error) {

      throw error
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.ADDRESSES.BY_ID(addressId))
    } catch (error) {

      throw error
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      await apiClient.patch(API_ENDPOINTS.ADDRESSES.SET_DEFAULT(addressId))
    } catch (error) {

      throw error
    }
  }
}

export const addressService = new AddressService()
export default addressService