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
  const [imageUrl, setImageUrl] = useState<string>('')
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
    if (!trimmedMessage && !imageUrl) return
    onSendMessage(trimmedMessage, imageUrl)
    setMessage('')
    setImageUrl('')
    onStopTyping?.()
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter được xử lý bởi ChatTextarea — chỉ cần handle các phím đặc biệt khác
    // Enter-to-send được pass qua onSend prop của ChatTextarea
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Ảnh quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn ảnh nhỏ hơn 2MB`)
      return
    }
    setIsUploading(true)
    try {
      const { uploadImage } = await import('../../services/mediaService')
      const uploadedUrl = await uploadImage(file)
      setImageUrl(uploadedUrl)
      toast.success('Tải ảnh lên thành công')
    } catch (error: any) {
      const errorMsg = error?.message || 'Không thể tải ảnh lên'
      toast.error(errorMsg.includes('maxFileSize') ? 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB' : errorMsg)
    } finally {
      setIsUploading(false)
    }
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

      {/* Image preview — hiển thị ảnh chờ gửi kiểu Messenger */}
      {imageUrl && (
        <div className='mx-1 mb-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 animate-in slide-in-from-bottom-2 duration-200'>
          {/* Thumbnail */}
          <div className='relative flex-shrink-0'>
            <img
              src={imageUrl}
              alt='Preview'
              className='h-12 w-12 object-cover rounded-lg border border-blue-200 shadow-sm'
            />
          </div>
          {/* Info */}
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-medium text-blue-700 truncate'>Ảnh đã chọn</p>
            <p className='text-[10px] text-blue-500 mt-0.5'>Nhấn gửi để chia sẻ ảnh này</p>
          </div>
          {/* Remove button */}
          <button
            onClick={() => setImageUrl('')}
            className='flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-full transition-colors shadow-sm'
            title='Xoá ảnh'
          >
            <X className='w-3 h-3 text-gray-500 hover:text-red-500' />
          </button>
        </div>
      )}

      {/* ─── Input row: items-center như Facebook Messenger ─── */}
      <div className='flex items-center gap-1.5'>
        {/* Image upload button */}
        <label className='cursor-pointer'>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
            disabled={disabled || isUploading}
          />
          <div className='w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer'>
            {isUploading ? (
              <Loader2 className='w-5 h-5 text-gray-400 animate-spin' />
            ) : (
              <ImageIcon className='w-5 h-5 text-gray-400 group-hover:text-blue-500' />
            )}
          </div>
        </label>

        {/* 💊 Nút gửi sản phẩm – CHỈ hiển thị cho dược sĩ */}
        {currentUserRole === 'pharmacist' && (
          <button
            type='button'
            onClick={() => setShowProductPicker((v) => !v)}
            disabled={disabled}
            title='Gửi sản phẩm'
            className={`w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full transition-colors ${
              showProductPicker ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'
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
          placeholder={placeholder}
          disabled={disabled}
          className='flex-1'
        />

        {/* Send button — tròn, sáng khi có nội dung */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !imageUrl)}
          className={`flex-shrink-0 w-9 h-9 p-0 rounded-full transition-all duration-200 ${
            message.trim() || imageUrl
              ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-blue-300/50 hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className='w-4 h-4' />
        </Button>
      </div>
    </div>
  )
}
