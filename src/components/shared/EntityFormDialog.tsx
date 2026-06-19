/**
 * ============================================================================
 * EntityFormDialog - Reusable Dialog/Sheet for Entity Forms
 * ============================================================================
 */

import React from 'react'
import { Plus, CheckCircle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

export interface EntityFormDialogProps {
  /** Whether dialog/sheet is open */
  open: boolean

  /** Handler for open state change */
  onOpenChange: (open: boolean) => void

  /** Display mode: 'dialog' for simple forms, 'sheet' for complex forms */
  mode?: 'dialog' | 'sheet'

  /** Dialog/Sheet title */
  title: string

  /** Dialog/Sheet description (optional) */
  description?: string

  /** Whether this is an edit operation (affects styling/labels) */
  isEdit?: boolean

  /** Save button label */
  saveLabel?: string

  /** Cancel button label */
  cancelLabel?: string

  /** Save handler */
  onSave: () => void

  /** Cancel handler (optional - uses onOpenChange if not provided) */
  onCancel?: () => void

  /** Form content */
  children: React.ReactNode

  /** Additional footer content (optional) */
  footerContent?: React.ReactNode

  /** Custom max width for dialog (default: max-w-2xl) */
  maxWidth?: string

  /** Show info box in footer (optional) */
  infoBox?: {
    text: string
    icon?: React.ReactNode
  }
}

export function EntityFormDialog({
  open,
  onOpenChange,
  mode = 'dialog',
  title,
  description,
  isEdit = false,
  saveLabel,
  cancelLabel = 'Hủy',
  onSave,
  onCancel,
  children,
  footerContent,
  maxWidth = 'max-w-2xl',
  infoBox,
}: EntityFormDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const defaultSaveLabel = saveLabel || (isEdit ? 'Cập nhật' : 'Thêm')
  const SaveIcon = isEdit ? CheckCircle : Plus

  // Dialog variant
  if (mode === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto bg-white`}>
          <DialogHeader>
            <DialogTitle className='text-2xl bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent'>
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className='space-y-4 py-4'>{children}</div>

          <DialogFooter className='gap-2'>
            {infoBox && (
              <div className='w-full p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg mb-2'>
                <p className='text-sm text-gray-600 flex items-start gap-2'>
                  {infoBox.icon && <span className='mt-0.5'>{infoBox.icon}</span>}
                  <span>{infoBox.text}</span>
                </p>
              </div>
            )}

            {footerContent}

            <Button variant='outline' onClick={handleCancel}>
              {cancelLabel}
            </Button>
            <Button
              onClick={onSave}
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
            >
              <SaveIcon className='w-4 h-4 mr-2' />
              {defaultSaveLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Sheet (Drawer) variant
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-2xl overflow-y-auto p-0 bg-white'>
        <div className='sticky top-0 z-10 bg-white border-b border-[#E8EDF5]'>
          <SheetHeader className='p-6 pb-4'>
            <SheetTitle className='text-2xl bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent'>
              {title}
            </SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        </div>

        <div className='p-6 space-y-6'>{children}</div>

        <Separator />

        <div className='sticky bottom-0 bg-white border-t border-[#E8EDF5] p-6'>
          {infoBox && (
            <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg mb-4'>
              <p className='text-sm text-gray-600 flex items-start gap-2'>
                {infoBox.icon && <span className='mt-0.5'>{infoBox.icon}</span>}
                <span>{infoBox.text}</span>
              </p>
            </div>
          )}

          {footerContent}

          <div className='flex gap-3 mt-4'>
            <Button variant='outline' onClick={handleCancel} className='flex-1'>
              <X className='w-4 h-4 mr-2' />
              {cancelLabel}
            </Button>
            <Button
              onClick={onSave}
              className='flex-1 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
            >
              <SaveIcon className='w-4 h-4 mr-2' />
              {defaultSaveLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Helper component for delete confirmation dialog
export interface EntityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityName: string
  entityDisplayName?: string
  onConfirm: () => void
  warningMessage?: string
}

export function EntityDeleteDialog({
  open,
  onOpenChange,
  entityName,
  entityDisplayName,
  onConfirm,
  warningMessage,
}: EntityDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-white'>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa {entityName}</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa {entityName} {entityDisplayName && <strong>{entityDisplayName}</strong>}?
            {warningMessage ? (
              <>
                <br />
                {warningMessage}
              </>
            ) : (
              ' Hành động này không thể hoàn tác.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
