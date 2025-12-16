import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'

interface ChatInputProps {
    onSendMessage: (content: string, imageUrl?: string) => void
    onTyping?: () => void
    onStopTyping?: () => void
    disabled?: boolean
    placeholder?: string
}

export function ChatInput({ onSendMessage, onTyping, onStopTyping, disabled, placeholder = 'Nhập tin nhắn...' }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [imageUrl, setImageUrl] = useState<string>('')
    const [isUploading, setIsUploading] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Handle typing indicator
    useEffect(() => {
        if (message.trim() && onTyping) {
            onTyping()

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            // Set new timeout to stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                onStopTyping?.()
            }, 2000)
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [message, onTyping, onStopTyping])

    const handleSend = () => {
        const trimmedMessage = message.trim()

        if (!trimmedMessage && !imageUrl) {
            return
        }

        onSendMessage(trimmedMessage, imageUrl)
        setMessage('')
        setImageUrl('')
        onStopTyping?.()

        // Focus back to textarea
        textareaRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh')
            return
        }

        // Validate file size (max 2MB to match backend)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
            toast.error(`Ảnh quá lớn (${fileSizeMB}MB). Vui lòng chọn ảnh nhỏ hơn 2MB`)
            return
        }

        setIsUploading(true)

        try {
            // Upload to S3 via media service
            const { uploadImage } = await import('../../services/mediaService')
            const uploadedUrl = await uploadImage(file)
            setImageUrl(uploadedUrl)
            toast.success('Tải ảnh lên thành công')
        } catch (error: any) {
            console.error('Upload error:', error)

            // Parse error message
            const errorMsg = error?.message || 'Không thể tải ảnh lên'
            if (errorMsg.includes('maxFileSize')) {
                toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB')
            } else {
                toast.error(errorMsg)
            }
        } finally {
            setIsUploading(false)
        }
    }

    const removeImage = () => {
        setImageUrl('')
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {/* Image preview */}
            {imageUrl && (
                <div className="mb-3 relative inline-block">
                    <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-blue-200" />
                    <button
                        onClick={removeImage}
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

                {/* Message input */}
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 min-h-[44px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={1}
                />

                {/* Send button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !imageUrl)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 h-[44px]"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
