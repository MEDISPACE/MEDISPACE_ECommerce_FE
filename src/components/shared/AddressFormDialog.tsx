import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { addressService } from '../../services/addressService'
import type { Address } from '../../types/user'
import { getProvinces, getDistricts, getWards } from '../../data/vietnam-full'

interface AddressFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (address: Address) => void
  editingAddress?: Address | null
  title?: string
  description?: string
  showType?: boolean
  showEmail?: boolean
  showNameFields?: boolean
  defaultType?: 'home' | 'office' | 'other'
  submitButtonText?: string
}

export function AddressFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingAddress = null,
  title,
  description,
  showType = true,
  showEmail = false,
  showNameFields = true,
  defaultType = 'home',
  submitButtonText,
}: AddressFormDialogProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    type: defaultType as 'home' | 'office' | 'other',
    isDefault: false,
  })

  const [availableDistricts, setAvailableDistricts] = useState<{ name: string, code: string }[]>([])
  const [availableWards, setAvailableWards] = useState<{ name: string, code: string }[]>([])

  // Reset form when dialog opens/closes or editing address changes
  useEffect(() => {
    if (open) {
      if (editingAddress) {
        // Find province code from name
        const provinceObj = getProvinces().find(p => p.name === editingAddress.province)
        const provinceCode = provinceObj?.code || editingAddress.province

        setFormData({
          firstName: editingAddress.name.split(' ')[0] || '',
          lastName: editingAddress.name.split(' ').slice(1).join(' ') || '',
          fullName: editingAddress.name,
          phone: editingAddress.phone,
          email: '', // Address type doesn't have email field
          province: provinceCode,
          district: editingAddress.district || '',
          ward: editingAddress.ward,
          address: editingAddress.address,
          type: editingAddress.type,
          isDefault: editingAddress.isDefault,
        })
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          fullName: '',
          phone: '',
          email: '',
          province: '',
          district: '',
          ward: '',
          address: '',
          type: defaultType,
          isDefault: false,
        })
      }
    }
  }, [open, editingAddress, defaultType])

  // Update available districts when province changes
  useEffect(() => {
    if (formData.province) {
      const districts = getDistricts(formData.province)
      setAvailableDistricts(districts)
      // Reset district and ward when province changes
      setFormData(prev => ({ ...prev, district: '', ward: '' }))
      setAvailableWards([])
    } else {
      setAvailableDistricts([])
      setAvailableWards([])
    }
  }, [formData.province])

  // Update available wards when district changes
  useEffect(() => {
    if (formData.province && formData.district) {
      const wards = getWards(formData.province, formData.district)
      setAvailableWards(wards)
      // Reset ward when district changes
      setFormData(prev => ({ ...prev, ward: '' }))
    } else {
      setAvailableWards([])
    }
  }, [formData.province, formData.district])

  const handleSubmitAddress = async () => {
    const requiredFields = showEmail
      ? (showNameFields ? ['firstName', 'lastName', 'phone', 'email', 'province', 'district', 'ward', 'address'] : ['fullName', 'phone', 'email', 'province', 'district', 'ward', 'address'])
      : (showNameFields ? ['firstName', 'lastName', 'phone', 'province', 'district', 'ward', 'address'] : ['fullName', 'phone', 'province', 'district', 'ward', 'address'])

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.toString().trim())

    if (missingFields.length > 0) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const addressData = {
      name: showNameFields ? `${formData.firstName} ${formData.lastName}` : formData.fullName,
      phone: formData.phone,
      province: getProvinces().find(p => p.code === formData.province)?.name || formData.province,
      district: availableDistricts.find(d => d.code === formData.district)?.name || formData.district,
      ward: availableWards.find(w => w.code === formData.ward)?.name || formData.ward,
      address: formData.address,
      type: formData.type,
      isDefault: formData.isDefault,
    }

    try {
      let savedAddress: Address

      if (editingAddress && editingAddress.id) {
        savedAddress = await addressService.updateAddress(editingAddress.id, addressData)
        toast.success('Đã cập nhật địa chỉ thành công')
      } else {
        savedAddress = await addressService.addAddress(addressData)
        toast.success('Đã thêm địa chỉ thành công')
      }

      onSuccess(savedAddress)
      onOpenChange(false)
    } catch (error) {
      toast.error('Không thể lưu địa chỉ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới')}
          </DialogTitle>
          <DialogDescription>
            {description || (editingAddress ? 'Cập nhật thông tin địa chỉ giao hàng' : 'Thêm địa chỉ mới để giao hàng thuận tiện hơn')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showNameFields ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Họ</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Nhập họ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Tên</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nhập tên"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nhập họ tên"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Nhập số điện thoại"
            />
          </div>

          {showEmail && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Nhập email"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-3">
              <Label htmlFor="province">Tỉnh/Thành phố</Label>
              <Select value={formData.province} onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tỉnh/thành" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {getProvinces().map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-1.5">
              <Label htmlFor="district">Quận/Huyện</Label>
              <Select
                value={formData.district}
                onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                disabled={!formData.province}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quận/huyện" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {availableDistricts.map((district) => (
                    <SelectItem key={district.code} value={district.code}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="ward">Phường/Xã</Label>
              <Select
                value={formData.ward}
                onValueChange={(value) => setFormData(prev => ({ ...prev, ward: value }))}
                disabled={!formData.district}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phường/xã" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {availableWards.map((ward) => (
                    <SelectItem key={ward.code} value={ward.code}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ cụ thể</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Nhập địa chỉ cụ thể (số nhà, đường, ...)"
              rows={3}
            />
          </div>

          {showType && (
            <div className="space-y-2">
              <Label>Loại địa chỉ</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value: 'home' | 'office' | 'other') => setFormData(prev => ({ ...prev, type: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home">Nhà riêng</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="office" id="office" />
                  <Label htmlFor="office">Văn phòng</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Khác</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked as boolean }))}
            />
            <Label htmlFor="isDefault">Đặt làm địa chỉ mặc định</Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitAddress}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
          >
            {submitButtonText || (editingAddress ? 'Cập nhật' : 'Thêm địa chỉ')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}