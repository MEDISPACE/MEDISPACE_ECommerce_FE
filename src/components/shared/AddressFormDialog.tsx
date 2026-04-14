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
import { ghnService } from '../../services/ghnService'

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
    provinceId: undefined as number | undefined,
    districtId: undefined as number | undefined,
    wardCode: undefined as string | undefined,
    address: '',
    type: defaultType as 'home' | 'office' | 'other',
    isDefault: false,
  })

  interface GHNProvince {
    ProvinceID: number
    ProvinceName: string
  }
  interface GHNDistrict {
    DistrictID: number
    DistrictName: string
  }
  interface GHNWard {
    WardCode: string
    WardName: string
  }

  const [provinces, setProvinces] = useState<GHNProvince[]>([])
  const [districts, setDistricts] = useState<GHNDistrict[]>([])
  const [wards, setWards] = useState<GHNWard[]>([])

  // Load provinces on mount
  useEffect(() => {
    ghnService
      .getProvinces()
      .then((data) => setProvinces(data || []))
      .catch((err) => console.error('Failed to load provinces', err))
  }, [])

  // Update logic when editing address
  useEffect(() => {
    if (open) {
      if (editingAddress) {
        setFormData({
          firstName: editingAddress.name.split(' ')[0] || '',
          lastName: editingAddress.name.split(' ').slice(1).join(' ') || '',
          fullName: editingAddress.name,
          phone: editingAddress.phone,
          email: '',
          province: editingAddress.province,
          district: editingAddress.district,
          ward: editingAddress.ward,
          provinceId: editingAddress.provinceId,
          districtId: editingAddress.districtId,
          wardCode: editingAddress.wardCode,
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
          provinceId: undefined,
          districtId: undefined,
          wardCode: undefined,
          address: '',
          type: defaultType,
          isDefault: false,
        })
      }
    }
  }, [open, editingAddress, defaultType])

  // Fetch districts when provinceId changes
  useEffect(() => {
    if (formData.provinceId) {
      ghnService
        .getDistricts(formData.provinceId)
        .then((data) => setDistricts(data || []))
        .catch(console.error)
    } else {
      setDistricts([])
    }
  }, [formData.provinceId])

  // Fetch wards when districtId changes
  useEffect(() => {
    if (formData.districtId) {
      ghnService
        .getWards(formData.districtId)
        .then((data) => setWards(data || []))
        .catch(console.error)
    } else {
      setWards([])
    }
  }, [formData.districtId])

  const handleSubmitAddress = async () => {
    const requiredFields = showEmail
      ? showNameFields
        ? ['firstName', 'lastName', 'phone', 'email', 'province', 'district', 'ward', 'address']
        : ['fullName', 'phone', 'email', 'province', 'district', 'ward', 'address']
      : showNameFields
        ? ['firstName', 'lastName', 'phone', 'province', 'district', 'ward', 'address']
        : ['fullName', 'phone', 'province', 'district', 'ward', 'address']

    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData]?.toString().trim())

    if (missingFields.length > 0) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const addressData = {
      name: showNameFields ? `${formData.firstName} ${formData.lastName}` : formData.fullName,
      phone: formData.phone,
      province: formData.province,
      district: formData.district,
      ward: formData.ward,
      provinceId: formData.provinceId,
      districtId: formData.districtId,
      wardCode: formData.wardCode,
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
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{title || (editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới')}</DialogTitle>
          <DialogDescription>
            {description ||
              (editingAddress
                ? 'Cập nhật thông tin địa chỉ giao hàng'
                : 'Thêm địa chỉ mới để giao hàng thuận tiện hơn')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {showNameFields ? (
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>Họ</Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder='Nhập họ'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Tên</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder='Nhập tên'
                />
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='fullName'>Họ tên *</Label>
              <Input
                id='fullName'
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder='Nhập họ tên'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='phone'>Số điện thoại</Label>
            <Input
              id='phone'
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder='Nhập số điện thoại'
            />
          </div>

          {showEmail && (
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder='Nhập email'
              />
            </div>
          )}

          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-2 col-span-3'>
              <Label htmlFor='province'>Tỉnh/Thành phố</Label>
              <Select
                value={formData.provinceId ? formData.provinceId.toString() : ''}
                onValueChange={(value) => {
                  const id = Number(value)
                  const name = provinces.find((p) => p.ProvinceID === id)?.ProvinceName || ''
                  setFormData((prev) => ({
                    ...prev,
                    provinceId: id,
                    province: name,
                    districtId: undefined,
                    district: '',
                    wardCode: undefined,
                    ward: '',
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn tỉnh/thành' />
                </SelectTrigger>
                <SelectContent className='max-h-60 overflow-y-auto'>
                  {provinces.map((province) => (
                    <SelectItem key={province.ProvinceID} value={province.ProvinceID.toString()}>
                      {province.ProvinceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 col-span-1.5'>
              <Label htmlFor='district'>Quận/Huyện</Label>
              <Select
                value={formData.districtId ? formData.districtId.toString() : ''}
                onValueChange={(value) => {
                  const id = Number(value)
                  const name = districts.find((d) => d.DistrictID === id)?.DistrictName || ''
                  setFormData((prev) => ({ ...prev, districtId: id, district: name, wardCode: undefined, ward: '' }))
                }}
                disabled={!formData.provinceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn quận/huyện' />
                </SelectTrigger>
                <SelectContent className='max-h-60 overflow-y-auto'>
                  {districts.map((district) => (
                    <SelectItem key={district.DistrictID} value={district.DistrictID.toString()}>
                      {district.DistrictName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 col-span-1'>
              <Label htmlFor='ward'>Phường/Xã</Label>
              <Select
                value={formData.wardCode || ''}
                onValueChange={(value) => {
                  const name = wards.find((w) => w.WardCode === value)?.WardName || ''
                  setFormData((prev) => ({ ...prev, wardCode: value, ward: name }))
                }}
                disabled={!formData.districtId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn phường/xã' />
                </SelectTrigger>
                <SelectContent className='max-h-60 overflow-y-auto'>
                  {wards.map((ward) => (
                    <SelectItem key={ward.WardCode} value={ward.WardCode}>
                      {ward.WardName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Địa chỉ cụ thể</Label>
            <Textarea
              id='address'
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder='Nhập địa chỉ cụ thể (số nhà, đường, ...)'
              rows={3}
            />
          </div>

          {showType && (
            <div className='space-y-2'>
              <Label>Loại địa chỉ</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value: 'home' | 'office' | 'other') =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                className='flex gap-6'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='home' id='home' />
                  <Label htmlFor='home'>Nhà riêng</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='office' id='office' />
                  <Label htmlFor='office'>Văn phòng</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='other' id='other' />
                  <Label htmlFor='other'>Khác</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isDefault'
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked as boolean }))}
            />
            <Label htmlFor='isDefault'>Đặt làm địa chỉ mặc định</Label>
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitAddress}
            className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
          >
            {submitButtonText || (editingAddress ? 'Cập nhật' : 'Thêm địa chỉ')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
