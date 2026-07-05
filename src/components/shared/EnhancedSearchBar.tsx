import { useState, useRef, useEffect } from 'react'
import { Search, X, History, TrendingUp, Loader2, Camera, Tag, FolderOpen, Newspaper } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useNavigate } from 'react-router'
import { useSearchHistory } from '../../utils/useSearchHistory'
import { useSearchSuggestions, type SearchSuggestion } from '../../hooks/useSearchSuggestions'

interface EnhancedSearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export function EnhancedSearchBar({
  placeholder = 'Tìm thuốc, thực phẩm chức năng, dược mỹ phẩm...',
  className = '',
  onSearch,
}: EnhancedSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = useNavigate()
  const { recentSearches, addToHistory, removeFromHistory } = useSearchHistory()

  // Use multi-collection search hook
  const {
    products,
    brands,
    categories,
    articles,
    querySuggestions,
    all: suggestions,
    isLoading,
    isSettled,
  } = useSearchSuggestions(searchQuery)

  // Trending searches
  const trendingSearches = ['Paracetamol', 'Vitamin D3', 'Kem dưỡng da', 'Thuốc ho', 'Canxi']

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return

    // Add to search history
    addToHistory(query.trim())

    setIsOpen(false)
    setSelectedIndex(-1)
    onSearch?.(query)
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product' && suggestion.slug) {
      navigate(`/products/${suggestion.slug}`)
    } else if (suggestion.type === 'category' && suggestion.slug) {
      navigate(`/categories/${suggestion.slug}`)
    } else if (suggestion.type === 'brand' && suggestion.slug) {
      navigate(`/search?brandSlug=${suggestion.slug}`)
    } else if (suggestion.type === 'article' && suggestion.slug) {
      navigate(`/health/article/${suggestion.slug}`)
    } else {
      handleSearch(suggestion.text)
    }
    setSearchQuery(suggestion.text)
    setIsOpen(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handlePrescriptionUpload = () => {
    // Navigate directly to prescription upload page
    navigate('/upload-prescription')
    setIsOpen(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const allItems = [
      ...(searchQuery ? suggestions : []),
      ...recentSearches.map((r) => ({ text: r, type: 'recent' as const })),
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          if (searchQuery && selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex])
          } else {
            const item = allItems[selectedIndex]
            handleSearch(item.text)
          }
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={searchRef} className={`relative flex-1 max-w-2xl mx-2 md:mx-6 ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        className='relative'
      >
        <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />

        <Input
          ref={inputRef}
          type='text'
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label='Tìm kiếm thuốc và sản phẩm'
          className='h-12 rounded-lg border-2 border-[#BFDBFE] bg-white pl-12 pr-14 text-[#1C2B4A] transition-all placeholder:text-[#8094AE] focus:border-[#0A2463] focus:bg-white'
          autoComplete='off'
        />

        <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
          {searchQuery && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={clearSearch}
              className='w-7 h-7 p-0 text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500'
              title='Xóa (Esc)'
              aria-label='Xóa nội dung tìm kiếm'
            >
              <X className='w-4 h-4' />
            </Button>
          )}

          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={handlePrescriptionUpload}
            className='w-7 h-7 p-0 text-gray-400 hover:text-medical-consultation transition-colors focus-visible:ring-2 focus-visible:ring-blue-500'
            title='Upload đơn thuốc'
            aria-label='Upload đơn thuốc'
          >
            <Camera className='w-4 h-4' />
          </Button>
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className='absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-lg shadow-2xl border border-[#E8EDF5] rounded-2xl overflow-hidden'>
          <CardContent className='p-0 max-h-96 overflow-y-auto'>
            {searchQuery ? (
              // Search suggestions — grouped by type
              isLoading ? (
                <div className='p-6 text-center'>
                  <Loader2 className='w-6 h-6 mx-auto animate-spin text-gray-400 mb-2' />
                  <div className='text-sm text-gray-500'>Đang tìm kiếm...</div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className='p-3'>
                  {/* ── GỢI Ý TÌM KIẾM (query completion) ── */}
                  {querySuggestions.length > 0 && (
                    <div className='mb-3'>
                      <div className='flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1.5'>
                        <Search className='w-3 h-3' />
                        Gợi ý tìm kiếm
                      </div>
                      <div className='flex flex-wrap gap-1.5 px-1'>
                        {querySuggestions.map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              setSearchQuery(q)
                              handleSearch(q)
                            }}
                            className='inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-gray-50 hover:bg-[#F0F6FF] hover:text-[#1E40AF] border border-gray-200 hover:border-[#BFDBFE] transition-all duration-150 text-gray-700'
                          >
                            <Search className='w-3 h-3 opacity-50' />
                            {q}
                          </button>
                        ))}
                      </div>
                      {(brands.length > 0 || categories.length > 0 || products.length > 0) && <Separator className='mt-3' />}
                    </div>
                  )}

                  {/* ── THƯƠNG HIỆU ── */}
                  {brands.length > 0 && (
                    <div className='mb-2'>
                      <div className='flex items-center gap-1.5 text-xs font-semibold text-[#1E40AF] uppercase tracking-wider px-2 py-1.5'>
                        <Tag className='w-3 h-3' />
                        Thương hiệu
                      </div>
                      {brands.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            selectedIndex === index ? 'bg-[#F0F6FF] border border-[#BFDBFE]' : 'hover:bg-gray-50'
                          }`}
                        >
                          {suggestion.image ? (
                            <img src={suggestion.image} alt={suggestion.text} className='w-8 h-8 object-contain rounded border border-gray-100' />
                          ) : (
                            <div className='w-8 h-8 bg-[#E8EDF5] rounded flex items-center justify-center'>
                              <Tag className='w-4 h-4 text-blue-500' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm truncate'>{suggestion.text}</div>
                            {suggestion.productCount !== undefined && (
                              <div className='text-xs text-gray-400'>{suggestion.productCount} sản phẩm</div>
                            )}
                          </div>
                          <Badge variant='secondary' className='text-xs bg-[#F0F6FF] text-[#1E40AF] shrink-0'>TH</Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── DANH MỤC ── */}
                  {categories.length > 0 && (
                    <div className='mb-2'>
                      {brands.length > 0 && <Separator className='mb-2' />}
                      <div className='flex items-center gap-1.5 text-xs font-semibold text-green-600 uppercase tracking-wider px-2 py-1.5'>
                        <FolderOpen className='w-3 h-3' />
                        Danh mục
                      </div>
                      {categories.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            selectedIndex === brands.length + index ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className='w-8 h-8 bg-green-50 rounded flex items-center justify-center text-base'>
                            {suggestion.icon || '📁'}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm truncate'>{suggestion.text}</div>
                            {suggestion.productCount !== undefined && (
                              <div className='text-xs text-gray-400'>{suggestion.productCount} sản phẩm</div>
                            )}
                          </div>
                          <Badge variant='secondary' className='text-xs bg-green-50 text-green-600 shrink-0'>DM</Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── BÀI VIẾT SỨC KHỎE ── */}
                  {articles.length > 0 && (
                    <div className='mb-2'>
                      {(brands.length > 0 || categories.length > 0) && <Separator className='mb-2' />}
                      <div className='flex items-center gap-1.5 text-xs font-semibold text-[#1E40AF] uppercase tracking-wider px-2 py-1.5'>
                        <Newspaper className='w-3 h-3' />
                        Bài viết sức khỏe
                      </div>
                      {articles.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            selectedIndex === brands.length + categories.length + index
                              ? 'bg-[#F0F6FF] border border-[#BFDBFE]'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {suggestion.image ? (
                            <img
                              src={suggestion.image}
                              alt={suggestion.text}
                              className='w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0'
                            />
                          ) : (
                            <div className='w-10 h-10 bg-[#F0F6FF] rounded-lg flex items-center justify-center shrink-0'>
                              <Newspaper className='w-4 h-4 text-[#1E40AF]' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm truncate'>{suggestion.text}</div>
                            {suggestion.excerpt && (
                              <div className='text-xs text-gray-400 truncate'>{suggestion.excerpt}</div>
                            )}
                          </div>
                          <Badge variant='secondary' className='text-xs bg-[#F0F6FF] text-[#1E40AF] shrink-0'>
                            Blog
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── SẢN PHẨM ── */}
                  {products.length > 0 && (
                    <div>
                      {(brands.length > 0 || categories.length > 0 || articles.length > 0) && <Separator className='mb-2' />}
                      <div className='flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1.5'>
                        <Search className='w-3 h-3' />
                        Sản phẩm
                      </div>
                      {products.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            selectedIndex === brands.length + categories.length + articles.length + index
                              ? 'bg-[#F0F6FF] border border-[#BFDBFE]'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {suggestion.image ? (
                            <img
                              src={suggestion.image}
                              alt={suggestion.text}
                              className='w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0'
                            />
                          ) : (
                            <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0'>
                              <Search className='w-4 h-4 text-gray-400' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm truncate'>{suggestion.text}</div>
                            {suggestion.brandName && (
                              <div className='text-xs text-gray-400 truncate'>{suggestion.brandName}</div>
                            )}
                          </div>
                          <Badge
                            variant='secondary'
                            className={`text-xs shrink-0 ${suggestion.requiresPrescription ? 'bg-orange-50 text-orange-500 border border-orange-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                          >
                            {suggestion.requiresPrescription ? 'Kê đơn' : 'OTC'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : isSettled ? (
                <div className='p-6 text-center text-gray-500'>
                  <Search className='w-8 h-8 mx-auto mb-2 text-gray-300' />
                  <div className='text-sm'>Không tìm thấy kết quả phù hợp</div>
                </div>
              ) : (
                <div className='p-6 text-center'>
                  <Loader2 className='w-6 h-6 mx-auto animate-spin text-gray-400 mb-2' />
                  <div className='text-sm text-gray-500'>Đang tìm kiếm...</div>
                </div>
              )
            ) : (
              // Default suggestions
              <div className='p-4 space-y-4'>
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className='flex items-center gap-2 text-sm text-gray-500 mb-3'>
                      <History className='w-4 h-4' />
                      Tìm kiếm gần đây
                    </div>
                    <div className='space-y-1'>
                      {recentSearches.map((recent, index) => {
                        const recentIndex = searchQuery ? suggestions.length + index : index
                        return (
                          <div key={recent} className='flex items-center gap-1'>
                            <button
                              onClick={() => handleSearch(recent)}
                              className={`flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors text-left text-sm ${
                                selectedIndex === recentIndex
                                  ? 'bg-[#E8EDF5] border border-[#BFDBFE]'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <History className='w-4 h-4 text-gray-400' />
                              {recent}
                            </button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => removeFromHistory(recent)}
                              className='p-1 h-6 w-6 text-gray-400 hover:text-red-500'
                            >
                              <X className='w-3 h-3' />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Trending searches */}
                <div>
                  <div className='flex items-center gap-2 text-sm text-gray-500 mb-3'>
                    <TrendingUp className='w-4 h-4' />
                    Tìm kiếm phổ biến
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {trendingSearches.map((trending) => (
                      <Badge
                        key={trending}
                        variant='secondary'
                        className='cursor-pointer hover:bg-[#E8EDF5] hover:text-[#0A2463] transition-colors'
                        onClick={() => handleSearch(trending)}
                      >
                        {trending}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
