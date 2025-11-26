import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'

interface ProductNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => void
  productName: string
  initialNote?: string
}

export function ProductNoteModal({ isOpen, onClose, onSave, productName, initialNote = '' }: ProductNoteModalProps) {
  const [note, setNote] = useState(initialNote)

  const handleSave = () => {
    onSave(note)
    onClose()
  }

  const handleClose = () => {
    setNote(initialNote) // Reset to initial note on cancel
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-blue-900 flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            Ghi chú sản phẩm
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='bg-blue-50 p-3 rounded-lg border border-blue-100'>
            <p className='text-sm text-gray-700'>
              <span className='font-semibold text-blue-900'>Sản phẩm:</span> {productName}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='productNote' className='text-sm font-medium text-gray-700'>
              Ghi chú
            </Label>
            <Textarea
              id='productNote'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Nhập ghi chú cho sản phẩm này...&#10;&#10;Ví dụ:&#10;- Uống sau bữa ăn&#10;- Tránh tiếp xúc ánh nắng&#10;- Không uống cùng sữa'
              className='border-2 border-blue-200 focus:border-blue-500 min-h-[150px] resize-none'
              autoFocus
            />
            <p className='text-xs text-gray-500'>Ghi chú này sẽ được hiển thị trong đơn hàng và in trên hóa đơn</p>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={handleClose} className='border-gray-300'>
            Hủy
          </Button>
          <Button onClick={handleSave} className='bg-blue-600 hover:bg-blue-700 text-white'>
            <FileText className='w-4 h-4 mr-2' />
            Lưu ghi chú
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
