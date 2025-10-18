export interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  productCount: number
  subCategories: SubCategory[]
}

export interface SubCategory {
  id: string
  name: string
  slug: string
  description: string
  productCount: number
  parentSlug: string
  filters?: CategoryFilter[]
}

export interface CategoryFilter {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'select'
  options?: FilterOption[]
  min?: number
  max?: number
}

export interface FilterOption {
  id: string
  label: string
  count: number
}

export const mockCategories: Category[] = [
  {
    id: 'thuc-pham-chuc-nang',
    name: 'Thực phẩm chức năng',
    slug: 'thuc-pham-chuc-nang',
    description: 'Bổ sung dinh dưỡng thiết yếu cho sức khỏe toàn diện',
    color: '#0066CC',
    productCount: 1234,
    subCategories: [
      {
        id: 'vitamin-khoang-chat',
        name: 'Vitamin & Khoáng chất',
        slug: 'vitamin-khoang-chat',
        description: 'Bổ sung vitamin thiết yếu cho cơ thể khỏe mạnh',
        productCount: 234,
        parentSlug: 'thuc-pham-chuc-nang',
        filters: [
          {
            id: 'vitamin-type',
            name: 'Loại Vitamin',
            type: 'checkbox',
            options: [
              { id: 'vitamin-a', label: 'Vitamin A', count: 23 },
              { id: 'vitamin-b', label: 'Vitamin B Complex', count: 45 },
              { id: 'vitamin-c', label: 'Vitamin C', count: 67 },
              { id: 'vitamin-d', label: 'Vitamin D', count: 34 },
              { id: 'vitamin-e', label: 'Vitamin E', count: 28 },
              { id: 'multivitamin', label: 'Multivitamin', count: 89 },
            ],
          },
          {
            id: 'form-type',
            name: 'Dạng sống',
            type: 'checkbox',
            options: [
              { id: 'capsule', label: 'Viên nang', count: 156 },
              { id: 'effervescent', label: 'Viên sủi', count: 45 },
              { id: 'liquid', label: 'Dạng lỏng', count: 23 },
              { id: 'gummy', label: 'Kẹo dẻo', count: 34 },
            ],
          },
        ],
      },
      {
        id: 'thao-duoc-thien-nhien',
        name: 'Thảo dược & Thiên nhiên',
        slug: 'thao-duoc-thien-nhien',
        description: 'Sản phẩm từ thảo dược thiên nhiên',
        productCount: 156,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'ho-tro-tieu-hoa',
        name: 'Hỗ trợ tiêu hóa',
        slug: 'ho-tro-tieu-hoa',
        description: 'Cải thiện hệ tiêu hóa',
        productCount: 89,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'tang-cuong-mien-dich',
        name: 'Tăng cường miễn dịch',
        slug: 'tang-cuong-mien-dich',
        description: 'Tăng sức đề kháng',
        productCount: 145,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'suc-khoe-tim-mach',
        name: 'Sức khỏe tim mạch',
        slug: 'suc-khoe-tim-mach',
        description: 'Hỗ trợ tim mạch khỏe mạnh',
        productCount: 67,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'suc-khoe-xuong-khop',
        name: 'Sức khỏe xương khớp',
        slug: 'suc-khoe-xuong-khop',
        description: 'Bảo vệ xương khớp',
        productCount: 123,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'lam-dep-da',
        name: 'Làm đẹp da',
        slug: 'lam-dep-da',
        description: 'Chăm sóc da từ bên trong',
        productCount: 78,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'ho-tro-giam-can',
        name: 'Hỗ trợ giảm cân',
        slug: 'ho-tro-giam-can',
        description: 'Hỗ trợ kiểm soát cân nặng',
        productCount: 56,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'bo-sung-dinh-duong',
        name: 'Bổ sung dinh dưỡng',
        slug: 'bo-sung-dinh-duong',
        description: 'Dinh dưỡng toàn diện',
        productCount: 234,
        parentSlug: 'thuc-pham-chuc-nang',
      },
      {
        id: 'suc-khoe-sinh-san',
        name: 'Sức khỏe sinh sản',
        slug: 'suc-khoe-sinh-san',
        description: 'Hỗ trợ sinh sản khỏe mạnh',
        productCount: 45,
        parentSlug: 'thuc-pham-chuc-nang',
      },
    ],
  },
  {
    id: 'duoc-my-pham',
    name: 'Dược mỹ phẩm',
    slug: 'duoc-my-pham',
    description: 'Chăm sóc da chuyên nghiệp với công nghệ tiên tiến',
    color: '#0066CC',
    productCount: 856,
    subCategories: [
      {
        id: 'cham-soc-da-mat',
        name: 'Chăm sóc da mặt',
        slug: 'cham-soc-da-mat',
        description: 'Sản phẩm chăm sóc da mặt chuyên sâu',
        productCount: 234,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'kem-chong-nang',
        name: 'Kem chống nắng',
        slug: 'kem-chong-nang',
        description: 'Bảo vệ da khỏi tia UV',
        productCount: 89,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'dieu-tri-mun',
        name: 'Điều trị mụn',
        slug: 'dieu-tri-mun',
        description: 'Giải pháp trị mụn hiệu quả',
        productCount: 123,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'chong-lao-hoa',
        name: 'Chống lão hóa',
        slug: 'chong-lao-hoa',
        description: 'Ngăn ngừa dấu hiệu tuổi tác',
        productCount: 156,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'duong-am-phuc-hoi',
        name: 'Dưỡng ẩm & phục hồi',
        slug: 'duong-am-phuc-hoi',
        description: 'Phục hồi và dưỡng ẩm da',
        productCount: 167,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'lam-trang-da',
        name: 'Làm trắng da',
        slug: 'lam-trang-da',
        description: 'Cải thiện tone da',
        productCount: 78,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'cham-soc-moi',
        name: 'Chăm sóc môi',
        slug: 'cham-soc-moi',
        description: 'Dưỡng môi mềm mại',
        productCount: 34,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'san-pham-nam-gioi',
        name: 'Sản phẩm nam giới',
        slug: 'san-pham-nam-gioi',
        description: 'Chăm sóc da dành cho nam',
        productCount: 45,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'my-pham-tre-em',
        name: 'Mỹ phẩm trẻ em',
        slug: 'my-pham-tre-em',
        description: 'An toàn cho làn da nhạy cảm',
        productCount: 56,
        parentSlug: 'duoc-my-pham',
      },
      {
        id: 'dung-cu-lam-dep',
        name: 'Dụng cụ làm đẹp',
        slug: 'dung-cu-lam-dep',
        description: 'Phụ kiện làm đẹp',
        productCount: 67,
        parentSlug: 'duoc-my-pham',
      },
    ],
  },
  {
    id: 'thuoc',
    name: 'Thuốc',
    slug: 'thuoc',
    description: 'Thuốc chất lượng cao được kiểm định nghiêm ngặt',
    color: '#0066CC',
    productCount: 2145,
    subCategories: [
      {
        id: 'thuoc-ke-don',
        name: 'Thuốc kê đơn (Rx)',
        slug: 'thuoc-ke-don',
        description: 'Thuốc theo toa bác sĩ',
        productCount: 856,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-khong-ke-don',
        name: 'Thuốc không kê đơn (OTC)',
        slug: 'thuoc-khong-ke-don',
        description: 'Thuốc không cần toa',
        productCount: 567,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-giam-dau',
        name: 'Thuốc giảm đau',
        slug: 'thuoc-giam-dau',
        description: 'Giảm đau hiệu quả',
        productCount: 234,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-cam-lanh',
        name: 'Thuốc cảm lạnh',
        slug: 'thuoc-cam-lanh',
        description: 'Điều trị cảm cúm',
        productCount: 156,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-da-day',
        name: 'Thuốc dạ dày',
        slug: 'thuoc-da-day',
        description: 'Bảo vệ dạ dày',
        productCount: 123,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-tim-mach',
        name: 'Thuốc tim mạch',
        slug: 'thuoc-tim-mach',
        description: 'Điều trị tim mạch',
        productCount: 89,
        parentSlug: 'thuoc',
      },
      {
        id: 'khang-sinh',
        name: 'Kháng sinh',
        slug: 'khang-sinh',
        description: 'Kháng khuẩn hiệu quả',
        productCount: 167,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-da-lieu',
        name: 'Thuốc da liễu',
        slug: 'thuoc-da-lieu',
        description: 'Điều trị bệnh da',
        productCount: 78,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-mat-tai-mui',
        name: 'Thuốc mắt/tai/mũi',
        slug: 'thuoc-mat-tai-mui',
        description: 'Chuyên khoa mắt tai mũi',
        productCount: 95,
        parentSlug: 'thuoc',
      },
      {
        id: 'thuoc-tre-em',
        name: 'Thuốc trẻ em',
        slug: 'thuoc-tre-em',
        description: 'An toàn cho trẻ em',
        productCount: 134,
        parentSlug: 'thuoc',
      },
    ],
  },
  {
    id: 'cham-soc-ca-nhan',
    name: 'Chăm sóc cá nhân',
    slug: 'cham-soc-ca-nhan',
    description: 'Sản phẩm vệ sinh và làm đẹp hàng ngày',
    color: '#0066CC',
    productCount: 743,
    subCategories: [
      {
        id: 'cham-soc-toc',
        name: 'Chăm sóc tóc',
        slug: 'cham-soc-toc',
        description: 'Dầu gội, dầu xả, kem ủ',
        productCount: 123,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'cham-soc-co-the',
        name: 'Chăm sóc cơ thể',
        slug: 'cham-soc-co-the',
        description: 'Sữa tắm, dưỡng thể',
        productCount: 156,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 've-sinh-rang-mieng',
        name: 'Vệ sinh răng miệng',
        slug: 've-sinh-rang-mieng',
        description: 'Kem đánh răng, nước súc miệng',
        productCount: 89,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'khu-mui-nuoc-hoa',
        name: 'Khử mùi & nước hoa',
        slug: 'khu-mui-nuoc-hoa',
        description: 'Lăn khử mùi, nước hoa',
        productCount: 67,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'cham-soc-phu-nu',
        name: 'Chăm sóc phụ nữ',
        slug: 'cham-soc-phu-nu',
        description: 'Băng vệ sinh, tampon',
        productCount: 78,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'cham-soc-nam-gioi',
        name: 'Chăm sóc nam giới',
        slug: 'cham-soc-nam-gioi',
        description: 'Dao cạo, gel cạo râu',
        productCount: 45,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'san-pham-tam-goi',
        name: 'Sản phẩm tắm gội',
        slug: 'san-pham-tam-goi',
        description: 'Sữa tắm, dầu gội cao cấp',
        productCount: 134,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'giay-bang-ta',
        name: 'Giấy & băng tã',
        slug: 'giay-bang-ta',
        description: 'Giấy vệ sinh, băng tã',
        productCount: 56,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 'san-pham-cho-be',
        name: 'Sản phẩm cho bé',
        slug: 'san-pham-cho-be',
        description: 'Chăm sóc bé yêu',
        productCount: 89,
        parentSlug: 'cham-soc-ca-nhan',
      },
      {
        id: 've-sinh-ca-nhan',
        name: 'Vệ sinh cá nhân',
        slug: 've-sinh-ca-nhan',
        description: 'Khăn ướt, khăn giấy',
        productCount: 67,
        parentSlug: 'cham-soc-ca-nhan',
      },
    ],
  },
  {
    id: 'thiet-bi-y-te',
    name: 'Thiết bị y tế',
    slug: 'thiet-bi-y-te',
    description: 'Thiết bị đo lường và hỗ trợ sức khỏe tại nhà',
    color: '#0066CC',
    productCount: 421,
    subCategories: [
      {
        id: 'may-do-huyet-ap',
        name: 'Máy đo huyết áp',
        slug: 'may-do-huyet-ap',
        description: 'Theo dõi huyết áp chính xác',
        productCount: 67,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'may-do-duong-huyet',
        name: 'Máy đo đường huyết',
        slug: 'may-do-duong-huyet',
        description: 'Kiểm soát đường huyết',
        productCount: 45,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'nhiet-ke',
        name: 'Nhiệt kế',
        slug: 'nhiet-ke',
        description: 'Đo thân nhiệt chính xác',
        productCount: 89,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'may-xong-mui-hong',
        name: 'Máy xông mũi họng',
        slug: 'may-xong-mui-hong',
        description: 'Hỗ trợ điều trị hô hấp',
        productCount: 34,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'gay-chong-xe-lan',
        name: 'Gậy chống/xe lăn',
        slug: 'gay-chong-xe-lan',
        description: 'Hỗ trợ di chuyển',
        productCount: 23,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'bang-gac-dung-cu',
        name: 'Băng gạc & dụng cụ',
        slug: 'bang-gac-dung-cu',
        description: 'Dụng cụ y tế cơ bản',
        productCount: 156,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'khau-trang-y-te',
        name: 'Khẩu trang y tế',
        slug: 'khau-trang-y-te',
        description: 'Bảo vệ hô hấp',
        productCount: 78,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'kinh-lup-kinh-doc-sach',
        name: 'Kính lúp/kính đọc sách',
        slug: 'kinh-lup-kinh-doc-sach',
        description: 'Hỗ trợ thị lực',
        productCount: 45,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'may-massage',
        name: 'Máy massage',
        slug: 'may-massage',
        description: 'Thư giãn và phục hồi',
        productCount: 56,
        parentSlug: 'thiet-bi-y-te',
      },
      {
        id: 'thiet-bi-ho-tro-khac',
        name: 'Thiết bị hỗ trợ khác',
        slug: 'thiet-bi-ho-tro-khac',
        description: 'Các thiết bị y tế khác',
        productCount: 67,
        parentSlug: 'thiet-bi-y-te',
      },
    ],
  },
]

