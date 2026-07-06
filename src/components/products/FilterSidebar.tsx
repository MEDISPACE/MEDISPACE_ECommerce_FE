import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { RatingStars } from '../shared/RatingStars'
import type { ProductFilter, Category, Brand } from '../../types/product'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { searchService } from '../../services/searchService'
import { useDebounce } from '../../hooks/useDebounce'

interface FilterSidebarProps {
  filters: ProductFilter
  onFiltersChange: (filters: ProductFilter) => void
  resultCount: number
  searchQuery?: string
}

export function FilterSidebar({ filters, onFiltersChange, resultCount, searchQuery = '' }: FilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['categories'])
  const [brandSearch, setBrandSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [facetCounts, setFacetCounts] = useState<Record<string, number>>({}) // categoryId/brandId → count

  // Local state for price range to allow smooth slider movement
  const [localPriceRange, setLocalPriceRange] = useState<number[]>(filters.priceRange || [0, 10000000])

  // Debounce the price range to prevent excessive re-renders during slider drag
  const debouncedPriceRange = useDebounce(localPriceRange, 300)

  // Update filters when debounced price range changes
  useEffect(() => {
    if (debouncedPriceRange[0] !== filters.priceRange?.[0] || debouncedPriceRange[1] !== filters.priceRange?.[1]) {
      onFiltersChange({ ...filters, priceRange: [debouncedPriceRange[0], debouncedPriceRange[1]] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPriceRange])

  // Sync local price range when filters change externally (e.g., reset filters)
  useEffect(() => {
    if (
      filters.priceRange &&
      (localPriceRange[0] !== filters.priceRange[0] || localPriceRange[1] !== filters.priceRange[1])
    ) {
      setLocalPriceRange(filters.priceRange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priceRange])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands(),
        ])
        // Remove duplicate categories by slug to prevent React key conflicts
        const uniqueCategories = categoriesData.filter(
          (category, index, self) => index === self.findIndex((c) => c.slug === category.slug),
        )
        setCategories(uniqueCategories)
        setBrands(brandsData)

      } catch (error) {}
    }

    fetchData()
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchFacetCounts = async () => {
      try {
        const priceRange = filters.priceRange || [0, 10000000]
        const result = await searchService.searchProducts({
          q: searchQuery.trim() || '*',
          limit: 1,
          categoryId: filters.categories?.[0],
          brandId: filters.brands?.[0],
          requiresPrescription: filters.isPrescription === true ? true : undefined,
          inStock: filters.inStock === true ? true : undefined,
          priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
          priceMax: priceRange[1] < 10000000 ? priceRange[1] : undefined,
          ratingMin: filters.rating && filters.rating > 0 ? filters.rating : undefined,
        })
        if (cancelled) return

        const counts: Record<string, number> = {}
        for (const facet of result.facet_counts || []) {
          if (facet.fieldName === 'categoryId' || facet.fieldName === 'brandId') {
            for (const item of facet.counts) {
              counts[item.value] = item.count
            }
          }
        }
        setFacetCounts(counts)
      } catch {
        if (!cancelled) setFacetCounts({})
      }
    }

    fetchFacetCounts()

    return () => {
      cancelled = true
    }
  }, [filters.brands, filters.categories, filters.inStock, filters.isPrescription, filters.priceRange, filters.rating, searchQuery])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    // Single-select: backend only supports one categoryId at a time
    const newCategories = checked ? [categoryId] : []
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    // Single-select: backend only supports one brandId at a time
    const newBrands = checked ? [brand] : []
    onFiltersChange({ ...filters, brands: newBrands })
  }

  const handlePriceRangeChange = (range: number[]) => {
    // Update local state immediately for smooth UI
    setLocalPriceRange([range[0], range[1]])
    // The debounced effect will handle updating the actual filters
  }

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ ...filters, rating })
  }

  const clearFilters = () => {
    const defaultPriceRange: [number, number] = [0, 10000000]
    setLocalPriceRange(defaultPriceRange)
    onFiltersChange({
      categories: [],
      brands: [],
      priceRange: defaultPriceRange,
      rating: 0,
      inStock: undefined,
      isPrescription: undefined,
    })
    setBrandSearch('')
    setCategorySearch('')
  }

  const brandMap = brands.reduce(
    (acc, brand) => {
      acc[brand._id] = brand.name
      return acc
    },
    {} as Record<string, string>,
  )

  const categoryMap = categories.reduce(
    (acc, category) => {
      acc[category._id] = category.name
      return acc
    },
    {} as Record<string, string>,
  )

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase()),
  )

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(brandSearch.toLowerCase()))

  const hasActiveFilters =
    (filters.categories?.length || 0) > 0 ||
    (filters.brands?.length || 0) > 0 ||
    (filters.priceRange?.[0] || 0) > 0 ||
    (filters.priceRange?.[1] || 10000000) < 10000000 ||
    (filters.rating || 0) > 0 ||
    filters.inStock === true ||
    filters.isPrescription === true

  return (
    <div className='space-y-4'>
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
        <CardHeader className='pb-0'>
          <CardTitle className='text-blue-800 text-xl font-bold flex items-center justify-between'>
            Bộ lọc sản phẩm
            {hasActiveFilters && (
              <Button variant='ghost' size='sm' onClick={clearFilters} className='text-gray-500 hover:text-red-500'>
                <X className='w-4 h-4' />
              </Button>
            )}
          </CardTitle>
          <div className='text-sm text-gray-600'>{resultCount} sản phẩm tìm thấy</div>
        </CardHeader>

        <CardContent className='p-4 pt-0 space-y-4 overflow-hidden'>
          {/* Categories */}
          <div>
            <Button
              variant='ghost'
              onClick={() => toggleCategory('categories')}
              className='w-full justify-between p-2 h-auto font-medium text-gray-700 hover:!bg-[#E8EDF5] hover:!text-blue-800'
            >
              <span className='text-sm'>Danh mục sản phẩm</span>
              {expandedCategories.includes('categories') ? (
                <ChevronDown className='w-4 h-4 shrink-0' />
              ) : (
                <ChevronRight className='w-4 h-4 shrink-0' />
              )}
            </Button>

            {expandedCategories.includes('categories') && (
              <div className='mt-2 space-y-2'>
                {/* Search input for categories */}
                <div className='relative'>
                  <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3' />
                  <Input
                    placeholder='Tìm danh mục...'
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className='pl-7 h-8 text-xs border-[#BFDBFE] focus:border-[#1E40AF]'
                  />
                </div>

                {/* Scrollable categories list */}
                <div className='space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin'>
                  {filteredCategories.map((category) => (
                    <div key={category.slug} className='flex items-center space-x-2 min-h-[20px]'>
                      <Checkbox
                        id={`category-${category.slug}`}
                        checked={(filters.categories || []).includes(category._id)}
                        onCheckedChange={(checked) => handleCategoryChange(category._id, checked as boolean)}
                        className='shrink-0'
                      />
                      <Label
                        htmlFor={`category-${category.slug}`}
                        className='text-xs cursor-pointer flex-1 min-w-0 flex items-center justify-between gap-1'
                        title={category.name}
                      >
                        <span className='truncate'>{category.name}</span>
                        {facetCounts[category._id] !== undefined && (
                          <span className='text-[10px] bg-[#F0F6FF] text-blue-500 rounded px-1 shrink-0'>
                            {facetCounts[category._id]}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Brands */}
          <div>
            <Button
              variant='ghost'
              onClick={() => toggleCategory('brands')}
              className='w-full justify-between p-2 h-auto font-medium text-gray-700 hover:!bg-[#F0F6FF] hover:!text-blue-800'
            >
              <span className='text-sm'>Thương hiệu</span>
              {expandedCategories.includes('brands') ? (
                <ChevronDown className='w-4 h-4 shrink-0' />
              ) : (
                <ChevronRight className='w-4 h-4 shrink-0' />
              )}
            </Button>

            {expandedCategories.includes('brands') && (
              <div className='mt-2 space-y-2'>
                <div className='relative'>
                  <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3' />
                  <Input
                    placeholder='Tìm thương hiệu'
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className='pl-7 h-8 text-xs border-[#BFDBFE] focus:border-[#1E40AF]'
                  />
                </div>

                <div className='space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin'>
                  {filteredBrands.map((brand) => (
                    <div key={brand._id} className='flex items-center space-x-2 min-h-[20px]'>
                      <Checkbox
                        id={`brand-${brand._id}`}
                        checked={(filters.brands || []).includes(brand._id)}
                        onCheckedChange={(checked) => handleBrandChange(brand._id, checked as boolean)}
                        className='shrink-0'
                      />
                      <Label
                        htmlFor={`brand-${brand._id}`}
                        className='text-xs cursor-pointer flex-1 min-w-0 flex items-center justify-between gap-1'
                        title={brand.name}
                      >
                        <span className='truncate'>{brand.name}</span>
                        {facetCounts[brand._id] !== undefined && (
                          <span className='text-[10px] bg-[#F0F6FF] text-blue-500 rounded px-1 shrink-0'>
                            {facetCounts[brand._id]}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Price Range */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>Khoảng giá</Label>
            <div className='space-y-3'>
              <Slider
                value={localPriceRange}
                onValueChange={handlePriceRangeChange}
                max={10000000}
                min={0}
                step={50000}
                className='w-full'
              />
              <div className='grid grid-cols-2 gap-1'>
                <Input
                  type='text'
                  value={new Intl.NumberFormat('vi-VN').format(localPriceRange[0] || 0)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/\./g, '')) || 0
                    handlePriceRangeChange([value, localPriceRange[1] || 10000000])
                  }}
                  placeholder='Từ'
                  className='h-8 text-xs border-[#BFDBFE] focus:border-[#1E40AF]'
                />
                <Input
                  type='text'
                  value={new Intl.NumberFormat('vi-VN').format(localPriceRange[1] || 10000000)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/\./g, '')) || 0
                    handlePriceRangeChange([localPriceRange[0] || 0, value])
                  }}
                  placeholder='Đến'
                  className='h-8 text-xs border-[#BFDBFE] focus:border-[#1E40AF]'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rating */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>Đánh giá</Label>
            <div className='space-y-1.5'>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className='flex items-center space-x-2 min-h-[20px]'>
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.rating === rating}
                    onCheckedChange={(checked) => handleRatingChange(checked ? rating : 0)}
                    className='shrink-0'
                  />
                  <Label htmlFor={`rating-${rating}`} className='text-xs cursor-pointer flex items-center gap-1 flex-1'>
                    <RatingStars rating={rating} size='sm' showRating={false} />
                    <span className='text-xs'>từ {rating} sao</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Stock Status */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>Tình trạng</Label>
            <div className='space-y-1.5'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='in-stock'
                  checked={filters.inStock === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      inStock: checked ? true : undefined,
                    })
                  }
                  className='shrink-0'
                />
                <Label htmlFor='in-stock' className='text-xs cursor-pointer'>
                  Còn hàng
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='prescription'
                  checked={filters.isPrescription === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      isPrescription: checked ? true : undefined,
                    })
                  }
                  className='shrink-0'
                />
                <Label htmlFor='prescription' className='text-xs cursor-pointer'>
                  Thuốc kê đơn
                </Label>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className='pt-2 space-y-2'>
            {hasActiveFilters && (
              <Button
                variant='outline'
                onClick={clearFilters}
                className='w-full h-8 text-xs border-[#BFDBFE] hover:border-[#BFDBFE] text-[#1E40AF]'
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className='pt-2'>
              <Label className='text-sm font-medium text-gray-700 mb-1 block'>Bộ lọc đang áp dụng</Label>
              <div className='flex flex-wrap gap-1'>
                {(filters.categories || []).map((categorySlug) => (
                  <Badge
                    key={categorySlug}
                    variant='secondary'
                    className='bg-[#E8EDF5] text-[#0A2463] text-xs px-1.5 py-0.5 h-auto'
                  >
                    <span className='truncate max-w-[80px]' title={categoryMap[categorySlug] || categorySlug}>
                      {categoryMap[categorySlug] || categorySlug}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleCategoryChange(categorySlug, false)}
                      className='ml-1 h-auto p-0 text-[#0A2463] hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                ))}
                {(filters.brands || []).map((brandId) => (
                  <Badge
                    key={brandId}
                    variant='secondary'
                    className='bg-[#E8EDF5] text-[#0A2463] text-xs px-1.5 py-0.5 h-auto'
                  >
                    <span className='truncate max-w-[60px]' title={brandMap[brandId] || brandId}>
                      {brandMap[brandId] || brandId}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleBrandChange(brandId, false)}
                      className='ml-1 h-auto p-0 text-[#0A2463] hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                ))}
                {(filters.rating || 0) > 0 && (
                  <Badge variant='secondary' className='bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 h-auto'>
                    <span>Từ {filters.rating} sao</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRatingChange(0)}
                      className='ml-1 h-auto p-0 text-amber-700 hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                )}
                {filters.inStock === true && (
                  <Badge variant='secondary' className='bg-green-100 text-green-700 text-xs px-1.5 py-0.5 h-auto'>
                    <span>Còn hàng</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onFiltersChange({ ...filters, inStock: undefined })}
                      className='ml-1 h-auto p-0 text-green-700 hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                )}
                {filters.isPrescription === true && (
                  <Badge variant='secondary' className='bg-[#E8EDF5] text-[#0A2463] text-xs px-1.5 py-0.5 h-auto'>
                    <span>Thuốc kê đơn</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onFiltersChange({ ...filters, isPrescription: undefined })}
                      className='ml-1 h-auto p-0 text-[#1E40AF] hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                )}
                {((filters.priceRange?.[0] || 0) > 0 || (filters.priceRange?.[1] || 10000000) < 10000000) && (
                  <Badge variant='secondary' className='bg-[#E8EDF5] text-[#1E40AF] text-xs px-1.5 py-0.5 h-auto'>
                    <span>
                      {new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[0] || 0)}đ –{' '}
                      {new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[1] || 10000000)}đ
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        const defaultRange: [number, number] = [0, 10000000]
                        setLocalPriceRange(defaultRange)
                        onFiltersChange({ ...filters, priceRange: defaultRange })
                      }}
                      className='ml-1 h-auto p-0 text-[#1E40AF] hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
