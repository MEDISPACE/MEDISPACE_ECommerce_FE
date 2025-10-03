import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { Package, Stethoscope, Heart, Baby, Leaf } from 'lucide-react'
import ProductSearch from './ProductSearch'
import ProductFilters from './ProductFilters'
import ProductGrid from './ProductGrid'
import '~/style/Products.css'

interface PharmaceuticalProduct {
  id: string
  name: string // Tên thuốc
  activeIngredient: string // Hoạt chất
  dosage: string // Hàm lượng: "500mg", "10mg/5ml"
  dosageForm: string // Dạng: "Viên nén", "Siro", "Kem bôi"
  packaging: string // "30 viên/hộp", "100ml/chai"
  manufacturer: string // Nhà sản xuất
  price: number
  originalPrice?: number
  image: string
  category: string // Nhóm thuốc: "Kháng sinh", "Giảm đau"
  inStock: boolean
  prescription: boolean // Bắt buộc có toa thuốc
  registrationNumber?: string // Số đăng ký thuốc
  origin?: string // Xuất xứ
  expiryDate?: string // Hạn sử dụng
  discount?: number
}

interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  rating: number
  inStock: boolean
  prescription: boolean
}

// Mock data - sản phẩm dược phẩm
const mockProducts: PharmaceuticalProduct[] = [
  {
    id: '1',
    name: 'Paracetamol',
    activeIngredient: 'Paracetamol',
    dosage: '500mg',
    dosageForm: 'Viên nén',
    packaging: '100 viên/hộp',
    manufacturer: 'Traphaco',
    price: 25000,
    originalPrice: 30000,
    image:
      'https://images.unsplash.com/photo-1596522016734-8e6136fe5cfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwcGhhcm1hY3l8ZW58MXx8fHwxNzU5MTQ5Nzk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thuốc giảm đau',
    inStock: true,
    prescription: false,
    origin: 'Việt Nam',
    registrationNumber: 'VD-18506-17',
  },
  {
    id: '2',
    name: 'Vitamin C Blackmores',
    activeIngredient: 'Ascorbic acid',
    dosage: '1000mg',
    dosageForm: 'Viên nén',
    packaging: '60 viên/hộp',
    manufacturer: 'Blackmores Australia',
    price: 180000,
    originalPrice: 220000,
    image:
      'https://images.unsplash.com/photo-1682978900142-9ab110f7a868?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXRhbWluJTIwc3VwcGxlbWVudHMlMjBib3R0bGVzfGVufDF8fHx8MTc1OTIxODcxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Vitamin & khoáng chất',
    inStock: true,
    prescription: false,
    origin: 'Australia',
  },
  {
    id: '3',
    name: 'Máy đo huyết áp Omron HEM-6161',
    activeIngredient: 'Thiết bị điện tử',
    dosage: 'N/A',
    dosageForm: 'Thiết bị y tế',
    packaging: '1 máy/hộp + phụ kiện',
    manufacturer: 'Omron Healthcare',
    price: 1250000,
    originalPrice: 1450000,
    image:
      'https://images.unsplash.com/photo-1700832082200-af7deeb63d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlJTIwc3RldGhvc2NvcGV8ZW58MXx8fHwxNzU5MTk5NTA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thiết bị y tế',
    inStock: true,
    prescription: false,
    origin: 'Nhật Bản',
  },
  {
    id: '4',
    name: 'Aspirin Bayer',
    activeIngredient: 'Acetylsalicylic acid',
    dosage: '100mg',
    dosageForm: 'Viên nén bao phim',
    packaging: '30 viên/hộp',
    manufacturer: 'Bayer AG',
    price: 45000,
    originalPrice: 55000,
    image:
      'https://images.unsplash.com/photo-1652038448592-27377ec0b7d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMG1lZGljaW5lJTIwcGlsbHN8ZW58MXx8fHwxNzU5MTc4Mjc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thuốc kê đơn',
    inStock: true,
    prescription: true,
    origin: 'Đức',
    registrationNumber: 'VD-17284-16',
  },
  {
    id: '5',
    name: 'Omega 3-6-9',
    activeIngredient: 'Fish oil complex',
    dosage: '1000mg',
    dosageForm: 'Viên nang mềm',
    packaging: '100 viên/hộp',
    manufacturer: 'Nature Made',
    price: 320000,
    originalPrice: 380000,
    image:
      'https://images.unsplash.com/photo-1593181581874-361761582b9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXRhbWlucyUyMHN1cHBsZW1lbnRzfGVufDF8fHx8MTc1OTE0NzMwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Vitamin & Thực phẩm chức năng',
    inStock: true,
    prescription: false,
    origin: 'Mỹ',
  },
  {
    id: '6',
    name: 'Betadine',
    activeIngredient: 'Povidone iodine',
    dosage: '10%',
    dosageForm: 'Dung dịch',
    packaging: '250ml/chai',
    manufacturer: 'Mundipharma',
    price: 85000,
    originalPrice: 95000,
    image:
      'https://images.unsplash.com/photo-1595464144526-5fb181b74625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3VwcGxpZXMlMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc1OTIxNjQxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Chăm sóc cá nhân',
    inStock: true,
    prescription: false,
    origin: 'Thái Lan',
  },
  {
    id: '7',
    name: 'Similac Gain Plus',
    activeIngredient: 'Whey protein, DHA, ARA',
    dosage: 'N/A',
    dosageForm: 'Sữa bột',
    packaging: '900g/hộp',
    manufacturer: 'Abbott',
    price: 450000,
    originalPrice: 520000,
    image:
      'https://images.unsplash.com/photo-1595464144526-5fb181b74625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3VwcGxpZXMlMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc1OTIxNjQxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Mẹ và bé',
    inStock: true,
    prescription: false,
    origin: 'Singapore',
  },
  {
    id: '8',
    name: 'Cao Đan Sâm',
    activeIngredient: 'Salvia miltiorrhiza extract',
    dosage: '250mg',
    dosageForm: 'Viên nang',
    packaging: '60 viên/hộp',
    manufacturer: 'Tâm Bình Pharmaceutical',
    price: 165000,
    originalPrice: 195000,
    image:
      'https://images.unsplash.com/photo-1593181581874-361761582b9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXRhbWlucyUyMHN1cHBsZW1lbnRzfGVufDF8fHx8MTc1OTE0NzMwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thảo dược',
    inStock: false,
    prescription: false,
    origin: 'Việt Nam',
  },
  {
    id: '9',
    name: 'Hirudoid',
    activeIngredient: 'Mucopolysaccharide polysulfate',
    dosage: '3mg/g',
    dosageForm: 'Kem bôi',
    packaging: '40g/tuýp',
    manufacturer: 'Mobilat',
    price: 120000,
    originalPrice: 140000,
    image:
      'https://images.unsplash.com/photo-1595464144526-5fb181b74625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3VwcGxpZXMlMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc1OTIxNjQxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thuốc bôi ngoài da',
    inStock: true,
    prescription: false,
    origin: 'Đức',
  },
  {
    id: '10',
    name: 'Amoxicillin',
    activeIngredient: 'Amoxicillin trihydrate',
    dosage: '500mg',
    dosageForm: 'Viên nang',
    packaging: '20 viên/hộp',
    manufacturer: 'GSK Pharmaceuticals',
    price: 35000,
    originalPrice: 42000,
    image:
      'https://images.unsplash.com/photo-1652038448592-27377ec0b7d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMG1lZGljaW5lJTIwcGlsbHN8ZW58MXx8fHwxNzU5MTc4Mjc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Kháng sinh',
    inStock: true,
    prescription: true,
    origin: 'Anh',
    registrationNumber: 'VD-15689-15',
  },
  {
    id: '11',
    name: 'Probiotics 30B CFU',
    activeIngredient: 'Lactobacillus complex',
    dosage: '30 billion CFU',
    dosageForm: 'Viên nang',
    packaging: '60 viên/hộp',
    manufacturer: 'Jarrow Formulas',
    price: 280000,
    originalPrice: 330000,
    image:
      'https://images.unsplash.com/photo-1593181581874-361761582b9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXRhbWlucyUyMHN1cHBsZW1lbnRzfGVufDF8fHx8MTc1OTE0NzMwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Vitamin & Thực phẩm chức năng',
    inStock: true,
    prescription: false,
    origin: 'Mỹ',
  },
  {
    id: '12',
    name: 'Máy đo đường huyết Accu-Chek',
    activeIngredient: 'Thiết bị điện tử',
    dosage: 'N/A',
    dosageForm: 'Thiết bị y tế',
    packaging: '1 máy + que thử + kim',
    manufacturer: 'Roche Diagnostics',
    price: 850000,
    originalPrice: 950000,
    image:
      'https://images.unsplash.com/photo-1700832082200-af7deeb63d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlJTIwc3RldGhvc2NvcGV8ZW58MXx8fHwxNzU5MTk5NTA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Thiết bị y tế',
    inStock: true,
    prescription: false,
    origin: 'Thụy Sĩ',
  },
]