export const getFeaturedCategories = () => {
  // Return top subcategories from all main categories
  const featured: SubCategory[] = []
  mockCategories.forEach((category) => {
    // Get top 2 subcategories from each main category
    const topSubs = category.subCategories.sort((a, b) => b.productCount - a.productCount).slice(0, 2)
    featured.push(...topSubs)
  })
  return featured.slice(0, 8) // Return top 8 overall
}

export interface BestsellingProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discountPercent?: number
  image: string
  badge?: 'Sale' | 'Hot' | 'New'
  unit: string
  categorySlug: string
  subCategorySlug: string
}

export const getBestsellingProductsBySubCategory = (
  categorySlug: string,
  subCategorySlug: string,
): BestsellingProduct[] => {
  // Simplified to prevent performance issues
  const simpleProducts: BestsellingProduct[] = [
    {
      id: '1',
      name: 'Sản phẩm 1',
      description: 'Mô tả sản phẩm 1',
      price: 25000,
      originalPrice: 30000,
      discountPercent: 15,
      image: '/api/placeholder/80/80',
      badge: 'Hot',
      unit: 'Hộp',
      categorySlug: categorySlug,
      subCategorySlug: subCategorySlug,
    },
    {
      id: '2',
      name: 'Sản phẩm 2',
      description: 'Mô tả sản phẩm 2',
      price: 45000,
      image: '/api/placeholder/80/80',
      badge: 'New',
      unit: 'Chai',
      categorySlug: categorySlug,
      subCategorySlug: subCategorySlug,
    },
  ]

  return simpleProducts

  // Original complex data structure that might cause performance issues
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _products: { [key: string]: BestsellingProduct[] } = {
    'duoc-my-pham-cham-soc-da-mat': [
      {
        id: 'p1',
        name: 'Sữa rửa mặt thảo dược Sắc Ngọc Khang',
        description: 'Giúp sáng da, làm sạch sâu',
        price: 69000,
        originalPrice: 81000,
        discountPercent: 15,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Tuýp',
        categorySlug: 'duoc-my-pham',
        subCategorySlug: 'cham-soc-da-mat',
      },
      {
        id: 'p2',
        name: 'Kem chống nắng On: The Body Rice Therapy',
        description: 'Rice Cleansing Foam dưỡng ẩm',
        price: 165000,
        originalPrice: 199000,
        discountPercent: 17,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Tuýp',
        categorySlug: 'duoc-my-pham',
        subCategorySlug: 'cham-soc-da-mat',
      },
      {
        id: 'p3',
        name: 'Nước tẩy trang JMSolution Derma Care',
        description: 'Centella cho da nhạy cảm',
        price: 169150,
        image: '/api/placeholder/80/80',
        badge: 'Sale',
        unit: 'Chai',
        categorySlug: 'duoc-my-pham',
        subCategorySlug: 'cham-soc-da-mat',
      },
      {
        id: 'p4',
        name: 'Nước tẩy trang JMSolution Water Luminous',
        description: 'S.O.S làm sáng da',
        price: 165170,
        originalPrice: 194000,
        discountPercent: 15,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Chai',
        categorySlug: 'duoc-my-pham',
        subCategorySlug: 'cham-soc-da-mat',
      },
    ],
    'thuc-pham-chuc-nang-vitamin-khoang-chat': [
      {
        id: 'p5',
        name: 'Vitamin C 1000mg DHG Pharma',
        description: 'Tăng cường miễn dịch, chống oxy hóa',
        price: 135000,
        originalPrice: 150000,
        discountPercent: 10,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Hộp',
        categorySlug: 'thuc-pham-chuc-nang',
        subCategorySlug: 'vitamin-khoang-chat',
      },
      {
        id: 'p6',
        name: 'Blackmores Multivitamin',
        description: 'Vitamin tổng hợp cho cả gia đình',
        price: 485000,
        image: '/api/placeholder/80/80',
        badge: 'New',
        unit: 'Chai',
        categorySlug: 'thuc-pham-chuc-nang',
        subCategorySlug: 'vitamin-khoang-chat',
      },
      {
        id: 'p7',
        name: "Nature's Way Vitamin D3",
        description: 'Bổ sung vitamin D cho xương khỏe',
        price: 285000,
        originalPrice: 320000,
        discountPercent: 11,
        image: '/api/placeholder/80/80',
        badge: 'Sale',
        unit: 'Chai',
        categorySlug: 'thuc-pham-chuc-nang',
        subCategorySlug: 'vitamin-khoang-chat',
      },
      {
        id: 'p8',
        name: 'Centrum Silver 50+',
        description: 'Vitamin tổng hợp cho người trên 50 tuổi',
        price: 650000,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Chai',
        categorySlug: 'thuc-pham-chuc-nang',
        subCategorySlug: 'vitamin-khoang-chat',
      },
    ],
    'thuoc-thuoc-ke-don': [
      {
        id: 'p9',
        name: 'Amoxicillin 500mg Hau Giang',
        description: 'Kháng sinh điều trị nhiễm khuẩn',
        price: 45000,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Hộp',
        categorySlug: 'thuoc',
        subCategorySlug: 'thuoc-ke-don',
      },
      {
        id: 'p10',
        name: 'Bisoprolol 5mg Boston',
        description: 'Điều trị tăng huyết áp',
        price: 89000,
        originalPrice: 105000,
        discountPercent: 15,
        image: '/api/placeholder/80/80',
        badge: 'Sale',
        unit: 'Hộp',
        categorySlug: 'thuoc',
        subCategorySlug: 'thuoc-ke-don',
      },
    ],
    'cham-soc-ca-nhan-cham-soc-toc': [
      {
        id: 'p11',
        name: 'Dầu gội Head & Shoulders',
        description: 'Trị gầu hiệu quả, tóc sạch mượt',
        price: 165000,
        originalPrice: 185000,
        discountPercent: 11,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Chai',
        categorySlug: 'cham-soc-ca-nhan',
        subCategorySlug: 'cham-soc-toc',
      },
      {
        id: 'p12',
        name: "Dầu xả L'Oreal Elseve",
        description: 'Phục hồi tóc hư tổn',
        price: 125000,
        image: '/api/placeholder/80/80',
        badge: 'New',
        unit: 'Chai',
        categorySlug: 'cham-soc-ca-nhan',
        subCategorySlug: 'cham-soc-toc',
      },
    ],
    'thiet-bi-y-te-may-do-huyet-ap': [
      {
        id: 'p13',
        name: 'Máy đo huyết áp Omron HEM-7120',
        description: 'Đo huyết áp tự động, chính xác',
        price: 1250000,
        originalPrice: 1450000,
        discountPercent: 14,
        image: '/api/placeholder/80/80',
        badge: 'Hot',
        unit: 'Máy',
        categorySlug: 'thiet-bi-y-te',
        subCategorySlug: 'may-do-huyet-ap',
      },
      {
        id: 'p14',
        name: 'Máy đo huyết áp Microlife A2 Basic',
        description: 'Công nghệ Thụy Sĩ, độ chính xác cao',
        price: 985000,
        image: '/api/placeholder/80/80',
        badge: 'New',
        unit: 'Máy',
        categorySlug: 'thiet-bi-y-te',
        subCategorySlug: 'may-do-huyet-ap',
      },
    ],
  }

  // Comment out the complex lookup for now
  // const key = `${categorySlug}-${subCategorySlug}`;
  // return products[key] || [];
}

