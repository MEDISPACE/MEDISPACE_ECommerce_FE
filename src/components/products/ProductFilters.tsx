import { useState, useEffect, useCallback } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Slider } from '~/components/ui/slider'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import '~/style/Products.css'

interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  rating: number
  inStock: boolean
  prescription: boolean
}

interface ProductFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
}

const categories = [
  { name: 'Thuốc giảm đau', count: 15 },
  { name: 'Vitamin & khoáng chất', count: 23 },
  { name: 'Kháng sinh', count: 8 },
  { name: 'Thực phẩm chức năng', count: 32 },
  { name: 'Thuốc dị ứng', count: 12 },
  { name: 'Hỗ trợ tiêu hóa', count: 18 },
  { name: 'Chăm sóc mắt', count: 7 },
  { name: 'Thuốc bôi ngoài da', count: 9 },
]

const brands = [
  { name: 'Traphaco', count: 45 },
  { name: 'DHG Pharma', count: 38 },
  { name: 'Imexpharm', count: 29 },
  { name: 'Blackmores', count: 15 },
  { name: 'Centrum', count: 12 },
  { name: 'Abbott', count: 22 },
  { name: 'Pfizer', count: 18 },
  { name: 'GSK', count: 14 },
  { name: 'Sanofi', count: 16 },
]

