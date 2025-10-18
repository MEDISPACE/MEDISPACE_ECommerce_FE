import { useState } from 'react'
import { CreditCard, Smartphone, Building, Edit, Trash2, Shield, Star } from 'lucide-react'
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

interface PaymentMethod {
  id: string
  type: 'card' | 'ewallet' | 'bank'
  name: string
  details: string
  lastFour?: string
  expiryDate?: string
  isDefault: boolean
  icon?: string
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  onEdit: (method: PaymentMethod) => void
  onDelete: (methodId: string) => void
  onSetDefault: (methodId: string) => void
}

export function PaymentMethodCard({ paymentMethod, onEdit, onDelete, onSetDefault }: PaymentMethodCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(paymentMethod.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getIcon = () => {
    switch (paymentMethod.type) {
      case 'card':
        return <CreditCard className='w-5 h-5 text-blue-600' />
      case 'ewallet':
        return <Smartphone className='w-5 h-5 text-green-600' />
      case 'bank':
        return <Building className='w-5 h-5 text-gray-600' />
      default:
        return <CreditCard className='w-5 h-5 text-gray-600' />
    }
  }

  const getTypeLabel = () => {
    switch (paymentMethod.type) {
      case 'card':
        return 'Thẻ tín dụng/ghi nợ'
      case 'ewallet':
        return 'Ví điện tử'
      case 'bank':
        return 'Tài khoản ngân hàng'
      default:
        return 'Khác'
    }
  }

  const getCardBrand = (lastFour: string) => {
    const firstDigit = lastFour.charAt(0)
    if (firstDigit === '4') return 'Visa'
    if (firstDigit === '5') return 'Mastercard'
    return 'Card'
  }

  return (
    <Card
      className={`relative transition-all duration-200 hover:shadow-lg ${
        paymentMethod.isDefault ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50' : 'hover:shadow-md'
      }`}
    >
      {paymentMethod.isDefault && (
        <div className='absolute -top-2 -right-2'>
          <Badge className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1 rounded-full shadow-lg'>
            <Star className='w-3 h-3 mr-1 fill-current' />
            Mặc định
          </Badge>
        </div>
      )}

      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            {getIcon()}
            <div>
              <h3 className='font-medium text-gray-900'>{paymentMethod.name}</h3>
              <p className='text-sm text-gray-500'>{getTypeLabel()}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Shield className='w-4 h-4 text-green-500' />
            <span className='text-xs text-green-600'>Bảo mật</span>
          </div>
        </div>

        <div className='mb-4'>
          {paymentMethod.type === 'card' && paymentMethod.lastFour && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>
                {getCardBrand(paymentMethod.lastFour)} •••• {paymentMethod.lastFour}
              </span>
              {paymentMethod.expiryDate && <span className='text-sm text-gray-500'>{paymentMethod.expiryDate}</span>}
            </div>
          )}

          {paymentMethod.type === 'ewallet' && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>{paymentMethod.details}</span>
            </div>
          )}

          {paymentMethod.type === 'bank' && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>{paymentMethod.details}</span>
            </div>
          )}
        </div>

        <div className='flex items-center justify-between pt-4 border-t'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit(paymentMethod)}
              className='text-blue-600 border-blue-200 hover:bg-blue-50'
            >
              <Edit className='w-4 h-4 mr-1' />
              Sửa
            </Button>

            {!paymentMethod.isDefault && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-red-600 border-red-200 hover:bg-red-50'
                    disabled={isDeleting}
                  >
                    <Trash2 className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa phương thức thanh toán</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa phương thức thanh toán này? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700'>
                      Xóa phương thức
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {!paymentMethod.isDefault && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onSetDefault(paymentMethod.id)}
              className='text-blue-600 hover:bg-blue-50'
            >
              Đặt làm mặc định
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
