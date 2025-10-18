import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Separator } from '../ui/separator'
import { Star, Phone, Mail, AlertTriangle, Calendar, Award, MapPin } from 'lucide-react'
import { getPrescriptionStatusBadge, getOrderStatusBadge } from '../../utils/badgeUtils'

interface PharmacistData {
  id: string
  name: string
  avatar?: string
  license: string
  experience: string
  specialties: string[]
  rating: number
  totalReviews: number
  isOnline: boolean
  responseTime: string
  languages: string[]
  education: string
  location: string
}

interface RelatedPrescription {
  id: string
  status: 'processing' | 'approved' | 'rejected'
  doctor: string
  date: string
}

interface RelatedOrder {
  id: string
  total: number
  itemCount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped'
}

interface PharmacistInfoProps {
  pharmacist: PharmacistData
  prescriptions?: RelatedPrescription[]
  orders?: RelatedOrder[]
  onCall?: () => void
  onEmail?: () => void
  onRate?: () => void
  onReport?: () => void
  className?: string
}

export function PharmacistInfo({
  pharmacist,
  prescriptions = [],
  orders = [],
  onCall,
  onEmail,
  onRate,
  onReport,
  className = '',
}: PharmacistInfoProps) {
  // Helper to determine if status is prescription or order related
  const getStatusBadge = (status: string, type: 'prescription' | 'order' = 'prescription') => {
    if (type === 'prescription') {
      return getPrescriptionStatusBadge(status)
    }
    return getOrderStatusBadge(status)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pharmacist Profile */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>👨‍⚕️ THÔNG TIN DƯỢC SĨ</h3>

          <div className='flex items-start space-x-4 mb-4'>
            <div className='relative'>
              <Avatar className='w-16 h-16'>
                <AvatarImage src={pharmacist.avatar} />
                <AvatarFallback className='bg-blue-100 text-blue-600 text-lg'>👨‍⚕️</AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${pharmacist.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}
              />
            </div>

            <div className='flex-1'>
              <div className='flex items-center space-x-2 mb-1'>
                <h4 className='font-medium text-gray-900'>{pharmacist.name}</h4>
                {pharmacist.isOnline && (
                  <Badge variant='outline' className='text-emerald-600 border-emerald-200 bg-emerald-50'>
                    Đang hoạt động
                  </Badge>
                )}
              </div>

              <div className='space-y-1 text-sm text-gray-600'>
                <div className='flex items-center space-x-2'>
                  <Award className='w-4 h-4' />
                  <span>Chứng chỉ: {pharmacist.license}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Calendar className='w-4 h-4' />
                  <span>Kinh nghiệm: {pharmacist.experience}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <MapPin className='w-4 h-4' />
                  <span>{pharmacist.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className='mb-4'>
            <p className='text-sm text-gray-600 mb-2'>Chuyên môn:</p>
            <div className='flex flex-wrap gap-1'>
              {pharmacist.specialties.map((specialty, index) => (
                <Badge key={index} variant='secondary' className='text-xs'>
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className='flex items-center space-x-1 mb-4'>
            <div className='flex space-x-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.floor(pharmacist.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className='text-sm font-medium'>{pharmacist.rating}/5</span>
            <span className='text-sm text-gray-500'>({pharmacist.totalReviews} đánh giá)</span>
          </div>

          {/* Education & Languages */}
          <div className='space-y-2 text-sm text-gray-600 mb-4'>
            <div>
              <span className='font-medium'>Học vấn:</span> {pharmacist.education}
            </div>
            <div>
              <span className='font-medium'>Ngôn ngữ:</span> {pharmacist.languages.join(', ')}
            </div>
            <div>
              <span className='font-medium'>Thời gian phản hồi:</span> {pharmacist.responseTime}
            </div>
          </div>
        </div>
      </Card>

      {/* Related Prescriptions */}
      {prescriptions.length > 0 && (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <div className='p-6'>
            <h3 className='mb-4 text-blue-900 flex items-center'>📋 ĐƠN THUỐC LIÊN QUAN</h3>

            <div className='space-y-3'>
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className='p-3 bg-blue-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-medium text-blue-900'>#{prescription.id}</span>
                    {getStatusBadge(prescription.status, 'prescription')}
                  </div>
                  <div className='text-sm text-blue-700'>
                    <div>Bác sĩ: {prescription.doctor}</div>
                    <div>Ngày: {prescription.date}</div>
                  </div>
                  <Button size='sm' variant='outline' className='mt-2 border-blue-200 text-blue-700 hover:bg-blue-50'>
                    Xem chi tiết
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Related Orders */}
      {orders.length > 0 && (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <div className='p-6'>
            <h3 className='mb-4 text-blue-900 flex items-center'>🛒 ĐƠN HÀNG ĐÃ TẠO</h3>

            <div className='space-y-3'>
              {orders.map((order) => (
                <div key={order.id} className='p-3 bg-emerald-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-medium text-emerald-900'>#{order.id}</span>
                    {getStatusBadge(order.status, 'order')}
                  </div>
                  <div className='text-sm text-emerald-700 mb-2'>
                    <div>{order.total.toLocaleString('vi-VN')}đ</div>
                    <div>{order.itemCount} sản phẩm</div>
                  </div>
                  <Button size='sm' className='bg-emerald-600 hover:bg-emerald-700 text-white'>
                    Thanh toán ngay
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>🎯 HÀNH ĐỘNG NHANH</h3>

          <div className='space-y-3'>
            <Button onClick={onCall} className='w-full bg-red-500 hover:bg-red-600 text-white'>
              <Phone className='w-4 h-4 mr-2' />
              Gọi khẩn cấp
            </Button>

            <Button
              onClick={onEmail}
              variant='outline'
              className='w-full border-blue-200 text-blue-700 hover:bg-blue-50'
            >
              <Mail className='w-4 h-4 mr-2' />
              Gửi email
            </Button>

            <Separator />

            <Button
              onClick={onRate}
              variant='outline'
              className='w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50'
            >
              <Star className='w-4 h-4 mr-2' />
              Đánh giá dược sĩ
            </Button>

            <Button onClick={onReport} variant='outline' className='w-full border-red-200 text-red-700 hover:bg-red-50'>
              <AlertTriangle className='w-4 h-4 mr-2' />
              Báo cáo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
