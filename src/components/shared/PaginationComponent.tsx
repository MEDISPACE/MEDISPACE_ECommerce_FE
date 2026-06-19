import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'

interface PaginationComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationComponentProps) {
  // Scroll to top when page changes
  const handlePageChange = (page: number) => {
    // Temporarily disable smooth scroll for instant navigation
    const htmlElement = document.documentElement
    const originalScrollBehavior = htmlElement.style.scrollBehavior

    // Force instant scroll
    htmlElement.style.scrollBehavior = 'auto'

    // Scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    // Fallback
    window.scrollTo(0, 0)

    // Call original onPageChange
    onPageChange(page)

    // Restore smooth scroll
    setTimeout(() => {
      htmlElement.style.scrollBehavior = originalScrollBehavior
    }, 50)
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Page info */}
      <div className='text-sm text-gray-600'>
        Trang {currentPage} trong {totalPages}
      </div>

      {/* Pagination controls */}
      <div className='flex items-center gap-1'>
        {/* Previous button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='!border-[#BFDBFE] hover:!border-[#BFDBFE] hover:!bg-[#F0F6FF]'
        >
          <ChevronLeft className='w-4 h-4 mr-1' />
          Trước
        </Button>

        {/* Page numbers */}
        <div className='flex items-center gap-1'>
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`dots-${index}`} className='px-2 py-1 text-gray-400'>
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                variant={isActive ? 'default' : 'outline'}
                size='sm'
                onClick={() => handlePageChange(pageNum)}
                className={
                  isActive
                    ? 'bg-[#0A2463] text-white hover:bg-[#071A49]'
                    : '!border-[#BFDBFE] hover:!border-[#BFDBFE] hover:!bg-[#F0F6FF] !text-[#1E40AF]'
                }
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='!border-[#BFDBFE] hover:!border-[#BFDBFE] hover:!bg-[#F0F6FF]'
        >
          Sau
          <ChevronRight className='w-4 h-4 ml-1' />
        </Button>
      </div>
    </div>
  )
}
