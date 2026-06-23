import { useState } from 'react'
import { MapPin, Edit, Trash2, Star, Phone, User } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import type { Address } from '../../types/user'

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: string) => void
  onSetDefault: (addressId: string) => void
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!address.id) return
    setIsDeleting(true)
    try {
      await onDelete(address.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'home':
        return 'Nhà riêng'
      case 'office':
        return 'Văn phòng'
      default:
        return 'Khác'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return '🏠'
      case 'office':
        return '🏢'
      default:
        return '📍'
    }
  }

  return (
    <Card
      className={`relative transition-all duration-200 hover:shadow-lg border ${
        address.isDefault
          ? 'ring-2 ring-blue-500 bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF] border-[#BFDBFE]'
          : 'hover:shadow-md border-[#BFDBFE]'
      }`}
    >
      {address.isDefault && (
        <div className='absolute -top-2 -right-2'>
          <Badge className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white px-3 py-1 rounded-full shadow-lg' data-testid='default-address-badge'>
            <Star className='w-3 h-3 mr-1 fill-current' />
            Mặc định
          </Badge>
        </div>
      )}

      <CardContent className='p-6'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-3'>
            <span className='text-2xl'>{getTypeIcon(address.type)}</span>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <User className='w-4 h-4 text-gray-500' />
                <span className='font-medium text-gray-900'>{address.name}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>{address.phone}</span>
              </div>
            </div>
          </div>

          <Badge variant='outline' className='text-xs'>
            {getTypeLabel(address.type)}
          </Badge>
        </div>

        <div className='flex items-start gap-2 mb-4'>
          <MapPin className='w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0' />
          <div className='text-sm text-gray-700 leading-relaxed'>
            <p>{address.address}</p>
            <p className='text-gray-500'>
              {address.ward}, {address.province}
            </p>
          </div>
        </div>

        <div className='flex items-center justify-between pt-4 border-t border-[#BFDBFE]'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit(address)}
              data-testid='edit-address-btn'
              className='text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]'
            >
              <Edit className='w-4 h-4 mr-1' />
              Sửa
            </Button>

            {!address.isDefault && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-red-600 border-red-200 hover:bg-red-50'
                    disabled={isDeleting}
                    data-testid='delete-address-btn'
                  >
                    <Trash2 className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid='delete-address-dialog'>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa địa chỉ</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700' data-testid='confirm-delete-address'>
                      Xóa địa chỉ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {!address.isDefault && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => address.id && onSetDefault(address.id)}
              data-testid='set-default-address-btn'
              className='text-[#1E40AF] hover:bg-[#F0F6FF]'
            >
              Đặt làm mặc định
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