export default function ProductFilters({ filters, onFiltersChange, onClearFilters }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    other: true,
  })

  const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange)
  const [isDragging, setIsDragging] = useState(false)

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }, [])

  // Sync priceRange state with filters prop
  useEffect(() => {
    if (!isDragging) {
      setPriceRange(filters.priceRange)
    }
  }, [filters.priceRange, isDragging])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryName]
      : filters.categories.filter((c) => c !== categoryName)

    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }

  const handleBrandChange = (brandName: string, checked: boolean) => {
    const newBrands = checked ? [...filters.brands, brandName] : filters.brands.filter((b) => b !== brandName)

    onFiltersChange({
      ...filters,
      brands: newBrands,
    })
  }

  const activeFiltersCount =
    filters.categories.length +
    filters.brands.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.prescription ? 1 : 0)

  const FilterContent = () => (
    <div className='space-y-5'>
      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium text-foreground text-sm'>Bộ lọc đang áp dụng</h4>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClearFilters}
              className='text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1 h-auto'
            >
              <X className='w-3 h-3 mr-1' />
              Xóa tất cả
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {filters.categories.map((categoryName) => (
              <Badge key={categoryName} variant='secondary' className='filter-badge bg-[#0066CC]/10 text-[#0066CC]'>
                {categoryName}
                <button
                  onClick={() => handleCategoryChange(categoryName, false)}
                  className='ml-1 hover:bg-[#0066CC]/20 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ))}
            {filters.brands.map((brandName) => (
              <Badge key={brandName} variant='secondary' className='filter-badge bg-[#4A90E2]/10 text-[#4A90E2]'>
                {brandName}
                <button
                  onClick={() => handleBrandChange(brandName, false)}
                  className='ml-1 hover:bg-[#4A90E2]/20 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories Filter */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors'>
          <h4 className='font-medium text-foreground text-sm'>Danh mục</h4>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${openSections.categories ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 mt-2'>
          {categories.map((category) => (
            <div key={category.name} className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id={`category-${category.name}`}
                  checked={filters.categories.includes(category.name)}
                  onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
                />
                <label
                  htmlFor={`category-${category.name}`}
                  className='text-xs text-gray-700 cursor-pointer hover:text-[#0066CC] transition-colors'
                >
                  {category.name}
                </label>
              </div>
              <span className='text-xs text-muted-foreground'>({category.count})</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Brands Filter */}
      <Collapsible open={openSections.brands} onOpenChange={() => toggleSection('brands')}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors'>
          <h4 className='font-medium text-foreground text-sm'>Thương hiệu</h4>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${openSections.brands ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 mt-2'>
          {brands.map((brand) => (
            <div key={brand.name} className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id={`brand-${brand.name}`}
                  checked={filters.brands.includes(brand.name)}
                  onCheckedChange={(checked) => handleBrandChange(brand.name, checked as boolean)}
                />
                <label
                  htmlFor={`brand-${brand.name}`}
                  className='text-xs text-gray-700 cursor-pointer hover:text-[#0066CC] transition-colors'
                >
                  {brand.name}
                </label>
              </div>
              <span className='text-xs text-gray-500'>({brand.count})</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range Filter */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors'>
          <h4 className='font-medium text-foreground text-sm'>Khoảng giá</h4>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${openSections.price ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-3 mt-2'>
          <div className='px-2'>
            <div className='space-y-4'>
              <Slider
                value={priceRange}
                onValueChange={(value) => {
                  setPriceRange(value as [number, number])
                }}
                onValueCommit={(value) => {
                  setIsDragging(false)
                  onFiltersChange({ ...filters, priceRange: value as [number, number] })
                }}
                onPointerDown={() => setIsDragging(true)}
                max={1000000}
                min={0}
                step={5000}
                className='w-full'
              />
              <div className='flex justify-between text-sm text-blue-600'>
                <span>{formatPrice(priceRange[0])}₫</span>
                <span>{formatPrice(priceRange[1])}₫</span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='Từ'
                  value={formatPrice(priceRange[0])}
                  className='text-center border-blue-200 text-xs'
                  readOnly
                />
                <Input
                  placeholder='Đến'
                  value={formatPrice(priceRange[1])}
                  className='text-center border-blue-200 text-xs'
                  readOnly
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating Filter */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors'>
          <h4 className='font-medium text-foreground text-sm'>Đánh giá</h4>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${openSections.rating ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 mt-2'>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className='flex items-center space-x-2'>
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) =>
                  onFiltersChange({
                    ...filters,
                    rating: checked ? rating : 0,
                  })
                }
              />
              <label
                htmlFor={`rating-${rating}`}
                className='text-xs text-muted-foreground cursor-pointer hover:text-[#0066CC] transition-colors flex items-center'
              >
                <span className='mr-1'>{rating}</span>
                <span className='text-yellow-400'>★</span>
                <span className='ml-1'>trở lên</span>
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Other Filters */}
      <Collapsible open={openSections.other} onOpenChange={() => toggleSection('other')}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors'>
          <h4 className='font-medium text-foreground text-sm'>Khác</h4>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${openSections.other ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 mt-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='in-stock'
              checked={filters.inStock}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, inStock: checked as boolean })}
            />
            <label
              htmlFor='in-stock'
              className='text-xs text-gray-700 cursor-pointer hover:text-[#0066CC] transition-colors'
            >
              Chỉ hiển thị sản phẩm còn hàng
            </label>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='prescription'
              checked={filters.prescription}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, prescription: checked as boolean })}
            />
            <label
              htmlFor='prescription'
              className='text-xs text-gray-700 cursor-pointer hover:text-[#0066CC] transition-colors'
            >
              Thuốc kê đơn
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className='hidden lg:block'>
        <div className='bg-white/90 backdrop-blur-md border border-white/40 rounded-[20px] shadow-xl p-5'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-bold text-foreground flex items-center'>
              <div className='bg-[#0066CC]/10 rounded-full p-2 mr-2'>
                <Filter className='w-5 h-5 text-[#0066CC]' />
              </div>
              Bộ lọc sản phẩm
            </h3>
            {activeFiltersCount > 0 && (
              <Badge className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] text-white px-3 py-1 text-sm'>
                {activeFiltersCount} bộ lọc
              </Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters */}
      <div className='lg:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' className='relative'>
              <Filter className='w-4 h-4 mr-2' />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <Badge className='absolute -top-2 -right-2 bg-[#0066CC] text-white w-5 h-5 p-0 flex items-center justify-center text-xs'>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-80 bg-white/95 backdrop-blur-sm'>
            <SheetHeader>
              <SheetTitle className='flex items-center'>
                <Filter className='w-5 h-5 mr-2 text-[#0066CC]' />
                Bộ lọc sản phẩm
              </SheetTitle>
              <SheetDescription>Tùy chỉnh bộ lọc để tìm sản phẩm phù hợp</SheetDescription>
            </SheetHeader>
            <div className='mt-6'>
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
