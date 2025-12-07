import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { mediaService } from '../../services/mediaService'

interface ImageUploadFieldProps {
    label: string
    value?: string
    onChange: (url: string) => void
    required?: boolean
    maxSizeMB?: number
    description?: string
}

export function ImageUploadField({
    label,
    value,
    onChange,
    required = false,
    maxSizeMB = 2,
    description,
}: ImageUploadFieldProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [preview, setPreview] = useState<string | null>(value || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate
        try {
            mediaService.validateImageFile(file, maxSizeMB)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'File không hợp lệ')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload
        setIsUploading(true)
        setUploadProgress(0)

        try {
            const url = await mediaService.uploadImageWithProgress(file, (progress) => {
                setUploadProgress(progress)
            })

            onChange(url)
            toast.success('Upload ảnh thành công!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Upload thất bại')
            setPreview(null)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className='space-y-2'>
            <Label>
                {label}
                {required && <span className='text-red-500 ml-1'>*</span>}
            </Label>

            {description && <p className='text-sm text-gray-500'>{description}</p>}

            <div className='space-y-3'>
                {/* Preview */}
                {preview && (
                    <div className='relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50'>
                        <img src={preview} alt='Preview' className='w-full h-full object-contain' />
                        {!isUploading && (
                            <button
                                type='button'
                                onClick={handleRemove}
                                className='absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        )}
                        {isUploading && (
                            <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                                <div className='text-center text-white'>
                                    <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2' />
                                    <p className='text-sm font-medium'>{uploadProgress}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Button */}
                {!preview && (
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors'>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleFileSelect}
                            className='hidden'
                            disabled={isUploading}
                        />
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
                                        <p className='text-sm text-gray-600'>Đang upload... {uploadProgress}%</p>
                                    </>
                                ) : (
                                    <>
                                        <div className='w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center'>
                                            <ImageIcon className='w-6 h-6 text-blue-500' />
                                        </div>
                                        <div>
                                            <p className='text-sm font-medium text-gray-700'>Click để chọn ảnh</p>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                Tối đa {maxSizeMB}MB • JPG, PNG, GIF
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                )}

                {/* Change Button (when has preview) */}
                {preview && !isUploading && (
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => fileInputRef.current?.click()}
                        className='w-full'
                    >
                        <Upload className='w-4 h-4 mr-2' />
                        Đổi ảnh
                    </Button>
                )}

                <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    className='hidden'
                    disabled={isUploading}
                />
            </div>
        </div>
    )
}
