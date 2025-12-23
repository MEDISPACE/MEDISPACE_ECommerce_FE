import { useState, useRef, useEffect } from 'react'
import { Search, X, Mic, History, TrendingUp, Loader2, Camera } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useNavigate } from 'react-router'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { useSearchHistory } from '../../utils/useSearchHistory'
import type { Product, Category } from '../../types/product'

interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'brand' | 'recent' | 'trending'
  icon?: string
  image?: string
  slug?: string
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = useNavigate()
  const { recentSearches, addToHistory, removeFromHistory } = useSearchHistory()

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productService.getProducts(), // Get products for search
          categoryService.getCategories(),
        ])
        setProducts(productsData)
        setCategories(categoriesData)
      } catch {
        // Error loading search data
      }
    }
    loadData()
  }, [])

  // Trending searches
  const trendingSearches = ['Paracetamol', 'Vitamin D3', 'Kem dưỡng da', 'Thuốc ho', 'Canxi']

  // Generate suggestions based on search query with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Debounced search with 300ms delay
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim()

      // Product suggestions
      const productMatches = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            product.brand?.name?.toLowerCase().includes(query) ||
            product.category?.name?.toLowerCase().includes(query),
        )
        .slice(0, 4)
        .map((product) => ({
          id: `product-${product._id}`,
          text: product.name,
          type: 'product' as const,
          slug: product.slug,
          image: product.featuredImage || product.images?.[0] || '',
        }))

      // Category suggestions
      const categoryMatches = categories
        .filter(
          (category) =>
            category.name.toLowerCase().includes(query) ||
            category.subcategories?.some((sub) => sub.name.toLowerCase().includes(query)),
        )
        .slice(0, 3)
        .map((category) => ({
          id: `category-${category._id}`,
          text: category.name,
          type: 'category' as const,
          slug: category.slug,
          icon: '📁',
        }))

      // Brand suggestions
      const brands = Array.from(new Set(products.map((p) => p.brand?.name).filter(Boolean) as string[]))
        .filter((brand) => brand.toLowerCase().includes(query))
        .slice(0, 3)
        .map((brand) => ({
          id: `brand-${brand}`,
          text: brand,
          type: 'brand' as const,
          icon: '🏢',
        }))

      // Prioritize exact matches and sort by relevance
      const sortedSuggestions = [
        ...productMatches.sort((a, b) => {
          const aExact = a.text.toLowerCase().startsWith(query) ? 1 : 0
          const bExact = b.text.toLowerCase().startsWith(query) ? 1 : 0
          return bExact - aExact
        }),
        ...categoryMatches,
        ...brands,
      ]

      setSuggestions(sortedSuggestions)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, products, categories])

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
    } else {
      handleSearch(suggestion.text)
    }
    setSearchQuery(suggestion.text)
    setIsOpen(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleVoiceSearch = () => {
    // Voice search implementation would go here
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Implement speech recognition here
    }
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
    <div ref={searchRef} className={`relative flex-1 max-w-2xl mx-8 ${className}`}>
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
          className='pl-12 pr-20 py-3 w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-gray-50 focus:bg-white transition-all'
          autoComplete='off'
        />

        <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
          {searchQuery && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={clearSearch}
              className='w-6 h-6 p-0 text-gray-400 hover:text-gray-600'
              title='Xóa (Esc)'
            >
              <X className='w-4 h-4' />
            </Button>
          )}

          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={handleVoiceSearch}
            className='w-6 h-6 p-0 text-gray-400 hover:text-blue-600'
            title='Tìm kiếm bằng giọng nói'
          >
            <Mic className='w-4 h-4' />
          </Button>

          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={handlePrescriptionUpload}
            className='w-6 h-6 p-0 text-gray-400 hover:text-medical-consultation transition-colors'
            title='Upload đơn thuốc'
          >
            <Camera className='w-4 h-4' />
          </Button>
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className='absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-lg shadow-2xl border border-blue-100 rounded-2xl overflow-hidden'>
          <CardContent className='p-0 max-h-96 overflow-y-auto'>
            {searchQuery ? (
              // Search suggestions
              isLoading ? (
                <div className='p-6 text-center'>
                  <Loader2 className='w-6 h-6 mx-auto animate-spin text-gray-400 mb-2' />
                  <div className='text-sm text-gray-500'>Đang tìm kiếm...</div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className='p-4 space-y-2'>
                  <div className='text-sm text-gray-500 mb-3'>Gợi ý tìm kiếm</div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedIndex === index ? 'bg-blue-100 border border-blue-300' : 'hover:bg-blue-50'
                      }`}
                    >
                      {suggestion.type === 'product' && suggestion.image ? (
                        <img
                          src={suggestion.image}
                          alt={suggestion.text}
                          className='w-12 h-12 object-cover rounded-lg border border-gray-200'
                        />
                      ) : (
                        <span className='text-lg'>{suggestion.icon}</span>
                      )}
                      <div className='flex-1'>
                        <div className='font-medium'>{suggestion.text}</div>
                        <div className='text-xs text-gray-500 capitalize'>
                          {suggestion.type === 'product'
                            ? 'Sản phẩm'
                            : suggestion.type === 'category'
                              ? 'Danh mục'
                              : 'Thương hiệu'}
                        </div>
                      </div>
                      <Badge variant='secondary' className='text-xs'>
                        {suggestion.type === 'product' ? 'SP' : suggestion.type === 'category' ? 'DM' : 'TH'}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='p-6 text-center text-gray-500'>
                  <Search className='w-8 h-8 mx-auto mb-2 text-gray-300' />
                  <div className='text-sm'>Không tìm thấy kết quả phù hợp</div>
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
                                  ? 'bg-blue-100 border border-blue-300'
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
                        className='cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors'
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
