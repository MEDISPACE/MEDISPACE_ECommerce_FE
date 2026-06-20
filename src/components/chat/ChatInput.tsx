import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, Loader2, X, Pill } from 'lucide-react'
import { Button } from '../ui/button'
import { ChatTextarea } from './ChatTextarea'
import { ProductPicker } from './ProductPicker'
import { toast } from 'sonner'
import type { ProductRef } from '~/types/chat'

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string, productRef?: ProductRef) => void
  onTyping?: () => void
  onStopTyping?: () => void
  disabled?: boolean
  placeholder?: string
  currentUserRole?: 'customer' | 'pharmacist'
}

export function ChatInput({
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled,
  placeholder = 'Nhập tin nhắn...',
  currentUserRole,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && onTyping) {
      onTyping()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 2000)
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [message, onTyping, onStopTyping])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage && imageUrls.length === 0) return

    if (imageUrls.length > 0) {
      // Gửi ảnh đầu tiên kèm text (nếu có)
      onSendMessage(trimmedMessage, imageUrls[0])
      // Gửi các ảnh còn lại thành tin nhắn rời rạc (không text)
      for (let i = 1; i < imageUrls.length; i++) {
        onSendMessage('', imageUrls[i])
      }
    } else if (trimmedMessage) {
      onSendMessage(trimmedMessage)
    }

    setMessage('')
    setImageUrls([])
    onStopTyping?.()
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter được xử lý bởi ChatTextarea — chỉ cần handle các phím đặc biệt khác
    // Enter-to-send được pass qua onSend prop của ChatTextarea
  }

  const handleFilesUpload = async (filesToUpload: File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return
    const maxSize = 2 * 1024 * 1024

    const validFiles = filesToUpload.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`Ảnh ${file.name} quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    try {
      const { uploadImage } = await import('../../services/mediaService')
      const uploadPromises = validFiles.map((file) => uploadImage(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setImageUrls((prev) => [...prev, ...uploadedUrls])
      // Chỉ hiện toast success nếu upload nhiều hơn 1 ảnh hoặc người dùng paste
      if (validFiles.length > 1) {
        toast.success(`Tải lên thành công ${uploadedUrls.length} ảnh`)
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Không thể tải ảnh lên'
      toast.error(errorMsg.includes('maxFileSize') ? 'Có ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB' : errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesUpload(Array.from(e.target.files))
    }
    // Reset input file value để có thể chọn lại cùng 1 file nếu vừa xóa
    e.target.value = ''
  }

  // Dược sĩ gửi product card
  const handleProductSelect = (product: ProductRef) => {
    onSendMessage(`Dược sĩ giới thiệu: ${product.name}`, undefined, product)
    setShowProductPicker(false)
    textareaRef.current?.focus()
  }

  return (
    <div className='border-t border-gray-200 bg-white p-3 flex-shrink-0 relative'>
      {/* ProductPicker overlay */}
      {showProductPicker && (
        <ProductPicker onSelect={handleProductSelect} onClose={() => setShowProductPicker(false)} />
      )}

      {/* Image previews — hiển thị ảnh chờ gửi kiểu Messenger */}
      {imageUrls.length > 0 && (
        <div className='mx-1 mb-2 flex overflow-x-auto gap-3 pb-2 pt-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300'>
          {imageUrls.map((url, idx) => (
            <div key={idx} className='relative flex-shrink-0 animate-in zoom-in duration-200'>
              <img
                src={url}
                alt='Preview'
                className='h-16 w-16 object-cover rounded-xl border border-gray-200 shadow-sm'
              />
              <button
                onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                className='absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 rounded-full shadow-sm transition-colors z-10'
                title='Xoá ảnh'
              >
                <X className='w-3 h-3 text-gray-500 hover:text-red-500' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Input row: items-center như Facebook Messenger ─── */}
      <div className='flex items-center gap-1.5'>
        {/* Image upload button */}
        <label className='cursor-pointer'>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={handleImageUpload}
            className='hidden'
            disabled={disabled || isUploading}
          />
          <div className='w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer'>
            {isUploading ? (
              <Loader2 className='w-5 h-5 text-gray-400 animate-spin' />
            ) : (
              <ImageIcon className='w-5 h-5 text-gray-400 group-hover:text-[#1E40AF]' />
            )}
          </div>
        </label>

        {/* Nút gửi sản phẩm - chỉ hiển thị cho dược sĩ */}
        {currentUserRole === 'pharmacist' && (
          <button
            type='button'
            onClick={() => setShowProductPicker((v) => !v)}
            disabled={disabled}
            title='Gửi sản phẩm'
            className={`w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full transition-colors ${
              showProductPicker ? 'bg-[#F0F6FF] text-[#0A2463]' : 'hover:bg-gray-100 text-gray-400 hover:text-[#1E40AF]'
            }`}
          >
            <Pill className='w-5 h-5' />
          </button>
        )}

        {/* Message input — ChatTextarea auto-resize như Zalo/Messenger */}
        <ChatTextarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onSend={handleSend}
          onPasteFiles={handleFilesUpload}
          placeholder={placeholder}
          disabled={disabled}
          className='flex-1'
        />

        {/* Send button — tròn, sáng khi có nội dung */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && imageUrls.length === 0)}
          className={`flex-shrink-0 w-9 h-9 p-0 rounded-full transition-all duration-200 ${
            message.trim() || imageUrls.length > 0
              ? 'bg-[#0A2463] hover:bg-[#1E40AF] shadow-md hover:shadow-[#BFDBFE] hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className='w-4 h-4' />
        </Button>
      </div>
    </div>
  )
}