const initialFilters: FilterState = {
  categories: [],
  brands: [],
  priceRange: [0, 1000000],
  rating: 0,
  inStock: false,
  prescription: false,
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [loading, setLoading] = useState(true)

  // Handle URL search params
  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      // Search filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false
      }

      // Brand filter (using manufacturer)
      if (filters.brands.length > 0 && !filters.brands.includes(product.manufacturer)) {
        return false
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Stock filter
      if (filters.inStock && !product.inStock) {
        return false
      }

      // Prescription filter
      if (filters.prescription && !product.prescription) {
        return false
      }

      return true
    })
  }, [
    searchQuery,
    JSON.stringify(filters.categories),
    JSON.stringify(filters.brands),
    JSON.stringify(filters.priceRange),
    filters.inStock,
    filters.prescription,
  ])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchQuery('')
  }, [])

  const handlePrescriptionUpload = useCallback((file: File, extractedText?: string) => {
    // Log prescription upload for analytics or medical compliance
    console.log('Prescription uploaded:', {
      fileName: file.name,
      fileSize: file.size,
      extractedMedications: extractedText,
      timestamp: new Date().toISOString(),
    })

    // You can add additional logic here such as:
    // - Save to database for medical records
    // - Send to AI service for better analysis
    // - Trigger notifications to pharmacist
    // - Update user prescription history
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-r from-[#0066CC] via-[#4A90E2] to-[#00BFFF] text-white py-20 overflow-hidden'>
        {/* Background decorative elements */}
        <div className='absolute inset-0'>
          <div className='absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl' />
          <div className='absolute top-32 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl' />
          <div className='absolute bottom-20 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-xl' />
        </div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-center'
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='flex items-center justify-center mb-8'
            >
              <div className='bg-white/20 backdrop-blur-sm rounded-full p-4 mr-6'>
                <Package className='w-16 h-16' />
              </div>
              <h1 className='text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
                Dược phẩm MEDISPACE
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed'
            >
              {searchParams.get('search')
                ? `Kết quả tìm kiếm cho "${searchParams.get('search')}"`
                : 'Khám phá hàng nghìn sản phẩm thuốc, thiết bị y tế và thực phẩm chức năng chất lượng cao từ các nhà sản xuất uy tín'}
            </motion.p>

            {/* Category Icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className='flex items-center justify-center gap-12 flex-wrap'
            >
              {[
                { icon: Package, label: 'Thuốc' },
                { icon: Stethoscope, label: 'Thiết bị y tế' },
                { icon: Heart, label: 'Vitamin' },
                { icon: Baby, label: 'Mẹ & Bé' },
                { icon: Leaf, label: 'Thảo dược' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className='flex flex-col items-center text-blue-100 hover:text-white transition-colors group cursor-pointer'
                >
                  <div className='bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110'>
                    <item.icon className='w-8 h-8' />
                  </div>
                  <span className='text-sm font-medium'>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Search Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <ProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onPrescriptionUpload={handlePrescriptionUpload}
            placeholder='Tìm kiếm thuốc, hoạt chất, nhà sản xuất...'
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='flex flex-col lg:flex-row gap-10'>
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className='lg:w-80 flex-shrink-0'
          >
            <ProductFilters filters={filters} onFiltersChange={setFilters} onClearFilters={handleClearFilters} />
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className='flex-1'
          >
            <ProductGrid products={filteredProducts} loading={loading} searchQuery={searchQuery} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
