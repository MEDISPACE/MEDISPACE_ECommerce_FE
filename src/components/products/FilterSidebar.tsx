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

interface FilterSidebarProps {
  filters: ProductFilter
  onFiltersChange: (filters: ProductFilter) => void
  resultCount: number
}

export function FilterSidebar({ filters, onFiltersChange, resultCount }: FilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['categories'])
  const [brandSearch, setBrandSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands(),
        ])
        // Remove duplicate categories by slug to prevent React key conflicts
        const uniqueCategories = categoriesData.filter(
          (category, index, self) =>
            index === self.findIndex((c) => c.slug === category.slug)
        )
        setCategories(uniqueCategories)
        setBrands(brandsData)
      } catch (error) {
      }
    }

    fetchData()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const currentCategories = filters.categories || []
    const newCategories = checked
      ? [...currentCategories, categorySlug]
      : currentCategories.filter((c) => c !== categorySlug)

    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    const currentBrands = filters.brands || []
    const newBrands = checked ? [...currentBrands, brand] : currentBrands.filter((b) => b !== brand)

    onFiltersChange({ ...filters, brands: newBrands })
  }

  const handlePriceRangeChange = (range: number[]) => {
    onFiltersChange({ ...filters, priceRange: [range[0], range[1]] })
  }

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ ...filters, rating })
  }

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      brands: [],
      priceRange: [0, 1000000],
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
      acc[category.slug] = category.name
      return acc
    },
    {} as Record<string, string>,
  )

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(brandSearch.toLowerCase()))

  const hasActiveFilters =
    (filters.categories?.length || 0) > 0 ||
    (filters.brands?.length || 0) > 0 ||
    (filters.priceRange?.[0] || 0) > 0 ||
    (filters.priceRange?.[1] || 1000000) < 1000000 ||
    (filters.rating || 0) > 0

  return (
    <div className='space-y-4'>
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <CardHeader className='pb-0'>
          <CardTitle className='text-blue-800 flex items-center justify-between'>
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
              className='w-full justify-between p-2 h-auto font-medium text-gray-700 hover:!bg-blue-100 hover:!text-blue-800'
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
                    className='pl-7 h-8 text-xs border-blue-200 focus:border-blue-500'
                  />
                </div>

                {/* Scrollable categories list */}
                <div className='space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin'>
                  {filteredCategories.map((category) => (
                    <div key={category.slug} className='flex items-center space-x-2 min-h-[20px]'>
                      <Checkbox
                        id={`category-${category.slug}`}
                        checked={(filters.categories || []).includes(category.slug)}
                        onCheckedChange={(checked) => handleCategoryChange(category.slug, checked as boolean)}
                        className='shrink-0'
                      />
                      <Label
                        htmlFor={`category-${category.slug}`}
                        className='text-xs cursor-pointer flex-1 min-w-0 truncate'
                        title={category.name}
                      >
                        {category.name}
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
              className='w-full justify-between p-2 h-auto font-medium text-gray-700 hover:!bg-blue-50 hover:!text-blue-800'
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
                    className='pl-7 h-8 text-xs border-blue-200 focus:border-blue-500'
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
                        className='text-xs cursor-pointer flex-1 min-w-0 truncate'
                        title={brand.name}
                      >
                        {brand.name}
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
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={1000000}
                min={0}
                step={10000}
                className='w-full'
              />
              <div className='grid grid-cols-2 gap-1'>
                <Input
                  type='number'
                  value={filters.priceRange?.[0] || 0}
                  onChange={(e) => handlePriceRangeChange([parseInt(e.target.value) || 0, filters.priceRange?.[1] || 1000000])}
                  placeholder='Từ'
                  className='h-8 text-xs border-blue-200 focus:border-blue-500'
                />
                <Input
                  type='number'
                  value={filters.priceRange?.[1] || 1000000}
                  onChange={(e) => handlePriceRangeChange([filters.priceRange?.[0] || 0, parseInt(e.target.value) || 1000000])}
                  placeholder='Đến'
                  className='h-8 text-xs border-blue-200 focus:border-blue-500'
                />
              </div>
              <div className='text-xs text-gray-600 leading-tight'>
                {new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[0] || 0)}đ -{' '}
                {new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[1] || 1000000)}đ
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
            <Button className='w-full h-8 text-xs bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'>
              Áp dụng bộ lọc
            </Button>
            {hasActiveFilters && (
              <Button
                variant='outline'
                onClick={clearFilters}
                className='w-full h-8 text-xs border-blue-200 hover:border-blue-300 text-blue-600'
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
                    className='bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 h-auto'
                  >
                    <span className='truncate max-w-[80px]' title={categoryMap[categorySlug] || categorySlug}>
                      {categoryMap[categorySlug] || categorySlug}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleCategoryChange(categorySlug, false)}
                      className='ml-1 h-auto p-0 text-blue-700 hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                ))}
                {(filters.brands || []).map((brandId) => (
                  <Badge
                    key={brandId}
                    variant='secondary'
                    className='bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 h-auto'
                  >
                    <span className='truncate max-w-[60px]' title={brandMap[brandId] || brandId}>
                      {brandMap[brandId] || brandId}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleBrandChange(brandId, false)}
                      className='ml-1 h-auto p-0 text-blue-700 hover:text-red-500'
                    >
                      <X className='w-2.5 h-2.5' />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
