import { useState, useRef } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Paperclip, Camera, Send, Smile, FileText } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface QuickResponse {
  id: string
  text: string
  category: 'thanks' | 'question' | 'medical' | 'order' | 'side-effects'
}

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void
  onSendQuickResponse: (response: QuickResponse) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const quickResponses: QuickResponse[] = [
  { id: '1', text: 'Cảm ơn dược sĩ!', category: 'thanks' },
  { id: '2', text: 'Tôi cần thêm thông tin', category: 'question' },
]

const linkCategories = [{ id: 'prescription', label: 'Gửi đơn thuốc', icon: FileText }]

export function ChatInput({
  onSendMessage,
  onSendQuickResponse,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  className = '',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleQuickResponse = (response: QuickResponse) => {
    onSendQuickResponse(response)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'thanks':
        return '🙏'
      case 'question':
        return '❓'
      case 'medical':
        return '💊'
      case 'order':
        return '🛒'
      case 'side-effects':
        return '⚠️'
      default:
        return '💬'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Links */}
      <div className='flex flex-wrap gap-2'>
        <span className='text-sm text-gray-600 mr-2'>🔗 LIÊN KẾT NHANH:</span>
        {linkCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <Button
              key={category.id}
              variant='outline'
              size='sm'
              className='h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50'
            >
              <IconComponent className='w-3 h-3 mr-1' />
              {category.label}
            </Button>
          )
        })}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Card className='p-3'>
          <div className='flex flex-wrap gap-2'>
            {attachments.map((file, index) => (
              <Badge key={index} variant='secondary' className='flex items-center space-x-1 px-2 py-1'>
                <FileText className='w-3 h-3' />
                <span className='text-xs truncate max-w-20'>{file.name}</span>
                <button onClick={() => removeAttachment(index)} className='text-gray-500 hover:text-red-500 ml-1'>
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Main Input Area */}
      <Card className='p-4'>
        <div className='flex items-end space-x-2'>
          {/* Attachment Button */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className='flex-shrink-0 p-2'
          >
            <Paperclip className='w-4 h-4' />
          </Button>

          {/* Camera Button */}
          <Button variant='ghost' size='sm' disabled={disabled} className='flex-shrink-0 p-2'>
            <Camera className='w-4 h-4' />
          </Button>

          {/* Emoji Button */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant='ghost' size='sm' disabled={disabled} className='flex-shrink-0 p-2'>
                <Smile className='w-4 h-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-64 p-2'>
              <div className='grid grid-cols-6 gap-1'>
                {['😊', '😂', '👍', '❤️', '😢', '😡', '🙏', '💊', '🏥', '👨‍⚕️', '📋', '✅'].map((emoji) => (
                  <Button
                    key={emoji}
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setMessage((prev) => prev + emoji)
                      setIsEmojiOpen(false)
                    }}
                    className='p-1 h-8 w-8'
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Text Input */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className='flex-1 min-h-[40px] max-h-32 resize-none border-2 border-blue-200 focus:border-blue-500'
            rows={1}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className='flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white'
          >
            <Send className='w-4 h-4' />
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept='image/*,.pdf,.doc,.docx'
          onChange={handleFileSelect}
          className='hidden'
        />
      </Card>

      {/* Quick Responses */}
      <Card className='p-4'>
        <div className='space-y-3'>
          <div className='text-sm text-gray-600 mb-2'>💬 PHẢN HỒI NHANH:</div>
          <div className='flex flex-wrap gap-2'>
            {quickResponses.map((response) => (
              <Button
                key={response.id}
                variant='outline'
                size='sm'
                onClick={() => handleQuickResponse(response)}
                disabled={disabled}
                className='text-xs border-gray-200 hover:bg-gray-50 text-left justify-start'
              >
                <span className='mr-1'>{getCategoryIcon(response.category)}</span>
                {response.text}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
