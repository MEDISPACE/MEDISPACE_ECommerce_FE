import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, Loader2, X, Pill } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
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
    currentUserRole
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
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) }
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
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return }
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
        onSendMessage(
            `Dược sĩ giới thiệu: ${product.name}`,
            undefined,
            product
        )
        setShowProductPicker(false)
        textareaRef.current?.focus()
    }

    return (
        <div className="border-t border-gray-200 bg-white p-3 flex-shrink-0 relative">
            {/* ProductPicker overlay */}
            {showProductPicker && (
                <ProductPicker
                    onSelect={handleProductSelect}
                    onClose={() => setShowProductPicker(false)}
                />
            )}

            {/* Image preview */}
            {imageUrl && (
                <div className="mb-3 relative inline-block">
                    <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-blue-200" />
                    <button
                        onClick={() => setImageUrl('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                {/* Image upload button */}
                <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={disabled || isUploading} />
                    <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        )}
                    </div>
                </label>

                {/* 💊 Nút gửi sản phẩm – CHỈ hiển thị cho dược sĩ */}
                {currentUserRole === 'pharmacist' && (
                    <button
                        type="button"
                        onClick={() => setShowProductPicker(v => !v)}
                        disabled={disabled}
                        title="Gửi sản phẩm"
                        className={`p-2 rounded-lg transition-colors ${
                            showProductPicker
                                ? 'bg-blue-100 text-blue-600'
                                : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'
                        }`}
                    >
                        <Pill className="w-5 h-5" />
                    </button>
                )}

                {/* Message input */}
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 min-h-[40px] max-h-24 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    rows={1}
                />

                {/* Send button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !imageUrl)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 h-[40px]"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
