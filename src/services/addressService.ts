import { apiClient } from './apiClient'
import type { Address } from '../types/user'

class AddressService {
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<{ message: string; addresses: Address[] }>('/addresses')
      return response.data.addresses
    } catch (error) {
      console.error('Failed to get addresses:', error)
      throw error
    }
  }

  async addAddress(addressData: Omit<Address, 'id'>): Promise<Address> {
    try {
      const response = await apiClient.post<{ message: string; address: Address }>('/addresses', addressData)
      return response.data.address
    } catch (error) {
      console.error('Failed to add address:', error)
      throw error
    }
  }

  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    try {
      const response = await apiClient.put<{ message: string; address: Address }>(`/addresses/${addressId}`, addressData)
      return response.data.address
    } catch (error) {
      console.error('Failed to update address:', error)
      throw error
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      await apiClient.delete(`/addresses/${addressId}`)
    } catch (error) {
      console.error('Failed to delete address:', error)
      throw error
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      await apiClient.patch(`/addresses/${addressId}/default`)
    } catch (error) {
      console.error('Failed to set default address:', error)
      throw error
    }
  }
}

export const addressService = new AddressService()
export default addressService