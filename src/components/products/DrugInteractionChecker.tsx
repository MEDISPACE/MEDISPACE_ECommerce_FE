import { useState } from 'react'
import { AlertTriangle, CheckCircle, X, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface Drug {
  id: string
  name: string
  dosage: string
}

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'minor' | 'moderate' | 'major'
  description: string
  recommendation: string
}

interface DrugInteractionCheckerProps {
  drugs: Drug[]
  isOpen: boolean
  onClose: () => void
  onAccept: (notes?: string) => void
  className?: string
}

const mockInteractions: DrugInteraction[] = [
  {
    drug1: 'Paracetamol',
    drug2: 'Amoxicillin',
    severity: 'minor',
    description: 'Theo dõi chức năng gan nếu dùng lâu dài',
    recommendation: 'Uống thuốc sau ăn và cách nhau ít nhất 30 phút',
  },
]

const mockRecommendations = [
  'Uống thuốc sau ăn',
  'Cách nhau ít nhất 30 phút',
  'Theo dõi dị ứng với Amoxicillin',
  'Kiểm tra chức năng gan định kỳ nếu dùng lâu dài',
  'Uống đủ nước khi dùng thuốc',
]

export function DrugInteractionChecker({
  drugs,
  isOpen,
  onClose,
  onAccept,
  className = '',
}: DrugInteractionCheckerProps) {
  const [additionalNotes, setAdditionalNotes] = useState('')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'minor':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'major':
        return <X className='w-4 h-4 text-red-500' />
      case 'moderate':
        return <AlertTriangle className='w-4 h-4 text-amber-500' />
      case 'minor':
        return <AlertTriangle className='w-4 h-4 text-blue-500' />
      default:
        return <CheckCircle className='w-4 h-4 text-green-500' />
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'Nghiêm trọng'
      case 'moderate':
        return 'Trung bình'
      case 'minor':
        return 'Nhẹ'
      default:
        return 'An toàn'
    }
  }

  const handleAccept = () => {
    onAccept(additionalNotes)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className='flex items-center text-blue-900'>
            <AlertTriangle className='w-5 h-5 mr-2' />
            KIỂM TRA TƯƠNG TÁC THUỐC
          </DialogTitle>
          <DialogDescription>
            Kiểm tra tương tác giữa các loại thuốc trong đơn hàng để đảm bảo an toàn cho sức khỏe
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Drugs being checked */}
          <Card className='p-4'>
            <h3 className='font-medium mb-3'>🔍 Đang kiểm tra tương tác giữa:</h3>
            <div className='flex flex-wrap gap-2'>
              {drugs.map((drug) => (
                <Badge key={drug.id} variant='outline' className='px-3 py-1'>
                  {drug.name} {drug.dosage}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Interaction Results */}
          <Card className='p-4'>
            <h3 className='font-medium mb-4 flex items-center'>
              <CheckCircle className='w-5 h-5 mr-2 text-emerald-500' />
              KẾT QUẢ KIỂM TRA:
            </h3>

            <div className='space-y-3'>
              {/* Safe combinations */}
              <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-lg'>
                <div className='flex items-center space-x-2 mb-2'>
                  <CheckCircle className='w-4 h-4 text-emerald-600' />
                  <span className='font-medium text-emerald-800'>Paracetamol + Vitamin C: An toàn</span>
                </div>
              </div>

              <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-lg'>
                <div className='flex items-center space-x-2 mb-2'>
                  <CheckCircle className='w-4 h-4 text-emerald-600' />
                  <span className='font-medium text-emerald-800'>Amoxicillin + Vitamin C: An toàn</span>
                </div>
              </div>

              {/* Interactions found */}
              {mockInteractions.map((interaction, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getSeverityColor(interaction.severity)}`}>
                  <div className='flex items-center space-x-2 mb-2'>
                    {getSeverityIcon(interaction.severity)}
                    <span className='font-medium'>
                      {interaction.drug1} + {interaction.drug2}: {getSeverityLabel(interaction.severity)}
                    </span>
                  </div>
                  <p className='text-sm mb-2'>→ {interaction.description}</p>
                  <p className='text-sm italic'>💡 {interaction.recommendation}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className='p-4'>
            <h3 className='font-medium mb-4 text-blue-900'>📋 KHUYẾN NGHỊ:</h3>
            <div className='space-y-2'>
              {mockRecommendations.map((rec, index) => (
                <div key={index} className='flex items-start space-x-2'>
                  <span className='text-blue-600 mt-1'>•</span>
                  <span className='text-sm'>{rec}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Additional Notes */}
          <Card className='p-4'>
            <h3 className='font-medium mb-3'>📝 Ghi chú bổ sung:</h3>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder='Thêm ghi chú về cách sử dụng, theo dõi hoặc lưu ý đặc biệt...'
              className='w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none'
              rows={3}
            />
          </Card>

          {/* Actions */}
          <div className='flex justify-end space-x-3'>
            <Button variant='outline' onClick={onClose}>
              <X className='w-4 h-4 mr-2' />
              Đóng
            </Button>

            <Button
              variant='outline'
              onClick={() => {
                setAdditionalNotes((prev) => prev + '\n' + mockRecommendations.join('\n'))
              }}
            >
              <FileText className='w-4 h-4 mr-2' />
              Thêm ghi chú
            </Button>

            <Button onClick={handleAccept} className='bg-emerald-600 hover:bg-emerald-700 text-white'>
              <CheckCircle className='w-4 h-4 mr-2' />
              Chấp nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
