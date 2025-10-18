import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, Smartphone, X, RotateCw, Check, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'

interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
  quality: 'good' | 'fair' | 'poor'
}

interface ImageUploaderProps {
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  onImagesChange?: (images: UploadedImage[]) => void
  className?: string
}

export function ImageUploader({
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  onImagesChange,
  className = '',
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeImageQuality = useCallback((file: File): 'good' | 'fair' | 'poor' => {
    // Simple quality check
    return file.size > 1024 * 1024 ? 'good' : 'fair'
  }, [])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const newImages: UploadedImage[] = []

      Array.from(files)
        .slice(0, maxFiles - images.length)
        .forEach((file) => {
          if (file.size <= maxSize * 1024 * 1024 && acceptedTypes.includes(file.type)) {
            const url = URL.createObjectURL(file)
            const quality = analyzeImageQuality(file)

            newImages.push({
              id: Math.random().toString(36).substr(2, 9),
              file,
              url,
              name: file.name,
              quality,
            })
          }
        })

      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange?.(updatedImages)
    },
    [images, maxFiles, maxSize, acceptedTypes, analyzeImageQuality, onImagesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeImage = useCallback(
    (id: string) => {
      const updatedImages = images.filter((img) => img.id !== id)
      setImages(updatedImages)
      onImagesChange?.(updatedImages)
    },
    [images, onImagesChange],
  )

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'good':
        return <Check className='w-4 h-4 text-emerald-500' />
      case 'fair':
        return <AlertTriangle className='w-4 h-4 text-amber-500' />
      case 'poor':
        return <X className='w-4 h-4 text-red-500' />
      default:
        return null
    }
  }

  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'good':
        return 'Tốt'
      case 'fair':
        return 'Trung bình'
      case 'poor':
        return 'Mờ'
      default:
        return ''
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card className='border-2 border-dashed border-blue-200 bg-blue-50/50 hover:border-blue-300 transition-all duration-200'>
        <div
          className={`p-8 text-center ${isDragging ? 'bg-blue-100/50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
              <div className='flex space-x-2'>
                <Camera className='w-6 h-6 text-blue-600' />
                <Upload className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <h3 className='mb-2 text-blue-900'>Kéo thả ảnh vào đây hoặc click để chọn</h3>

          <p className='text-blue-700 mb-4'>
            Hỗ trợ: JPG, PNG, PDF
            <br />
            Kích thước tối đa: {maxSize}MB mỗi file
            <br />
            Tối đa {maxFiles} ảnh
          </p>

          <div className='flex justify-center space-x-4'>
            <Button
              variant='outline'
              className='border-blue-200 text-blue-700 hover:bg-blue-50'
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className='w-4 h-4 mr-2' />
              Chụp ảnh
            </Button>

            <Button
              variant='outline'
              className='border-blue-200 text-blue-700 hover:bg-blue-50'
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className='w-4 h-4 mr-2' />
              Chọn từ máy
            </Button>

            <Button variant='outline' className='border-blue-200 text-blue-700 hover:bg-blue-50'>
              <Smartphone className='w-4 h-4 mr-2' />
              Từ điện thoại
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className='hidden'
          />
        </div>
      </Card>

      {/* Guidelines */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>📋 HƯỚNG DẪN CHỤP ẢNH ĐƠN THUỐC TỐT</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center text-emerald-600'>
                <Check className='w-4 h-4 mr-2' />
                <span>Ảnh rõ nét, đủ sáng, không bị mờ</span>
              </div>
              <div className='flex items-center text-emerald-600'>
                <Check className='w-4 h-4 mr-2' />
                <span>Chụp toàn bộ đơn thuốc, không bị cắt</span>
              </div>
              <div className='flex items-center text-emerald-600'>
                <Check className='w-4 h-4 mr-2' />
                <span>Đặt đơn thuốc trên nền phẳng, tránh bóng</span>
              </div>
              <div className='flex items-center text-emerald-600'>
                <Check className='w-4 h-4 mr-2' />
                <span>Thông tin bác sĩ, bệnh viện phải rõ ràng</span>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center text-red-500'>
                <X className='w-4 h-4 mr-2' />
                <span>Không chụp nghiêng, không bị che khuất</span>
              </div>
              <div className='flex items-center text-red-500'>
                <X className='w-4 h-4 mr-2' />
                <span>Không chụp trong điều kiện thiếu sáng</span>
              </div>
              <div className='flex items-center text-red-500'>
                <X className='w-4 h-4 mr-2' />
                <span>Không để bị mờ hoặc rung tay</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Image Preview */}
      {images.length > 0 && (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <div className='p-6'>
            <h3 className='mb-4 text-blue-900 flex items-center'>🖼️ ẢNH ĐÃ TẢI LÊN</h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              {images.map((image) => (
                <div key={image.id} className='relative'>
                  <div className='aspect-square rounded-lg overflow-hidden bg-gray-100'>
                    <ImageWithFallback src={image.url} alt={image.name} className='w-full h-full object-cover' />
                  </div>

                  <div className='absolute top-2 right-2 flex space-x-1'>
                    <Badge
                      variant={
                        image.quality === 'good' ? 'default' : image.quality === 'fair' ? 'secondary' : 'destructive'
                      }
                      className='text-xs'
                    >
                      {getQualityIcon(image.quality)}
                      <span className='ml-1'>{getQualityText(image.quality)}</span>
                    </Badge>
                  </div>

                  <div className='mt-2'>
                    <p className='text-sm truncate mb-2'>{image.name}</p>
                    <div className='flex space-x-2'>
                      <Button size='sm' variant='outline' onClick={() => removeImage(image.id)}>
                        <X className='w-3 h-3 mr-1' />
                        Xóa
                      </Button>
                      <Button size='sm' variant='outline'>
                        <RotateCw className='w-3 h-3 mr-1' />
                        Xoay
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {images.length < maxFiles && (
              <Button
                variant='outline'
                className='border-blue-200 text-blue-700 hover:bg-blue-50'
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className='w-4 h-4 mr-2' />
                Thêm ảnh
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