export const getBrandsByCategory = (categorySlug: string) => {
  const brands: { [key: string]: { name: string; count: number }[] } = {
    'thuc-pham-chuc-nang': [
      { name: 'DHG Pharma', count: 156 },
      { name: 'Blackmores', count: 89 },
      { name: "Nature's Way", count: 67 },
      { name: 'Centrum', count: 45 },
      { name: 'Nordic Naturals', count: 34 },
      { name: 'Swisse', count: 56 },
    ],
    'duoc-my-pham': [
      { name: 'La Roche-Posay', count: 123 },
      { name: 'Vichy', count: 89 },
      { name: 'Eucerin', count: 67 },
      { name: 'CeraVe', count: 56 },
      { name: 'Avène', count: 45 },
      { name: 'Bioderma', count: 78 },
    ],
    thuoc: [
      { name: 'Teva', count: 234 },
      { name: 'Hau Giang', count: 189 },
      { name: 'Domesco', count: 156 },
      { name: 'Imexpharm', count: 123 },
      { name: 'Boston', count: 89 },
      { name: 'Agimexpharm', count: 67 },
    ],
    'cham-soc-ca-nhan': [
      { name: 'Unilever', count: 123 },
      { name: 'P&G', count: 89 },
      { name: "L'Oréal", count: 67 },
      { name: 'Johnson & Johnson', count: 56 },
      { name: 'Kao', count: 45 },
      { name: 'Beiersdorf', count: 34 },
    ],
    'thiet-bi-y-te': [
      { name: 'Omron', count: 89 },
      { name: 'Microlife', count: 67 },
      { name: 'Citizen', count: 45 },
      { name: 'Rossmax', count: 34 },
      { name: 'Yuwell', count: 56 },
      { name: 'Braun', count: 23 },
    ],
  }

  return brands[categorySlug] || []
}
