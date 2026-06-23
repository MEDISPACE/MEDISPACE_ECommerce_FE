import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, Smartphone, X, RotateCw, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { uploadService } from '../../services/uploadService'
import { toast } from 'sonner'

interface UploadedImage {
  id: string
  file: File
  url: string // S3 URL after upload, or local blob URL before upload
  name: string
  quality: 'good' | 'fair' | 'poor'
  isUploading?: boolean
  isUploaded?: boolean
  uploadError?: string
}

interface ImageUploaderProps {
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  onImagesChange?: (images: UploadedImage[]) => void
  uploadToServer?: boolean // If true, upload to S3 immediately
  className?: string
}

export function ImageUploader({
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  onImagesChange,
  uploadToServer = true, // Default to true for prescription upload
  className = '',
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeImageQuality = useCallback((file: File): 'good' | 'fair' | 'poor' => {
    // Simple quality check based on file size
    if (file.size > 1024 * 1024) return 'good' // > 1MB
    if (file.size > 500 * 1024) return 'fair' // > 500KB
    return 'poor'
  }, [])

  // Upload single image to S3
  const uploadImageToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await uploadService.uploadImage(formData)

      if (response.data?.result && response.data.result.length > 0) {
        return response.data.result[0].url
      }
      return null
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return

      const newImages: UploadedImage[] = []
      const validFiles: File[] = []

      // First, validate and create local previews
      Array.from(files)
        .slice(0, maxFiles - images.length)
        .forEach((file) => {
          if (file.size <= maxSize * 1024 * 1024 && acceptedTypes.includes(file.type)) {
            validFiles.push(file)
            const localUrl = URL.createObjectURL(file)
            const quality = analyzeImageQuality(file)

            newImages.push({
              id: Math.random().toString(36).substr(2, 9),
              file,
              url: localUrl, // Temporary local URL
              name: file.name,
              quality,
              isUploading: uploadToServer,
              isUploaded: false,
            })
          } else {
            const message = `File "${file.name}" không hợp lệ (quá lớn hoặc sai định dạng)`
            setFormError(message)
            toast.error(message)
          }
        })

      if (newImages.length === 0) return
      setFormError('')

      // Update state with local previews immediately
      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)

      // If uploadToServer is enabled, upload each image to S3
      if (uploadToServer) {
        setIsUploading(true)

        const uploadPromises = newImages.map(async (img, index) => {
          const s3Url = await uploadImageToServer(img.file)

          if (s3Url) {
            // Update the image with S3 URL
            newImages[index] = {
              ...newImages[index],
              url: s3Url,
              isUploading: false,
              isUploaded: true,
            }
          } else {
            // Mark upload error
            newImages[index] = {
              ...newImages[index],
              isUploading: false,
              isUploaded: false,
              uploadError: 'Upload thất bại',
            }
          }
        })

        await Promise.all(uploadPromises)
        setIsUploading(false)

        // Update state with S3 URLs
        const finalImages = [...images, ...newImages]
        setImages(finalImages)
        onImagesChange?.(finalImages)

        // Show toast for results
        const successCount = newImages.filter((img) => img.isUploaded).length
        const failCount = newImages.filter((img) => img.uploadError).length

        if (successCount > 0) {
          toast.success(`Đã tải lên ${successCount} ảnh thành công`)
        }
        if (failCount > 0) {
          toast.error(`${failCount} ảnh tải lên thất bại`)
        }
      } else {
        onImagesChange?.(updatedImages)
      }
    },
    [images, maxFiles, maxSize, acceptedTypes, analyzeImageQuality, onImagesChange, uploadToServer],
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

  // Retry failed upload
  const retryUpload = useCallback(
    async (imageId: string) => {
      const imageIndex = images.findIndex((img) => img.id === imageId)
      if (imageIndex === -1) return

      const image = images[imageIndex]

      // Update state to show uploading
      const updatingImages = [...images]
      updatingImages[imageIndex] = {
        ...image,
        isUploading: true,
        uploadError: undefined,
      }
      setImages(updatingImages)

      // Try upload again
      const s3Url = await uploadImageToServer(image.file)

      const finalImages = [...images]
      if (s3Url) {
        finalImages[imageIndex] = {
          ...image,
          url: s3Url,
          isUploading: false,
          isUploaded: true,
          uploadError: undefined,
        }
        toast.success('Tải lên thành công')
      } else {
        finalImages[imageIndex] = {
          ...image,
          isUploading: false,
          uploadError: 'Upload thất bại',
        }
        toast.error('Tải lên thất bại')
      }

      setImages(finalImages)
      onImagesChange?.(finalImages)
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

  // Get only successfully uploaded images (for form submission)
  const getUploadedImages = useCallback(() => {
    return images.filter((img) => img.isUploaded).map((img) => img.url)
  }, [images])

  // Expose getUploadedImages through a ref or callback
  // Parent component can access via onImagesChange

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      {images.length === 0 && (
        <Card className='border-2 border-dashed border-[#BFDBFE] bg-white hover:border-[#BFDBFE] transition-all duration-200'>
        <div
          className={`p-8 text-center ${isDragging ? 'bg-[#E8EDF5]/50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-[#E8EDF5] rounded-full flex items-center justify-center'>
              {isUploading ? (
                <Loader2 className='w-8 h-8 text-[#1E40AF] animate-spin' />
              ) : (
                <div className='flex space-x-2'>
                  <Camera className='w-6 h-6 text-[#1E40AF]' />
                  <Upload className='w-6 h-6 text-[#1E40AF]' />
                </div>
              )}
            </div>
          </div>

          <h3 className='mb-2 text-blue-900'>
            {isUploading ? 'Đang tải lên...' : 'Kéo thả ảnh vào đây hoặc click để chọn'}
          </h3>

          <p className='text-[#0A2463] mb-4'>
            Hỗ trợ: JPG, PNG, PDF
            <br />
            Kích thước tối đa: {maxSize}MB mỗi file
            <br />
            Tối đa {maxFiles} ảnh
          </p>

          <div className='flex justify-center space-x-4'>
            <Button
              variant='outline'
              className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || images.length >= maxFiles}
            >
              <Camera className='w-4 h-4 mr-2' />
              Chụp ảnh
            </Button>

            <Button
              variant='outline'
              className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || images.length >= maxFiles}
            >
              <Upload className='w-4 h-4 mr-2' />
              Chọn từ máy
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Hidden file input - Needs to remain mounted always */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className='hidden'
        data-testid='prescription-file-input'
      />

      {formError && (
        <p className='text-sm text-red-600' data-testid='form-error'>
          {formError}
        </p>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]' data-testid='prescription-preview'>
          <div className='p-6'>
            <h3 className='mb-4 text-blue-900 flex items-center'>
              🖼️ ẢNH ĐÃ TẢI LÊN ({images.filter((img) => img.isUploaded).length}/{images.length})
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              {images.map((image) => (
                <div key={image.id} className='relative'>
                  <div
                    className={`aspect-square rounded-lg overflow-hidden bg-gray-100 ${image.isUploading ? 'opacity-50' : ''}`}
                  >
                    <ImageWithFallback src={image.url} alt={image.name} className='w-full h-full object-cover' />

                    {/* Upload overlay */}
                    {image.isUploading && (
                      <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                        <Loader2 className='w-8 h-8 text-white animate-spin' />
                      </div>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className='absolute top-2 right-2 flex flex-col gap-1'>
                    {image.isUploaded && (
                      <Badge className='bg-emerald-500 text-white text-xs'>
                        <Check className='w-3 h-3 mr-1' />
                        Đã tải lên
                      </Badge>
                    )}
                    {image.uploadError && (
                      <Badge className='bg-red-500 text-white text-xs'>
                        <AlertTriangle className='w-3 h-3 mr-1' />
                        Lỗi
                      </Badge>
                    )}
                    {!image.isUploading && !image.isUploaded && !image.uploadError && (
                      <Badge
                        variant={
                          image.quality === 'good' ? 'default' : image.quality === 'fair' ? 'secondary' : 'destructive'
                        }
                        className='text-xs'
                      >
                        {getQualityIcon(image.quality)}
                        <span className='ml-1'>{getQualityText(image.quality)}</span>
                      </Badge>
                    )}
                  </div>

                  <div className='mt-2'>
                    <p className='text-sm truncate mb-2'>{image.name}</p>
                    <div className='flex space-x-2'>
                      <Button size='sm' variant='outline' onClick={() => removeImage(image.id)}>
                        <X className='w-3 h-3 mr-1' />
                        Xóa
                      </Button>
                      {image.uploadError && (
                        <Button size='sm' variant='outline' onClick={() => retryUpload(image.id)}>
                          <RotateCw className='w-3 h-3 mr-1' />
                          Thử lại
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more button as a grid item with drag & drop */}
              {images.length < maxFiles && (
                <div
                  className='relative aspect-square rounded-lg border-2 border-dashed border-[#BFDBFE] bg-[#F0F6FF]/30 flex justify-center items-center cursor-pointer hover:bg-[#F0F6FF] transition-colors'
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className='text-center pointer-events-none'>
                    <Upload className='w-6 h-6 text-blue-500 mb-2 mx-auto' />
                    <span className='block text-sm text-[#0A2463] font-medium'>Thêm ảnh</span>
                    <span className='block text-xs text-blue-500'>
                      ({images.length}/{maxFiles})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Export types for parent components
export type { UploadedImage }
