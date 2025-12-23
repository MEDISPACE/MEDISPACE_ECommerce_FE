import { useState } from 'react'
import { Download, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent } from '../ui/dialog'

interface PrescriptionImageViewerProps {
    images: string[]
    title?: string
}

export function PrescriptionImageViewer({ images, title = 'Ảnh đơn thuốc' }: PrescriptionImageViewerProps) {
    const [isZoomOpen, setIsZoomOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [zoomLevel, setZoomLevel] = useState(1)

    const handleOpenZoom = (index: number) => {
        setCurrentIndex(index)
        setZoomLevel(1)
        setIsZoomOpen(true)
    }

    const handleDownload = (imageUrl: string, index: number) => {
        // Create an image element to load the image
        const img = new Image()
        img.crossOrigin = 'anonymous' // Try to load with CORS

        img.onload = () => {
            // Create canvas and draw image
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')

            if (ctx) {
                ctx.drawImage(img, 0, 0)

                // Convert to blob and download
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = window.URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `don-thuoc-${index + 1}.jpg`
                        link.style.display = 'none'
                        document.body.appendChild(link)
                        link.click()

                        setTimeout(() => {
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                        }, 100)
                    }
                }, 'image/jpeg', 0.95)
            }
        }

        img.onerror = () => {
            // If CORS fails, try direct fetch
            fetch(imageUrl)
                .then(res => res.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `don-thuoc-${index + 1}.jpg`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                })
                .catch(() => {
                    // Last resort: prompt user to right-click and save
                    alert('Vui lòng click chuột phải vào ảnh và chọn "Lưu ảnh" để tải về')
                    window.open(imageUrl, '_blank')
                })
        }

        img.src = imageUrl
    }

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.5, 3))
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.5, 0.5))
    }

    const handlePrev = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
        setZoomLevel(1)
    }

    const handleNext = () => {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
        setZoomLevel(1)
    }

    if (!images || images.length === 0) {
        return (
            <div className='p-4 bg-gray-50 rounded-lg text-center text-gray-500'>
                Không có ảnh đơn thuốc
            </div>
        )
    }

    return (
        <div>
            <h4 className='font-medium mb-3'>{title} ({images.length})</h4>
            <div className='grid grid-cols-2 gap-4'>
                {images.map((image, index) => (
                    <div key={index} className='relative group'>
                        <img
                            src={image}
                            alt={`Đơn thuốc ${index + 1}`}
                            className='w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors'
                            onClick={() => handleOpenZoom(index)}
                        />
                        <Badge className='absolute top-2 left-2 bg-white/90 text-gray-800'>
                            Ảnh {index + 1}
                        </Badge>
                        {/* Action buttons on hover */}
                        <div className='absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <Button
                                size='sm'
                                variant='secondary'
                                className='h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenZoom(index)
                                }}
                                title='Phóng to'
                            >
                                <ZoomIn className='w-4 h-4 text-gray-700' />
                            </Button>
                            <Button
                                size='sm'
                                variant='secondary'
                                className='h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(image, index)
                                }}
                                title='Tải về'
                            >
                                <Download className='w-4 h-4 text-gray-700' />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Zoom Dialog */}
            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                <DialogContent className='max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none'>
                    {/* Header */}
                    <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent'>
                        <div className='flex items-center gap-2'>
                            <Badge className='bg-white/20 text-white border-none'>
                                Ảnh {currentIndex + 1} / {images.length}
                            </Badge>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                variant='ghost'
                                className='text-white hover:bg-white/20'
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 0.5}
                            >
                                <ZoomOut className='w-5 h-5' />
                            </Button>
                            <span className='text-white text-sm min-w-[60px] text-center'>
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <Button
                                size='sm'
                                variant='ghost'
                                className='text-white hover:bg-white/20'
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 3}
                            >
                                <ZoomIn className='w-5 h-5' />
                            </Button>
                            <Button
                                size='sm'
                                variant='ghost'
                                className='text-white hover:bg-white/20'
                                onClick={() => handleDownload(images[currentIndex], currentIndex)}
                            >
                                <Download className='w-5 h-5' />
                            </Button>
                            <Button
                                size='sm'
                                variant='ghost'
                                className='text-white hover:bg-white/20'
                                onClick={() => setIsZoomOpen(false)}
                            >
                                <X className='w-5 h-5' />
                            </Button>
                        </div>
                    </div>

                    {/* Image */}
                    <div className='flex items-center justify-center h-full overflow-auto p-16'>
                        <img
                            src={images[currentIndex]}
                            alt={`Đơn thuốc ${currentIndex + 1}`}
                            className='max-w-none transition-transform duration-200'
                            style={{ transform: `scale(${zoomLevel})` }}
                        />
                    </div>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <Button
                                size='lg'
                                variant='ghost'
                                className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full'
                                onClick={handlePrev}
                            >
                                <ChevronLeft className='w-8 h-8' />
                            </Button>
                            <Button
                                size='lg'
                                variant='ghost'
                                className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full'
                                onClick={handleNext}
                            >
                                <ChevronRight className='w-8 h-8' />
                            </Button>
                        </>
                    )}

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className='absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent'>
                            <div className='flex justify-center gap-2'>
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${index === currentIndex
                                            ? 'border-white scale-110'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        onClick={() => {
                                            setCurrentIndex(index)
                                            setZoomLevel(1)
                                        }}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className='w-full h-full object-cover'
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
