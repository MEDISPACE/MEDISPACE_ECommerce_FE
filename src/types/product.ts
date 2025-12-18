// ProductDetails interface for extended product information
export interface ProductDetails {
  _id?: string
  productId?: string
  activeIngredients?: string
  dosageForm?: string
  packSize?: string
  manufacturer?: string
  indications?: string
  dosageInstructions?: string
  storageInstructions?: string
  createdAt?: string
  updatedAt?: string
}

// ProductMedia interface for product images
export interface ProductMediaImage {
  url: string
  alt?: string
  type: 'main' | 'gallery'
  sortOrder: number
}

export interface ProductMedia {
  _id?: string
  productId?: string
  images?: ProductMediaImage[]
  createdAt?: string
  updatedAt?: string
}

// Main Product interface matching backend schema
export interface Product {
  _id: string // MongoDB ObjectId as string
  name: string
  slug: string
  sku: string
  barcode?: string

  // Basic Information
  shortDescription: string
  categoryId: string // ObjectId as string
  brandId?: string // ObjectId as string

  // Inventory Summary
  stockQuantity: number
  maxOrderQuantity: number

  // Product Status & Classification
  status: 'active' | 'discontinued' | 'out_of_stock'
  isActive: boolean
  requiresPrescription: boolean

  // Featured Media
  featuredImage?: string

  // Audit Information
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  createdBy: string // ObjectId as string
  lastModifiedBy?: string // ObjectId as string

  // Extended properties for UI (populated from references)
  category?: Category
  brand?: Brand
  details?: ProductDetails // From productDetails collection
  media?: ProductMedia // From productMedia collection

  // Legacy properties for backward compatibility
  id?: string // Alias for _id
  description?: string // Alias for shortDescription
  image?: string // Alias for featuredImage
  images?: string[]
  inStock?: boolean // Computed from stockQuantity > 0
  isPrescription?: boolean // Alias for requiresPrescription
  rating?: number
  reviewCount?: number
  price?: number
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  onSale?: boolean
  isOnSale?: boolean
  needsConsultation?: boolean
  origin?: string
  unit?: string
  packaging?: string
  expiryInfo?: string
  ingredients?: string[]
  uses?: string[]
  instructions?: string
  warnings?: string[]
  tags?: string[]
}


// Brand interface matching backend schema
export interface Brand {
  _id: string
  name: string
  slug: string
  logo?: string
  description?: string
  website?: string
  country?: string
  isActive: boolean
  productCount: number
  createdAt: string

  // Legacy properties
  id?: string // Alias for _id
}

// Category interface matching backend schema
export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  parentId?: string

  // Hierarchy Management
  level: number
  path: string
  productCount: number

  // Display Properties
  icon?: string
  thumbnailImage?: string
  sortOrder: number
  isActive: boolean

  // Timestamps
  createdAt: string
  updatedAt: string

  // Extended properties
  subcategories?: Category[]

  // Legacy properties
  id?: string // Alias for _id
  image?: string // Alias for thumbnailImage
}

export interface ProductFilter {
  categories?: string[]
  categoryId?: string
  brands?: string[]
  priceRange?: [number, number]
  rating?: number
  inStock?: boolean
  isPrescription?: boolean
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  selected: boolean
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  images?: string[]
  date: string
  helpful: number
}

export interface Address {
  id: string
  fullName: string
  phone: string
  email?: string
  address: string
  province: string
  district: string
  ward: string
  isDefault: boolean
}

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
}

export interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: string
  type: 'cod' | 'banking' | 'ewallet' | 'credit'
}

export interface PrescriptionUpload {
  id: string
  customerId: string
  productId?: string
  prescriptionImages: string[]
  patientName?: string
  contactPhone: string
  notes?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
  pharmacistId?: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderType: 'customer' | 'pharmacist'
  message: string
  images?: string[]
  timestamp: string
  isRead: boolean
}

export interface ChatSession {
  id: string
  customerId: string
  pharmacistId?: string
  productId?: string
  prescriptionId?: string
  status: 'active' | 'waiting' | 'completed'
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface PharmacistOrder {
  id: string
  customerId: string
  pharmacistId: string
  prescriptionId?: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  customerInfo: {
    name: string
    phone: string
    email?: string
  }
  shippingAddress: Address
  paymentMethod: string
  notes?: string
  subtotal: number
  shippingFee: number
  total: number
  status: 'created' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  createdAt: string
}
