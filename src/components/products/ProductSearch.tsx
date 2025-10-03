import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Camera,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { toast } from 'sonner'
import '~/style/Products.css'

interface ProductSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  onPrescriptionUpload?: (file: File, extractedText?: string) => void
}

const popularSearches = [
  'Paracetamol',
  'Vitamin C',
  'Thuốc ho',
  'Aspirin',
  'Omega 3',
  'Thuốc đau bụng',
  'Vitamin D3',
  'Thuốc cảm',
  'Probiotics',
  'Thuốc dị ứng',
]

const recentSearches = ['Thuốc cảm cúm', 'Vitamin tổng hợp', 'Thuốc ho bổ phổi']

export default function ProductSearch({
  searchQuery,
  onSearchChange,
  placeholder = 'Tìm kiếm thuốc, thực phẩm chức năng...',
  onPrescriptionUpload,
}: ProductSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputFocus = () => {
    setIsFocused(true)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion)
    setShowSuggestions(false)
    setIsFocused(false)
  }

  const handleClearSearch = () => {
    onSearchChange('')
    inputRef.current?.focus()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG, PNG, WebP) hoặc PDF')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File không được vượt quá 10MB')
      return
    }

    setIsUploading(true)

    try {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock extracted text from prescription
      const mockExtractedText = 'Paracetamol 500mg, Vitamin C 1000mg, Aspirin 300mg'

      setUploadSuccess(true)
      toast.success('Upload thành công! Đã phân tích đơn thuốc', {
        description: 'Hệ thống đã nhận diện được các loại thuốc trong đơn',
      })

      // Call the upload handler if provided
      onPrescriptionUpload?.(file, mockExtractedText)

      // Auto search with extracted medications
      onSearchChange(mockExtractedText)

      // Reset upload state after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    } catch (error) {
      toast.error('Lỗi khi xử lý ảnh đơn thuốc', {
        description: 'Vui lòng thử lại hoặc tìm kiếm thủ công',
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const filteredPopularSearches = popularSearches.filter(
    (search) =>
      search.toLowerCase().includes(searchQuery.toLowerCase()) && search.toLowerCase() !== searchQuery.toLowerCase(),
  )

  return (
    <div ref={containerRef} className='relative w-full max-w-2xl mx-auto'>
      {/* Search Input */}
      <div className={`relative transition-all duration-500 ${isFocused ? 'scale-105' : ''}`}>
        <div className='absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none'>
          <Search
            className={`w-6 h-6 transition-colors duration-300 ${isFocused ? 'text-[#0066CC]' : 'text-gray-400'}`}
          />
        </div>

        <Input
          ref={inputRef}
          type='text'
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleInputFocus}
          className={`search-input-focus pl-16 pr-20 py-6 text-lg bg-white/95 backdrop-blur-md border-2 rounded-3xl shadow-xl transition-all duration-500 ${
            isFocused
              ? 'border-[#0066CC] shadow-2xl shadow-[#0066CC]/20 bg-white'
              : 'border-white/50 hover:border-white/70'
          }`}
        />

        {/* Right Side Icons */}
        <div className='absolute inset-y-0 right-0 pr-4 flex items-center gap-2'>
          {/* Upload Icon */}
          <button
            onClick={triggerFileUpload}
            disabled={isUploading}
            className={`p-2 rounded-full transition-all duration-200 ${
              isUploading
                ? 'text-[#0066CC] animate-pulse'
                : uploadSuccess
                  ? 'text-green-500 hover:bg-green-50'
                  : 'text-gray-400 hover:text-[#0066CC] hover:bg-blue-50'
            }`}
            title='Upload ảnh đơn thuốc'
          >
            {isUploading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : uploadSuccess ? (
              <CheckCircle className='w-5 h-5' />
            ) : (
              <Camera className='w-5 h-5' />
            )}
          </button>

          {/* Clear Search Icon */}
          {searchQuery && !isUploading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClearSearch}
              className='p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200'
            >
              <X className='w-5 h-5' />
            </motion.button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*,.pdf'
          onChange={handleFileUpload}
          className='hidden'
          multiple={false}
        />

        {/* Upload Status Toast */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='absolute top-full left-0 right-0 mt-2'
            >
              <div className='bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-3 shadow-lg'>
                <div className='flex items-center gap-3'>
                  <Loader2 className='w-4 h-4 animate-spin text-[#0066CC]' />
                  <span className='text-sm text-muted-foreground'>
                    \u0110ang ph\u00e2n t\u00edch \u0111\u01a1n thu\u1ed1c...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl shadow-[#0066CC]/5 z-50 overflow-hidden'
          >
            <div className='max-h-80 overflow-y-auto'>
              {/* Recent Searches */}
              {recentSearches.length > 0 && searchQuery === '' && (
                <div className='p-4 border-b border-gray-100'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Clock className='w-4 h-4 text-gray-400' />
                    <span className='text-sm font-medium text-gray-600'>Tìm kiếm gần đây</span>
                  </div>
                  <div className='space-y-1'>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(search)}
                        className='flex items-center w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group'
                      >
                        <Clock className='w-4 h-4 text-gray-400 mr-3 group-hover:text-[#0066CC]' />
                        <span className='text-gray-700 group-hover:text-[#0066CC]'>{search}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Upload Suggestion */}
                  <div className='mt-3 pt-3 border-t border-gray-100'>
                    <button
                      onClick={triggerFileUpload}
                      className='flex items-center w-full px-3 py-2 text-left hover:bg-gradient-to-r hover:from-[#0066CC]/5 hover:to-[#4A90E2]/5 rounded-lg transition-all duration-200 group'
                    >
                      <Camera className='w-4 h-4 text-[#0066CC] mr-3' />
                      <div className='text-left'>
                        <span className='text-[#0066CC] font-medium'>Upload ảnh đơn thuốc</span>
                        <p className='text-xs text-gray-500'>AI sẽ tự động nhận diện thuốc</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {(searchQuery === '' || filteredPopularSearches.length > 0) && (
                <div className='p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <TrendingUp className='w-4 h-4 text-gray-400' />
                    <span className='text-sm font-medium text-gray-600'>
                      {searchQuery === '' ? 'Tìm kiếm phổ biến' : 'Gợi ý tìm kiếm'}
                    </span>
                  </div>

                  {searchQuery === '' ? (
                    <div className='flex flex-wrap gap-2'>
                      {popularSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='cursor-pointer hover:bg-[#0066CC]/10 hover:text-[#0066CC] transition-colors duration-200'
                          onClick={() => handleSuggestionClick(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className='space-y-1'>
                      {filteredPopularSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className='flex items-center w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group'
                        >
                          <Search className='w-4 h-4 text-gray-400 mr-3 group-hover:text-[#0066CC]' />
                          <span className='text-muted-foreground group-hover:text-[#0066CC]'>{search}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {searchQuery !== '' && filteredPopularSearches.length === 0 && (
                <div className='p-4 text-center text-gray-500'>
                  <Search className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                  <p>Không tìm thấy gợi ý nào</p>
                  <p className='text-sm'>Hãy thử với từ khóa khác</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
