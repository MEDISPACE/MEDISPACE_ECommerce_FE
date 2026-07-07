import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, MoreHorizontal, Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

type PageToken = number | 'ellipsis-start' | 'ellipsis-end'

interface CommunityPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function clampPage(value: number, totalPages: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.trunc(value), 1), Math.max(totalPages, 1))
}

function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 4) return [1, 2, 3, 4, 'ellipsis-end', totalPages]
  if (currentPage >= totalPages - 3) return [1, 'ellipsis-start', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]

  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}

export function CommunityPagination({ currentPage, totalPages, onPageChange, className = '' }: CommunityPaginationProps) {
  const [openToken, setOpenToken] = useState<PageToken | null>(null)
  const [draftPage, setDraftPage] = useState(String(currentPage))

  const safeCurrentPage = clampPage(currentPage, totalPages)
  const pageTokens = useMemo(() => buildPageTokens(safeCurrentPage, totalPages), [safeCurrentPage, totalPages])

  useEffect(() => {
    if (!openToken) setDraftPage(String(safeCurrentPage))
  }, [openToken, safeCurrentPage])

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const nextPage = clampPage(page, totalPages)
    if (nextPage === safeCurrentPage) {
      setOpenToken(null)
      return
    }

    onPageChange(nextPage)
    setOpenToken(null)
  }

  const submitDraft = () => goToPage(Number(draftPage))

  const pageButtonClass =
    'h-10 min-w-10 rounded-md border border-[#DDE7F3] bg-white px-3 text-sm font-semibold text-[#0A2463] shadow-sm transition hover:border-[#5B8DEF] hover:bg-[#F0F6FF]'
  const activePageClass = 'border-[#0A2463] bg-[#0A2463] text-white hover:border-[#0A2463] hover:bg-[#071A49]'
  const disabledClass = 'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none'

  return (
    <nav className={`flex flex-wrap items-center justify-start gap-2 ${className}`} aria-label='Phân trang'>
      <button
        type='button'
        className={`${pageButtonClass} ${disabledClass} inline-flex items-center gap-1.5`}
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={safeCurrentPage <= 1}
      >
        <ChevronLeft className='h-4 w-4' />
        Trước
      </button>

      <div className='flex items-center gap-1.5'>
        {pageTokens.map((token, index) => {
          if (typeof token === 'number') {
            const active = token === safeCurrentPage
            return (
              <button
                key={token}
                type='button'
                className={`${pageButtonClass} ${active ? activePageClass : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => goToPage(token)}
              >
                {token}
              </button>
            )
          }

          return (
            <Popover key={`${token}-${index}`} open={openToken === token} onOpenChange={(open) => setOpenToken(open ? token : null)}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className={`${pageButtonClass} inline-flex items-center justify-center px-3`}
                  aria-label='Nhập số trang muốn đến'
                  onClick={() => setDraftPage(String(safeCurrentPage))}
                >
                  <MoreHorizontal className='h-5 w-5 text-[#0A2463]' />
                </button>
              </PopoverTrigger>
              <PopoverContent align='center' sideOffset={10} className='w-[320px] overflow-visible rounded-lg border-[#BFDBFE] bg-white p-0 shadow-xl'>
                <div className='relative'>
                  <div className='absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-[#BFDBFE] bg-white' />
                  <div className='border-b border-[#E8EDF5] px-5 py-4'>
                    <p className='text-lg font-semibold text-[#0A2463]'>Đi đến trang</p>
                  </div>
                  <div className='grid grid-cols-[1fr_52px_52px_70px] gap-0 p-5'>
                    <input
                      value={draftPage}
                      onChange={(event) => setDraftPage(event.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') submitDraft()
                      }}
                      className='h-11 min-w-0 rounded-l-md border border-[#93B8F8] bg-[#F8FBFF] px-3 text-center text-lg font-semibold text-[#0A2463] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/15'
                      inputMode='numeric'
                      aria-label='Số trang'
                    />
                    <button
                      type='button'
                      className='flex h-11 items-center justify-center border-y border-r border-[#93B8F8] bg-[#F8FBFF] text-[#1E40AF] hover:bg-[#E8F1FF]'
                      onClick={() => setDraftPage(String(clampPage(Number(draftPage || safeCurrentPage) + 1, totalPages)))}
                      aria-label='Tăng số trang'
                    >
                      <Plus className='h-5 w-5' />
                    </button>
                    <button
                      type='button'
                      className='flex h-11 items-center justify-center border-y border-r border-[#93B8F8] bg-[#F8FBFF] text-[#1E40AF] hover:bg-[#E8F1FF]'
                      onClick={() => setDraftPage(String(clampPage(Number(draftPage || safeCurrentPage) - 1, totalPages)))}
                      aria-label='Giảm số trang'
                    >
                      <Minus className='h-5 w-5' />
                    </button>
                    <Button type='button' className='h-11 rounded-l-none rounded-r-md bg-[#0A2463] px-4 text-white hover:bg-[#071A49]' onClick={submitDraft}>
                      Đi
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      <button
        type='button'
        className={`${pageButtonClass} ${disabledClass} inline-flex items-center gap-1.5`}
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= totalPages}
      >
        Sau
        <ChevronRight className='h-4 w-4' />
      </button>
    </nav>
  )
}
