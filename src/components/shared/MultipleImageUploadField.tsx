import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { mediaService } from '../../services/mediaService'

interface MultipleImageUploadFieldProps {
  label: string
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  maxSizeMB?: number
  description?: string
}

export function MultipleImageUploadField({
  label,
  value = [],
  onChange,
  maxFiles = 4,
  maxSizeMB = 2,
  description,
}: MultipleImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check max files
    if (value.length + files.length > maxFiles) {
      toast.error(`Chỉ được upload tối đa ${maxFiles} ảnh`)
      return
    }

    // Validate all files
    for (const file of files) {
      try {
        mediaService.validateImageFile(file, maxSizeMB)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'File không hợp lệ')
        return
      }
    }

    // Upload
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const urls = await mediaService.uploadImages(files)
      onChange([...value, ...urls])
      toast.success(`Upload ${files.length} ảnh thành công!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload thất bại')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  const canAddMore = value.length < maxFiles

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>

      {description && <p className='text-sm text-gray-500'>{description}</p>}

      <div className='space-y-3'>
        {/* Image Grid */}
        {value.length > 0 && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {value.map((url, index) => (
              <div
                key={index}
                className='relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50'
              >
                <img src={url} alt={`Image ${index + 1}`} className='w-full h-full object-cover' />
                <button
                  type='button'
                  onClick={() => handleRemove(index)}
                  className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                >
                  <X className='w-3 h-3' />
                </button>
              </div>
            ))}

            {/* Add More Button (in grid) */}
            {canAddMore && !isUploading && (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1E40AF] transition-colors flex items-center justify-center bg-gray-50'
              >
                <div className='text-center'>
                  <Plus className='w-8 h-8 text-gray-400 mx-auto mb-1' />
                  <p className='text-xs text-gray-500'>Thêm ảnh</p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Initial Upload Area */}
        {value.length === 0 && (
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1E40AF] transition-colors'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className='w-full'
            >
              <div className='flex flex-col items-center gap-2'>
                {isUploading ? (
                  <>
                    <Loader2 className='w-10 h-10 text-blue-500 animate-spin' />
                    <p className='text-sm text-gray-600'>Đang upload...</p>
                  </>
                ) : (
                  <>
                    <div className='w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center'>
                      <ImageIcon className='w-6 h-6 text-blue-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-700'>Click để chọn ảnh</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Tối đa {maxFiles} ảnh • {maxSizeMB}MB/ảnh • JPG, PNG, GIF
                      </p>
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Add More Button (below grid) */}
        {value.length > 0 && canAddMore && !isUploading && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => fileInputRef.current?.click()}
            className='w-full'
          >
            <Upload className='w-4 h-4 mr-2' />
            Thêm ảnh ({value.length}/{maxFiles})
          </Button>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span>Đang upload...</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
          onChange={handleFileSelect}
          className='hidden'
          disabled={isUploading}
        />
      </div>
    </div>
  )
}
