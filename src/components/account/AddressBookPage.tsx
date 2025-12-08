import { useState, useEffect } from 'react'
import { Plus, MapPin, Search } from 'lucide-react'

import { AddressCard } from './AddressCard'
import { AddressFormDialog } from '../shared/AddressFormDialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { toast } from 'sonner'
import { addressService } from '../../services/addressService'
import type { Address } from '../../types/user'

export function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Load addresses when component mounts
  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      const userAddresses = await addressService.getAddresses()
      setAddresses(userAddresses)
    } catch (error) {
      console.error('Failed to load addresses:', error)
      toast.error('Không thể tải danh sách địa chỉ')
    }
  }

  const filteredAddresses = addresses.filter(
    (address) =>
      address.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.province.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsAddModalOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsAddModalOpen(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await addressService.deleteAddress(addressId)
      toast.success('Đã xóa địa chỉ thành công')
      loadAddresses() // Reload addresses
    } catch (error) {
      console.error('Failed to delete address:', error)
      toast.error('Không thể xóa địa chỉ')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId)
      toast.success('Đã đặt địa chỉ mặc định thành công')
      loadAddresses() // Reload addresses
    } catch (error) {
      console.error('Failed to set default address:', error)
      toast.error('Không thể đặt địa chỉ mặc định')
    }
  }

  return (

    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
              Sổ địa chỉ
            </h1>
            <p className='text-gray-600 mt-1'>Quản lý địa chỉ giao hàng của bạn</p>
          </div>

          <Button
            onClick={handleAddAddress}
            className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg'
          >
            <Plus className='w-4 h-4 mr-2' />
            Thêm địa chỉ mới
          </Button>
        </div>

        {addresses.length >= 5 && (
          <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <p className='text-sm text-yellow-800'>
              <MapPin className='w-4 h-4 inline mr-1' />
              Bạn đã đạt giới hạn tối đa 5 địa chỉ. Vui lòng xóa địa chỉ cũ để thêm địa chỉ mới.
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Tìm kiếm địa chỉ...'
            className='pl-10 border-2 border-blue-200 focus:border-blue-500'
          />
        </div>
      </div>

      {/* Address List */}
      <div className='space-y-4'>
        {filteredAddresses.length === 0 ? (
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
            <CardContent className='p-12 text-center'>
              <MapPin className='w-16 h-16 mx-auto text-gray-300 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {searchQuery ? 'Không tìm thấy địa chỉ' : 'Chưa có địa chỉ nào'}
              </h3>
              <p className='text-gray-500 mb-4'>
                {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Thêm địa chỉ đầu tiên để bắt đầu mua sắm'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={handleAddAddress}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Thêm địa chỉ đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefault}
            />
          ))
        )}
      </div>

      {/* Add/Edit Address Dialog */}
      <AddressFormDialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) {
            setEditingAddress(null)
          }
        }}
        editingAddress={editingAddress}
        onSuccess={() => {
          loadAddresses()
          setEditingAddress(null)
        }}
        showNameFields={true}
      />
    </div>
  )
}
