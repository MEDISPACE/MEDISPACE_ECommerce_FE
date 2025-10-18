import { useState } from 'react'
import { Plus, MapPin, Search } from 'lucide-react'

import { AddressCard } from './AddressCard'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { Card, CardContent } from '../ui/card'
import { toast } from 'sonner'

interface Address {
  id: string
  name: string
  phone: string
  address: string
  province: string
  district: string
  ward: string
  type: 'home' | 'office' | 'other'
  isDefault: boolean
}

const mockAddresses: Address[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '123 Nguyễn Trãi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    type: 'home',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '456 Lê Lợi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 1',
    type: 'office',
    isDefault: false,
  },
]

const provinces = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']

const districts = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10']

const wards = [
  'Phường 1',
  'Phường 2',
  'Phường 3',
  'Phường 4',
  'Phường 5',
  'Phường Bến Nghé',
  'Phường Đa Kao',
  'Phường Cầu Ông Lãnh',
]

export function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    type: 'home' as 'home' | 'office' | 'other',
    isDefault: false,
  })

  const breadcrumbItems = [{ label: 'Tài khoản', href: '/account' }, { label: 'Sổ địa chỉ' }]

  const filteredAddresses = addresses.filter(
    (address) =>
      address.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.province.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddAddress = () => {
    setEditingAddress(null)
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      address: '',
      type: 'home',
      isDefault: false,
    })
    setIsAddModalOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    const [firstName, ...lastNameParts] = address.name.split(' ')
    setFormData({
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      address: address.address,
      type: address.type,
      isDefault: address.isDefault,
    })
    setIsAddModalOpen(true)
  }

  const handleSaveAddress = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (addresses.length >= 5 && !editingAddress) {
      toast.error('Bạn chỉ có thể lưu tối đa 5 địa chỉ')
      return
    }

    const newAddress: Address = {
      id: editingAddress?.id || Date.now().toString(),
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      address: formData.address,
      province: formData.province,
      district: formData.district,
      ward: formData.ward,
      type: formData.type,
      isDefault: formData.isDefault,
    }

    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddress.id ? newAddress : formData.isDefault ? { ...addr, isDefault: false } : addr,
        ),
      )
      toast.success('Cập nhật địa chỉ thành công')
    } else {
      if (formData.isDefault) {
        setAddresses((prev) => [...prev.map((addr) => ({ ...addr, isDefault: false })), newAddress])
      } else {
        setAddresses((prev) => [...prev, newAddress])
      }
      toast.success('Thêm địa chỉ mới thành công')
    }

    setIsAddModalOpen(false)
  }

  const handleDeleteAddress = (addressId: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
    toast.success('Đã xóa địa chỉ')
  }

  const handleSetDefault = (addressId: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      })),
    )
    toast.success('Đã đặt làm địa chỉ mặc định')
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
              disabled={addresses.length >= 5}
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

        {/* Add/Edit Address Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Cập nhật thông tin địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng mới vào sổ địa chỉ'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              {/* Name */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='firstName'>Họ *</Label>
                  <Input
                    id='firstName'
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className='border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập họ'
                  />
                </div>
                <div>
                  <Label htmlFor='lastName'>Tên *</Label>
                  <Input
                    id='lastName'
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className='border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập tên'
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor='phone'>Số điện thoại *</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className='border-2 border-blue-200 focus:border-blue-500'
                  placeholder='Nhập số điện thoại'
                />
              </div>

              {/* Address Selection */}
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <Label>Tỉnh/Thành phố *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn tỉnh/thành' />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quận/Huyện *</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, district: value }))}
                  >
                    <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn quận/huyện' />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Phường/Xã *</Label>
                  <Select
                    value={formData.ward}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ward: value }))}
                  >
                    <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn phường/xã' />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Detailed Address */}
              <div>
                <Label htmlFor='address'>Địa chỉ cụ thể *</Label>
                <Textarea
                  id='address'
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className='border-2 border-blue-200 focus:border-blue-500'
                  placeholder='Số nhà, tên đường...'
                  rows={3}
                />
              </div>

              {/* Address Type */}
              <div>
                <Label>Loại địa chỉ</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value: 'home' | 'office' | 'other') =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                  className='flex gap-6 mt-2'
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='home' id='home' />
                    <Label htmlFor='home'>🏠 Nhà riêng</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='office' id='office' />
                    <Label htmlFor='office'>🏢 Văn phòng</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='other' id='other' />
                    <Label htmlFor='other'>📍 Khác</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Default Address */}
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isDefault'
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: !!checked }))}
                />
                <Label htmlFor='isDefault'>Đặt làm địa chỉ mặc định</Label>
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-4 border-t'>
              <Button variant='outline' onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveAddress}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              >
                {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
