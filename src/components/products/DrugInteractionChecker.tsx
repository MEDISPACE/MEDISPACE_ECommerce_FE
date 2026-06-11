import { AlertTriangle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface Drug {
  id: string
  name: string
  dosage: string
}

interface DrugInteractionCheckerProps {
  drugs: Drug[]
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function DrugInteractionChecker({
  drugs,
  isOpen,
  onClose,
  className = '',
}: DrugInteractionCheckerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className='flex items-center text-blue-900'>
            <AlertTriangle className='w-5 h-5 mr-2' />
            KIỂM TRA TƯƠNG TÁC THUỐC
          </DialogTitle>
          <DialogDescription>
            Hệ thống hiện chưa kết nối cơ sở dữ liệu tương tác thuốc đã được thẩm định.
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

          <Card className='p-4 border-amber-300 bg-amber-50'>
            <div className='flex gap-3 text-amber-900'>
              <AlertTriangle className='w-5 h-5 flex-shrink-0 mt-0.5' />
              <div>
                <h3 className='font-semibold'>Chưa được đánh giá</h3>
                <p className='text-sm mt-1'>
                  Không được hiểu việc không hiển thị cảnh báo là tổ hợp thuốc an toàn. Dược sĩ phải kiểm tra độc lập
                  bằng nguồn chuyên môn đã được phê duyệt trước khi cấp thuốc.
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className='flex justify-end space-x-3'>
            <Button variant='outline' onClick={onClose}>
              <X className='w-4 h-4 mr-2' />
              Đóng
            </Button>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
