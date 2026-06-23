import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import {
  Plus,
  Minus,
  X,
  Edit,
  AlertTriangle,
  Shield,
  Package,
  Phone,
  MessageCircle,
  History,
  MapPin,
  Truck,
  CreditCard,
  FileText,
  Search,
  User,
  Building2,
  Sparkles,
  Loader2,
  Eye,
  CheckCircle,
  ChevronRight,
  Image as ImageIcon,
  Check,
  ChevronsUpDown,
  Info,
} from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '~/hooks/useDebounce'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { ProductSearchWidget } from '../products/ProductSearchWidget'
import { DrugInteractionChecker } from '../products/DrugInteractionChecker'
import { ProductNoteModal } from '../products/ProductNoteModal'
import { ProductDetailModal } from '../products/ProductDetailModal'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { toast } from 'sonner'
import { orderService, dashboardService, prescriptionService } from '~/services/pharmacist'
import { productService } from '~/services/productService'
import { searchService } from '~/services/searchService'
import { ghnService } from '~/services/ghnService'
import { recommendationService } from '~/services/recommendationService'
import type { RecommendedProduct } from '~/services/recommendationService'
import { patientService, type PatientMedicalInfo } from '~/services/pharmacist/patient.service'

interface Product {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  onSale?: boolean
  unit: string
  stock: number
  maxOrderQuantity?: number
  rating: number
  reviewCount?: number
  type: 'rx' | 'otc' | 'supplement' | 'cosmetic'
  brand: string
  barcode?: string
  sku?: string
  category?: { name: string }
  shortDescription?: string
  description?: string
  origin?: string
  packaging?: string
  expiryInfo?: string
  ingredients?: string | string[]
  uses?: string[]
  instructions?: string
  warnings?: string[]
  status?: 'active' | 'discontinued' | 'out_of_stock'
  requiresPrescription?: boolean
  tags?: string[]
}

interface OrderItem {
  id: string
  product: Product
  quantity: number
  unit?: string
  notes?: string
  warnings: string[]
}

interface CustomerInfo {
  phone: string
  name: string
  email: string
  tier: 'regular' | 'vip' | 'premium'
  totalPurchase: number
  prescriptionId?: string
}

const IN_STORE_PAYMENT_METHODS = [
  { id: 'cash', label: 'Tiền mặt', icon: CheckCircle },
  { id: 'credit_card_pos', label: 'Quẹt thẻ máy POS', icon: CreditCard },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: Building2 },
  { id: 'payos', label: 'Thanh toán qua PayOS', icon: CreditCard },
  { id: 'vnpay', label: 'Thanh toán qua VNPay', icon: CreditCard },
]

const DELIVERY_PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Package },
  { id: 'bank_transfer', label: 'Chuyển khoản trước', icon: Building2 },
  { id: 'payos', label: 'Thanh toán qua PayOS', icon: CreditCard },
  { id: 'vnpay', label: 'Thanh toán qua VNPay', icon: CreditCard },
]

export function CreateOrderPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Support both 'prescriptionId' and 'prescription' query params
  const prescriptionId = searchParams.get('prescriptionId') || searchParams.get('prescription')

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    phone: '',
    name: '',
    email: '',
    tier: 'regular',
    totalPurchase: 0,
  })
  const [searchPhone, setSearchPhone] = useState('')
  const [openCustomerDropdown, setOpenCustomerDropdown] = useState(false)
  const [patientMedicalInfo, setPatientMedicalInfo] = useState<PatientMedicalInfo | null>(null)
  const debouncedSearchPhone = useDebounce(searchPhone, 300)

  const { data: customerSearchResults = [], isFetching: isSearchingCustomer } = useQuery({
    queryKey: ['pharmacist', 'patients', 'search', debouncedSearchPhone],
    queryFn: () => dashboardService.searchPatient(debouncedSearchPhone),
    enabled: debouncedSearchPhone.length >= 3,
    staleTime: 30000,
  })

  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Fetch full product details by ID before opening modal
  const handleOpenDetail = async (basicProduct: Product) => {
    setIsLoadingDetail(true)
    try {
      const full = await productService.getProductById(basicProduct.id)
      if (full) {
        // Map full product to the Product interface
        const defaultVariant = (full as any).priceVariants?.find((v: any) => v.isDefault)
          || (full as any).priceVariants?.[0]
        setSelectedProduct({
          id: (full as any)._id || basicProduct.id,
          name: (full as any).name || basicProduct.name,
          image: (full as any).featuredImage || basicProduct.image,
          price: defaultVariant?.price ?? basicProduct.price,
          originalPrice: defaultVariant?.originalPrice,
          unit: defaultVariant?.unit || basicProduct.unit,
          stock: (full as any).stockQuantity ?? basicProduct.stock,
          rating: (full as any).rating || basicProduct.rating,
          type: (full as any).requiresPrescription ? 'rx' : 'otc',
          brand: (full as any).brand?.name || basicProduct.brand,
          sku: (full as any).sku,
          barcode: (full as any).barcode,
          category: (full as any).category ? { name: (full as any).category.name } : undefined,
          shortDescription: (full as any).shortDescription || (full as any).description,
          description: (full as any).description,
          origin: (full as any).origin,
          packaging: (full as any).packaging,
          ingredients: (full as any).ingredients,
          uses: (full as any).uses,
          instructions: (full as any).instructions,
          warnings: (full as any).warnings,
          tags: (full as any).tags,
          requiresPrescription: (full as any).requiresPrescription,
          status: (full as any).isActive === false ? 'discontinued' : 'active',
        } as Product)
      } else {
        setSelectedProduct(basicProduct)
      }
    } catch {
      setSelectedProduct(basicProduct)
    } finally {
      setIsLoadingDetail(false)
      setIsProductModalOpen(true)
    }
  }
  const [selectedDelivery, setSelectedDelivery] = useState('fast')
  const [selectedPayment, setSelectedPayment] = useState('cod')
  const [orderNotes, setOrderNotes] = useState('')
  const [pharmacistNotes, setPharmacistNotes] = useState('')
  const [showInteractionChecker, setShowInteractionChecker] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean
    itemId: string | null
    productName: string
    currentNote: string
  }>({
    isOpen: false,
    itemId: null,
    productName: '',
    currentNote: '',
  })
  const [orderType, setOrderType] = useState<'instore' | 'delivery'>('instore')

  // ML Pharmacist Suggestions state
  const [mlSuggestions, setMlSuggestions] = useState<RecommendedProduct[]>([])
  const [mlLoading, setMlLoading] = useState(false)

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    ward: '',
    district: '',
    province: '',
    provinceId: undefined as number | undefined,
    districtId: undefined as number | undefined,
    wardCode: undefined as string | undefined,
  })

  // GHN API logic
  interface GHNProvince {
    ProvinceID: number
    ProvinceName: string
  }
  interface GHNDistrict {
    DistrictID: number
    DistrictName: string
  }
  interface GHNWard {
    WardCode: string
    WardName: string
  }

  const [provinces, setProvinces] = useState<GHNProvince[]>([])
  const [districts, setDistricts] = useState<GHNDistrict[]>([])
  const [wards, setWards] = useState<GHNWard[]>([])
  const [ghnShippingOptions, setGhnShippingOptions] = useState<any[]>([])

  useEffect(() => {
    if (orderType === 'delivery') {
      ghnService
        .getProvinces()
        .then((data) => setProvinces(data || []))
        .catch(console.error)
    }
  }, [orderType])

  useEffect(() => {
    if (shippingAddress.provinceId && orderType === 'delivery') {
      ghnService
        .getDistricts(shippingAddress.provinceId)
        .then((data) => setDistricts(data || []))
        .catch(console.error)
    } else {
      setDistricts([])
      setGhnShippingOptions([])
    }
  }, [shippingAddress.provinceId, orderType])

  useEffect(() => {
    if (shippingAddress.districtId && orderType === 'delivery') {
      ghnService
        .getWards(shippingAddress.districtId)
        .then((data) => setWards(data || []))
        .catch(console.error)
    } else {
      setWards([])
      setGhnShippingOptions([])
    }
  }, [shippingAddress.districtId, orderType])

  useEffect(() => {
    if (shippingAddress.districtId && shippingAddress.wardCode && orderType === 'delivery') {
      const fetchShippingFee = async () => {
        try {
          const options = await ghnService.getShippingOptions({
            to_district_id: shippingAddress.districtId as number,
            to_ward_code: shippingAddress.wardCode as string,
            weight: 1000, // Estimated 1kg for typical pharmacy orders
          })
          if (options && options.length > 0) {
            const formattedOptions = options.map((opt) => ({
              id: String(opt.id),
              label: opt.name,
              time: opt.estimatedDays || 'Giao hàng GHN',
              price: opt.price,
              icon: Truck,
            }))
            setGhnShippingOptions(formattedOptions)
            // Auto Select earliest option
            if (formattedOptions[0]) setSelectedDelivery(formattedOptions[0].id)
          } else {
            setGhnShippingOptions([])
          }
        } catch (error) {
          console.error('Failed to get GHN shipping options', error)
        }
      }
      fetchShippingFee()
    }
  }, [shippingAddress.districtId, shippingAddress.wardCode, orderType])

  // Auto-resolve GHN IDs from string names if IDs are missing (useful for legacy data)
  useEffect(() => {
    if (!shippingAddress.provinceId && shippingAddress.province && provinces.length > 0) {
      const pName = shippingAddress.province.toLowerCase()
      const match = provinces.find(
        (p) =>
          p.ProvinceName.toLowerCase() === pName ||
          p.ProvinceName.toLowerCase().includes(pName) ||
          pName.includes(p.ProvinceName.toLowerCase()),
      )
      if (match) {
        setShippingAddress((prev) => ({ ...prev, provinceId: match.ProvinceID, province: match.ProvinceName }))
      }
    }
  }, [shippingAddress.province, shippingAddress.provinceId, provinces])

  useEffect(() => {
    if (!shippingAddress.districtId && shippingAddress.district && districts.length > 0) {
      const dName = shippingAddress.district.toLowerCase()
      const match = districts.find(
        (d) =>
          d.DistrictName.toLowerCase() === dName ||
          d.DistrictName.toLowerCase().includes(dName) ||
          dName.includes(d.DistrictName.toLowerCase()),
      )
      if (match) {
        setShippingAddress((prev) => ({ ...prev, districtId: match.DistrictID, district: match.DistrictName }))
      }
    }
  }, [shippingAddress.district, shippingAddress.districtId, districts])

  useEffect(() => {
    if (!shippingAddress.wardCode && shippingAddress.ward && wards.length > 0) {
      const wName = shippingAddress.ward.toLowerCase()
      const match = wards.find(
        (w) =>
          w.WardName.toLowerCase() === wName ||
          w.WardName.toLowerCase().includes(wName) ||
          wName.includes(w.WardName.toLowerCase()),
      )
      if (match) {
        setShippingAddress((prev) => ({ ...prev, wardCode: match.WardCode, ward: match.WardName }))
      }
    }
  }, [shippingAddress.ward, shippingAddress.wardCode, wards])

  // OCR & Prescription Image States
  const [sourcePrescription, setSourcePrescription] = useState<any>(null)
  const [ocrSuggestions, setOcrSuggestions] = useState<
    {
      medication: { productName?: string; name?: string; dosage: string; quantity: number }
      matches: Product[]
    }[]
  >([])
  const [isMatching, setIsMatching] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)

  // Fetch prescription data when creating order from prescription
  useEffect(() => {
    const fetchPrescriptionData = async () => {
      if (!prescriptionId) return

      try {
        setIsLoadingPrescription(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prescription = (await prescriptionService.getById(prescriptionId)) as any

        if (prescription) {
          setSourcePrescription(prescription)
          // Extract customer info from populated prescription
          const customer = prescription.customer

          if (customer) {
            const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()

            // Update customer info
            setCustomerInfo({
              phone: customer.phoneNumber || '',
              name: fullName,
              email: customer.email || '',
              tier: 'regular',
              totalPurchase: 0,
              prescriptionId: prescription._id || prescription.prescriptionNumber,
            })

            // Update search phone field
            if (customer.phoneNumber) {
              setSearchPhone(customer.phoneNumber)
            }

            // Get default address from customer's addresses array
            const addresses = customer.addresses || []
            const defaultAddress = addresses.find((addr: { isDefault?: boolean }) => addr.isDefault) || addresses[0]

            // Update shipping address with customer info and default address
            setShippingAddress({
              firstName: customer.firstName || '',
              lastName: customer.lastName || '',
              phone: defaultAddress?.phone || customer.phoneNumber || '',
              email: customer.email || '',
              address: defaultAddress?.address || '',
              ward: defaultAddress?.ward || '',
              district: defaultAddress?.district || '',
              province: defaultAddress?.province || '',
              provinceId: defaultAddress?.provinceId,
              districtId: defaultAddress?.districtId,
              wardCode: defaultAddress?.wardCode,
            })

            toast.success(`Đã tải thông tin khách hàng: ${fullName}`)
          } else {
            // No customer info in prescription, just set prescription ID
            setCustomerInfo((prev) => ({
              ...prev,
              prescriptionId: prescription._id || prescription.prescriptionNumber,
            }))
            toast.info('Đã tải đơn thuốc. Vui lòng nhập thông tin khách hàng.')
          }

          // Set pharmacist notes from prescription
          if (prescription.pharmacistNotes) {
            setPharmacistNotes(prescription.pharmacistNotes)
          }
          if (prescription.notes) {
            setOrderNotes(prescription.notes)
          }

          // Trigger Auto-mapping for OCR Medications
          if (prescription.medications && prescription.medications.length > 0) {
            setIsMatching(true)
            try {
              const results = await Promise.allSettled(
                prescription.medications.map(async (med: any) => {
                  const rawText = med.productName || med.name
                  if (!rawText) return { medication: med, matches: [] }

                  // ── Helper: clean dosage units (mg, ml...) from text ──
                  const stripDosageUnits = (text: string): string =>
                    text.replace(/\d+(\.\d+)?\s*(mg|g|ml|mcg|iu|%)/gi, '')

                  // ── Helper: clean brand name (also strips standalone numbers like "40", "200") ──
                  const buildBrandQuery = (text: string): string => {
                    const withoutDosage = stripDosageUnits(text)
                    // Remove standalone numbers (e.g. "YESOM 40" → "YESOM")
                    const withoutNumbers = withoutDosage.replace(/\b\d+\b/g, ' ')
                    const sanitized = withoutNumbers.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ')
                    return sanitized.trim().replace(/\s+/g, ' ').split(' ').slice(0, 3).join(' ')
                  }

                  // ── Helper: clean generic/active ingredient name ──
                  const buildGenericQuery = (text: string): string => {
                    const withoutDosage = stripDosageUnits(text)
                    const sanitized = withoutDosage.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ')
                    return sanitized.trim().replace(/\s+/g, ' ').split(' ').slice(0, 4).join(' ')
                  }

                  // ── Helper: search via Typesense and transform hits → Product[] ──
                  const typesenseSearch = async (q: string): Promise<Product[]> => {
                    if (!q || q.length < 2) return []
                    const result = await searchService.searchProducts({ q, limit: 5 })
                    return (result.hits || []).map((hit) => ({
                      id: hit.document.mongoId,
                      name: hit.document.name,
                      image: hit.document.featuredImage || '/images/product-placeholder.jpg',
                      price: hit.document.price || 0,
                      type: hit.document.requiresPrescription ? 'rx' : 'otc',
                      brand: hit.document.brandName || 'Unknown',
                      unit: 'Hộp',
                      stock: hit.document.inStock ? 999 : 0,
                      rating: hit.document.rating || 4.5,
                    } as Product))
                  }

                  // ── Extract brand (before parenthesis) and generic (inside parenthesis) ──
                  const brandPart = rawText.split(/[([,\-]/)[0].trim()
                  const brandQuery = buildBrandQuery(brandPart)

                  const parenMatch = rawText.match(/\(([^)]+)\)/)
                  const genericPart = parenMatch ? parenMatch[1].trim() : ''
                  const genericQuery = buildGenericQuery(genericPart)

                  // ── Strategy: prioritize generic (hoạt chất) → fallback to brand ──
                  // Generic name is far more reliable than brand (which may be foreign/unknown)
                  let finalMatches: Product[] = []

                  if (genericQuery) {
                    finalMatches = await typesenseSearch(genericQuery)
                  }

                  // Only use brand results if generic found nothing
                  if (finalMatches.length === 0 && brandQuery) {
                    finalMatches = await typesenseSearch(brandQuery)
                  }

                  if (finalMatches.length === 0) return { medication: med, matches: [] }

                  return {
                    medication: med,
                    matches: finalMatches.slice(0, 3),
                  }
                }),
              )

              // Collect both fulfilled and rejected (show empty for failed ones)
              const suggestions = results.map((result, idx) => {
                if (result.status === 'fulfilled') return result.value
                const med = prescription.medications[idx]
                return { medication: med, matches: [] }
              })

              setOcrSuggestions(suggestions)
              const matchedCount = suggestions.filter((s) => s.matches.length > 0).length
              toast.success(`AI đề xuất: ${matchedCount}/${suggestions.length} thuốc tìm thấy trong kho`)
            } catch (err) {
              console.error('Lỗi khi auto-map OCR:', err)
            } finally {
              setIsMatching(false)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching prescription:', error)
        toast.error('Không thể tải thông tin đơn thuốc')
      } finally {
        setIsLoadingPrescription(false)
      }
    }

    fetchPrescriptionData()
  }, [prescriptionId])

  const handleProductAdd = (product: Product, quantity: number) => {
    const existingItem = orderItems.find((item) => item.product.id === product.id)

    if (existingItem) {
      setOrderItems((items) =>
        items.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)),
      )
    } else {
      const newItem: OrderItem = {
        id: Math.random().toString(36).substr(2, 9),
        product,
        quantity,
        notes: '',
        warnings: product.type === 'rx' ? ['Cần theo dõi dị ứng'] : [],
      }
      setOrderItems((items) => [...items, newItem])
    }
    toast.success(`Đã thêm ${product.name} vào đơn hàng`)
  }

  const handleAddAllSuggestions = () => {
    let addedCount = 0
    const itemsToAdd: { product: Product; quantity: number }[] = []

    ocrSuggestions.forEach((suggestion) => {
      if (suggestion.matches && suggestion.matches.length > 0) {
        // Pick the best match (first one)
        const match = suggestion.matches[0]
        const qty = Number(suggestion.medication.quantity) || 1
        itemsToAdd.push({ product: match, quantity: qty })
        addedCount++
      }
    })

    if (addedCount === 0) {
      toast.info('Không có sản phẩm nào có thể thêm')
      return
    }

    setOrderItems((currentItems) => {
      const newItems = [...currentItems]

      itemsToAdd.forEach((itemToAdd) => {
        const existingIdx = newItems.findIndex((i) => i.product.id === itemToAdd.product.id)
        if (existingIdx >= 0) {
          newItems[existingIdx] = {
            ...newItems[existingIdx],
            quantity: newItems[existingIdx].quantity + itemToAdd.quantity,
          }
        } else {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            product: itemToAdd.product,
            quantity: itemToAdd.quantity,
            notes: '',
            warnings: itemToAdd.product.type === 'rx' ? ['Cần theo dõi dị ứng'] : [],
          })
        }
      })

      return newItems
    })

    toast.success(`Đã thêm ${addedCount} sản phẩm gợi ý vào đơn hàng`)
  }

  // Fetch ML pharmacist suggestions khi thêm/xóa sản phẩm
  useEffect(() => {
    if (orderItems.length === 0) {
      setMlSuggestions([])
      return
    }
    let cancelled = false
    const prescriptionProductIds = orderItems.map((item) => item.product.id)

    setMlLoading(true)
    recommendationService
      .getPharmacistSuggestions({
        prescriptionProductIds,
        chronicDiseases: patientMedicalInfo?.chronicDiseases ?? [],
        allergies: patientMedicalInfo?.allergies ?? [],
        currentMedications: patientMedicalInfo?.currentMedications?.map((medication) => medication.name) ?? [],
      }, 6)
      .then((res) => {
        if (!cancelled) {
          // Lọc bỏ sản phẩm đã có trong đơn
          const filtered = res.products.filter(
            (p) => !orderItems.some((item) => item.product.id === p._id),
          )
          setMlSuggestions(filtered)
        }
      })
      .finally(() => {
        if (!cancelled) setMlLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderItems.map((i) => i.product.id).join(','), patientMedicalInfo])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProductInfo = (product: Product) => {
    // Handle product info display - TODO: implement product info modal
  }

  const handleSelectCustomer = (patient: any) => {
    const nameParts = patient.fullName.split(' ')
    const lastName = nameParts.pop() || ''
    const firstName = nameParts.join(' ') || lastName
    const defaultAddress = patient.addresses?.find((addr: any) => addr.isDefault) || patient.addresses?.[0]

    setSearchPhone(patient.phoneNumber || '')
    setCustomerInfo((prev) => ({
      ...prev,
      phone: patient.phoneNumber,
      name: patient.fullName,
      email: patient.email || '',
    }))

    setShippingAddress((prev) => ({
      ...prev,
      firstName: firstName,
      lastName: lastName,
      phone: defaultAddress?.phone || patient.phoneNumber,
      email: patient.email || '',
      address: defaultAddress?.address || '',
      ward: defaultAddress?.ward || '',
      district: defaultAddress?.district || '',
      province: defaultAddress?.province || '',
      provinceId: defaultAddress?.provinceId,
      districtId: defaultAddress?.districtId,
      wardCode: defaultAddress?.wardCode,
    }))

    setOpenCustomerDropdown(false)
    setPatientMedicalInfo(null)
    const patientId = patient.customerId || patient._id
    if (patientId) {
      patientService.getMedicalInfo(patientId).then(setPatientMedicalInfo).catch(() => setPatientMedicalInfo(null))
    }
    toast.success(`Đã chọn khách hàng: ${patient.fullName}`)
  }

  const handleClearCustomer = () => {
    setPatientMedicalInfo(null)
    setCustomerInfo((prev) => ({
      ...prev,
      phone: '',
      name: '',
      email: '',
    }))
    setSearchPhone('')
    // Keep shipping address intact except for the ones directly inferred from the cleared customer
    setShippingAddress((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    }))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems((items) => items.filter((item) => item.id !== itemId))
      return
    }

    setOrderItems((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setOrderItems((items) => items.map((item) => (item.id === itemId ? { ...item, notes } : item)))
  }

  const openNoteModal = (itemId: string, productName: string, currentNote: string) => {
    setNoteModalState({
      isOpen: true,
      itemId,
      productName,
      currentNote,
    })
  }

  const closeNoteModal = () => {
    setNoteModalState({
      isOpen: false,
      itemId: null,
      productName: '',
      currentNote: '',
    })
  }

  const saveNote = (note: string) => {
    if (noteModalState.itemId) {
      updateItemNotes(noteModalState.itemId, note)
    }
  }

  const removeItem = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId))
  }

  const checkDrugInteractions = () => {
    if (orderItems.length < 2) {
      toast.info('Cần ít nhất 2 sản phẩm để kiểm tra tương tác')
      return
    }
    setShowInteractionChecker(true)
  }

  const calculateSubtotal = () => {
    try {
      return orderItems.reduce((sum, item) => {
        const price = item.product?.price || 0
        const quantity = item.quantity || 0
        return sum + price * quantity
      }, 0)
    } catch {
      return 0
    }
  }

  const calculateDiscount = () => {
    return customerInfo?.tier === 'vip' ? 5000 : 0
  }

  const calculateDeliveryFee = () => {
    if (orderType === 'instore') return 0
    try {
      const option = ghnShippingOptions.find((opt) => opt.id === selectedDelivery)
      return option?.price || 0
    } catch {
      return 0
    }
  }

  const calculateTotal = () => {
    try {
      return calculateSubtotal() - calculateDiscount() + calculateDeliveryFee()
    } catch {
      return 0
    }
  }

  const handleCreateOrder = async () => {
    // Validation
    if (orderItems.length === 0) {
      toast.error('Vui lòng thêm sản phẩm vào đơn hàng')
      return
    }

    if (orderType === 'delivery') {
      if (
        !shippingAddress.address ||
        !shippingAddress.wardCode ||
        !shippingAddress.districtId ||
        !shippingAddress.provinceId
      ) {
        toast.error('Vui lòng nhập đầy đủ địa chỉ giao hàng GHN')
        return
      }

      if (!shippingAddress.firstName || !shippingAddress.lastName) {
        toast.error('Vui lòng nhập tên người nhận')
        return
      }

      if (!customerInfo.phone && !shippingAddress.phone) {
        toast.error('Vui lòng nhập số điện thoại người nhận')
        return
      }
    }

    try {
      setIsCreatingOrder(true)

      // Prepare order data
      const orderData = {
        customerId: customerInfo.phone || undefined, // Using phone as customerId for now
        prescriptionId: prescriptionId || undefined,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || undefined,
        })),
        shippingAddress:
          orderType === 'delivery'
            ? {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                phone: shippingAddress.phone || customerInfo.phone,
                email: shippingAddress.email || customerInfo.email,
                address: shippingAddress.address,
                ward: shippingAddress.ward,
                district: shippingAddress.district,
                province: shippingAddress.province,
                districtId: shippingAddress.districtId,
                wardCode: shippingAddress.wardCode,
              }
            : {
                firstName: customerInfo.name ? customerInfo.name.split(' ')[0] : 'Khách',
                lastName: customerInfo.name ? customerInfo.name.split(' ').slice(1).join(' ') : 'vãng lai',
                phone: customerInfo.phone || '0000000000',
                email: '',
                address: 'Tại quầy',
                ward: '',
                district: '',
                province: '',
              },
        deliveryMethod: orderType === 'instore' ? 'instore' : selectedDelivery,
        paymentMethod: selectedPayment,
        shippingFee: calculateDeliveryFee(),
        orderNotes: orderNotes || undefined,
        pharmacistNotes: pharmacistNotes || undefined,
      }

      // Call API to create order
      const response = await orderService.createOrder(orderData)

      toast.success(`Đã tạo đơn hàng #${response.orderNumber} thành công!`, {
        description: `Mã đơn hàng: ${response.orderId}`,
        duration: 3000,
      })

      // Reset form
      setOrderItems([])
      setOrderNotes('')
      setPharmacistNotes('')
      setSearchPhone('')
      setCustomerInfo({
        phone: '',
        name: '',
        email: '',
        tier: 'regular',
        totalPurchase: 0,
      })
      setShippingAddress({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        ward: '',
        district: '',
        province: '',
        provinceId: undefined,
        districtId: undefined,
        wardCode: undefined,
      })

      // Redirect to order list
      navigate('/pharmacist/orders')
    } catch (error) {
      toast.error('Không thể tạo đơn hàng', {
        description: 'Vui lòng kiểm tra lại thông tin và thử lại',
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Product Detail Modal for OCR suggestions */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null) }}
        onAddToCart={(product, qty) => { handleProductAdd(product, qty); setIsProductModalOpen(false) }}
      />
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
            }}
          >
            Tạo đơn hàng
          </h1>
          <p className='text-gray-600'>Tạo và quản lý đơn hàng cho khách hàng</p>
        </div>
        {prescriptionId && sourcePrescription && (
          <div className='flex items-center gap-3'>
            <Badge variant='outline' className='border-[#BFDBFE] text-[#0A2463] py-1.5'>
              <FileText className='w-3 h-3 mr-1' />
              Từ đơn thuốc #{sourcePrescription?.prescriptionNumber || prescriptionId}
            </Badge>
            {sourcePrescription.images && sourcePrescription.images.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsPrescriptionModalOpen(true)}
                className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
              >
                <Eye className='w-4 h-4 mr-2' />
                Xem ảnh đơn thuốc gốc
              </Button>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT COLUMN - Product Search & Cart */}
        <div className='lg:col-span-2 space-y-6'>
          {/* OCR Auto-Mapping Suggestions */}
          {ocrSuggestions.length > 0 && (
            <Card className='bg-gradient-to-br from-[#F8FAFB] to-white shadow-md rounded-2xl border border-[#E8EDF5] overflow-hidden'>
              <div className='bg-[#0A2463] px-4 py-2 text-white flex justify-between items-center'>
                <h3 className='font-medium text-sm flex items-center'>
                  <Sparkles className='w-4 h-4 mr-2 text-[#BFDBFE]' />
                  🤖 Robot AI Gợi ý Thuốc từ Đơn OCR
                </h3>
                {ocrSuggestions.some((s) => s.matches.length > 0) && (
                  <Button
                    size='sm'
                    onClick={handleAddAllSuggestions}
                    className='h-7 px-2.5 bg-white/20 hover:bg-white/30 text-white text-xs border-0 transition-colors'
                  >
                    <Plus className='w-3 h-3 mr-1' />
                    Thêm tất cả ({ocrSuggestions.filter((s) => s.matches.length > 0).length})
                  </Button>
                )}
              </div>
              <CardContent className='p-4 space-y-3 max-h-80 overflow-y-auto'>
                {ocrSuggestions.map((suggestion, idx) => (
                  <div key={idx} className='p-3 bg-white border border-[#E8EDF5] rounded-xl shadow-sm'>
                    {/* Medication header */}
                    <div className='flex items-center gap-2 mb-3'>
                      <Badge variant='outline' className='bg-[#F0F6FF] border-[#BFDBFE] text-[#1E40AF] text-xs'>
                        Đơn thuốc: {suggestion.medication.productName || suggestion.medication.name || 'Thuốc ' + (idx + 1)}
                      </Badge>
                      {suggestion.medication.quantity > 0 && (
                        <span className='text-xs text-gray-500 flex items-center gap-1'>
                          <ChevronRight className='w-3 h-3' />
                          SL: {suggestion.medication.quantity}
                        </span>
                      )}
                    </div>

                    {suggestion.matches.length > 0 ? (
                      <div className='space-y-2'>
                        {suggestion.matches.map((match) => (
                          <div
                            key={match.id}
                            className='flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#BFDBFE] hover:bg-[#F0F6FF]/30 transition-all group'
                          >
                            {/* Product image */}
                            <ImageWithFallback
                              src={match.image}
                              alt={match.name}
                              className='w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0 bg-gray-50'
                            />

                            {/* Product info */}
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900 line-clamp-2 leading-snug'>{match.name}</p>
                              <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1'>
                                <span className='text-xs font-semibold text-[#1E40AF]'>
                                  {match.price > 0 ? `${match.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                                </span>
                                <span className='text-xs text-gray-400'>•</span>
                                <span className='text-xs text-gray-500'>{match.unit}</span>
                              </div>
                              <div className='flex items-center gap-2 mt-1 flex-wrap'>
                                {match.stock > 0 && (
                                  <span className='text-[11px] text-gray-500'>
                                    Tồn: <span className='font-medium text-gray-700'>{match.stock.toLocaleString()}</span>
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                    match.type === 'rx'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {match.type === 'rx' ? 'Rx' : 'OTC'}
                                </span>
                                {match.rating > 0 && (
                                  <span className='text-[11px] text-amber-500 flex items-center gap-0.5'>
                                    ★ {match.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className='flex flex-col gap-1.5 flex-shrink-0'>
                              <Button
                                size='sm'
                                onClick={() => handleProductAdd(match, Number(suggestion.medication.quantity) || 1)}
                                className='h-8 px-3 bg-[#0A2463] hover:bg-[#071A49] text-white text-xs'
                              >
                                <Plus className='w-3 h-3 mr-1' /> Thêm
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                disabled={isLoadingDetail}
                                onClick={() => handleOpenDetail(match)}
                                className='h-8 px-3 border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF] text-xs'
                              >
                                {isLoadingDetail ? (
                                  <Loader2 className='w-3 h-3 mr-1 animate-spin' />
                                ) : (
                                  <Info className='w-3 h-3 mr-1' />
                                )}
                                Chi tiết
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='pl-4 py-2 border-l-2 border-orange-100 mt-2'>
                        <p className='text-xs text-orange-600 flex items-center mb-1'>
                          <AlertTriangle className='w-3 h-3 mr-1' /> Không tìm thấy tên thuốc này trong kho dữ liệu.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Product Search */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <Search className='w-5 h-5 mr-2' />
                Tìm kiếm sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearchWidget onProductAdd={handleProductAdd} onProductInfo={handleProductInfo} />
            </CardContent>
          </Card>

          {/* 💡 ML Pharmacist Suggestions — hiển thị khi có sản phẩm trong đơn */}
          {(mlLoading || mlSuggestions.length > 0) && (
            <Card className='bg-gradient-to-br from-[#F8FAFB] to-white shadow-md rounded-2xl border border-[#E8EDF5] overflow-hidden'>
              <div className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] px-4 py-2.5 text-white flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-[#BFDBFE]' />
                <span className='font-medium text-sm'>💡 ML Gợi Ý Dược Sĩ</span>
                <span className='text-xs text-[#BFDBFE] ml-1'>Dựa trên các thuốc trong đơn</span>
              </div>
              <CardContent className='p-4'>
                <Alert className='mb-3 border-amber-200 bg-amber-50'>
                  <AlertTriangle className='h-4 w-4 text-amber-600' />
                  <AlertDescription className='text-xs text-amber-800'>
                    Gợi ý ML chỉ hỗ trợ tham khảo. Dược sĩ phải kiểm tra tương tác thuốc, chống chỉ định và liều dùng trước khi thêm vào đơn.
                  </AlertDescription>
                </Alert>
                {mlLoading ? (
                  <div className='flex items-center gap-3 text-gray-500 text-sm py-2'>
                    <Loader2 className='w-4 h-4 animate-spin text-[#1E40AF]' />
                    Đang phân tích gợi ý...
                  </div>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {mlSuggestions.map((p) => {
                      const defaultVariant = p.priceVariants?.find((v) => v.isDefault) ?? p.priceVariants?.[0]
                      const price = defaultVariant?.price ?? 0
                      const unit = defaultVariant?.unit ?? 'Hộp'
                      return (
                        <div
                          key={p._id}
                          className='flex items-center gap-3 p-3 bg-white border border-[#E8EDF5] rounded-xl shadow-sm hover:border-[#BFDBFE] transition-all group'
                        >
                          {p.featuredImage ? (
                            <img
                              src={p.featuredImage}
                              alt={p.name}
                              className='w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100'
                            />
                          ) : (
                            <div className='w-12 h-12 rounded-lg bg-[#F0F6FF] flex items-center justify-center flex-shrink-0'>
                              <Package className='w-6 h-6 text-[#1E40AF]' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 line-clamp-2 leading-snug'>{p.name}</p>
                            <p className='text-xs text-[#1E40AF] font-semibold mt-0.5'>
                              {price.toLocaleString('vi-VN')}đ/{unit}
                            </p>
                          </div>
                          <button
                            disabled={p.requiresPrescription}
                            onClick={() => {
                              handleProductAdd(
                                {
                                  id: p._id,
                                  name: p.name,
                                  image: p.featuredImage ?? '/images/product-placeholder.jpg',
                                  price,
                                  unit,
                                  stock: p.stockQuantity,
                                  rating: p.rating ?? 0,
                                  type: p.requiresPrescription ? 'rx' : 'otc',
                                  brand: p.brand?.[0]?.name ?? '',
                                } as Product,
                                1,
                              )
                            }}
                            className='flex-shrink-0 w-8 h-8 rounded-full bg-[#E8EDF5] hover:bg-[#0A2463] text-[#1E40AF] hover:text-white transition-all flex items-center justify-center group-hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40'
                            title={p.requiresPrescription ? 'Thuốc kê đơn phải được chọn và rà soát thủ công' : 'Thêm vào đơn hàng'}
                          >
                            <Plus className='w-4 h-4' />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shopping Cart */}

          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center justify-between'>
                <div className='flex items-center'>
                  <h4 className='font-medium text-blue-900 flex items-center gap-2'>
                    <Package className='w-5 h-5 mr-2' />
                    GIỎ HÀNG
                  </h4>
                  {orderItems.length > 0 && (
                    <Badge className='ml-2 bg-[#0A2463] text-white'>{orderItems.length} sản phẩm</Badge>
                  )}
                </div>
                {orderItems.length > 1 && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={checkDrugInteractions}
                    className='border-amber-300 text-amber-700 hover:bg-amber-50'
                  >
                    <Shield className='w-4 h-4 mr-1' />
                    Kiểm tra tương tác
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className='text-center py-12 text-gray-500'>
                  <Package className='w-16 h-16 mx-auto mb-3 text-gray-300' />
                  <p>Chưa có sản phẩm nào trong giỏ hàng</p>
                  <p className='text-sm mt-1'>Sử dụng thanh tìm kiếm phía trên để thêm sản phẩm</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {orderItems.map((item) => (
                    <Card key={item.id} className='p-4 border border-gray-200 hover:border-[#BFDBFE] transition-colors'>
                      <div className='flex gap-4'>
                        {/* Product Image */}
                        <ImageWithFallback
                          src={item.product.image}
                          alt={item.product.name}
                          className='w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0'
                        />

                        {/* Product Info */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-gray-900 line-clamp-1 mb-1'>{item.product.name}</h4>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <span className='text-[#1E40AF] font-semibold'>
                                  {item.product.price.toLocaleString('vi-VN')}đ
                                </span>
                                <span className='text-xs text-gray-500'>/ {item.product.unit}</span>
                                {item.product.type === 'rx' && (
                                  <Badge variant='destructive' className='text-xs'>
                                    Kê đơn
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => removeItem(item.id)}
                              className='text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1'
                            >
                              <X className='w-4 h-4' />
                            </Button>
                          </div>

                          {/* Quantity Controls */}
                          <div className='flex items-center gap-3'>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className='h-8 w-8 p-0'
                              >
                                <Minus className='w-3 h-3' />
                              </Button>

                              <Input
                                type='number'
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                className='w-16 h-8 text-center border-[#BFDBFE] focus:border-[#1E40AF]'
                                min='0'
                              />

                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className='h-8 w-8 p-0'
                              >
                                <Plus className='w-3 h-3' />
                              </Button>
                            </div>

                            <div className='text-gray-900'>
                              = {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                            </div>

                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => openNoteModal(item.id, item.product.name, item.notes || '')}
                              className='ml-auto border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
                            >
                              <Edit className='w-3 h-3 mr-1' />
                              Ghi chú
                            </Button>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <Alert className='mt-3 border-[#BFDBFE] bg-[#F0F6FF]'>
                              <AlertDescription className='text-sm text-blue-900'>
                                <FileText className='w-3 h-3 inline mr-1' />
                                {item.notes}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Warnings */}
                          {item.warnings.length > 0 && (
                            <Alert className='mt-3 border-amber-200 bg-amber-50'>
                              <AlertDescription className='text-sm text-amber-900'>
                                <AlertTriangle className='w-3 h-3 inline mr-1' />
                                {item.warnings.join(', ')}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Order Summary */}
                  <Card className='p-4 bg-gradient-to-br from-blue-50 to-white border border-[#E8EDF5]'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Tạm tính:</span>
                        <span>{calculateSubtotal().toLocaleString('vi-VN')}đ</span>
                      </div>
                      {calculateDiscount() > 0 && (
                        <div className='flex justify-between text-sm text-green-600'>
                          <span>Chiết khấu dược sĩ:</span>
                          <span>-{calculateDiscount().toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Phí vận chuyển:</span>
                        <span>{calculateDeliveryFee().toLocaleString('vi-VN')}đ</span>
                      </div>
                      <Separator className='my-2' />
                      <div className='flex justify-between'>
                        <span className='text-gray-900'>Tổng cộng:</span>
                        <span className='text-[#1E40AF]'>{calculateTotal().toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </Card>

                  {/* Order Notes */}
                  <div>
                    <Label htmlFor='orderNotes' className='text-gray-900 mb-2 block text-sm'>
                      Ghi chú đơn hàng
                    </Label>
                    <Textarea
                      id='orderNotes'
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder='Thêm ghi chú về đơn hàng...'
                      className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm'
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Customer Info & Actions */}
        <div className='space-y-6'>
          <Tabs
            defaultValue='instore'
            value={orderType}
            onValueChange={(v) => {
              setOrderType(v as 'instore' | 'delivery')
              if (v === 'instore') {
                setSelectedPayment('cash')
              } else {
                setSelectedPayment('cod')
                if (ghnShippingOptions[0]) setSelectedDelivery(ghnShippingOptions[0].id)
              }
            }}
          >
            <TabsList className='grid grid-cols-2 w-full bg-[#F0F6FF] p-1 rounded-xl h-11 mb-4 border border-[#E8EDF5]'>
              <TabsTrigger
                value='instore'
                className='rounded-lg data-[state=active]:!bg-white data-[state=active]:text-[#0A2463] data-[state=active]:!shadow-sm data-[state=inactive]:bg-transparent text-gray-500 font-medium transition-all text-sm !border-none !outline-none'
              >
                Tại quầy
              </TabsTrigger>
              <TabsTrigger
                value='delivery'
                className='rounded-lg data-[state=active]:!bg-white data-[state=active]:text-[#0A2463] data-[state=active]:!shadow-sm data-[state=inactive]:bg-transparent text-gray-500 font-medium transition-all text-sm !border-none !outline-none'
              >
                Giao tận nơi
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Customer Info */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <User className='w-5 h-5 mr-2' />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!customerInfo.name ? (
                <Popover open={openCustomerDropdown} onOpenChange={setOpenCustomerDropdown}>
                  <PopoverAnchor asChild>
                    <div className='relative w-full focus:outline-none focus-visible:outline-none'>
                      <Input
                        placeholder='Nhập tên hoặc số điện thoại khách hàng...'
                        value={searchPhone}
                        onChange={(e) => {
                          setSearchPhone(e.target.value)
                          if (!openCustomerDropdown && e.target.value.trim().length >= 2) setOpenCustomerDropdown(true)
                        }}
                        onFocus={(e) => {
                          if (e.target.value.trim().length >= 2) setOpenCustomerDropdown(true)
                        }}
                        className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] h-10 w-full pl-10'
                      />
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                      {isSearchingCustomer && (
                        <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin' />
                      )}
                    </div>
                  </PopoverAnchor>

                  {(isSearchingCustomer ||
                    customerSearchResults.length > 0 ||
                    (debouncedSearchPhone.length >= 3 && customerSearchResults.length === 0)) && (
                    <PopoverContent
                      className='p-0 border border-[#BFDBFE] shadow-xl overflow-hidden rounded-xl'
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                      align='start'
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandList>
                          {isSearchingCustomer && <CommandEmpty>Đang tìm kiếm...</CommandEmpty>}
                          {!isSearchingCustomer &&
                            customerSearchResults.length === 0 &&
                            debouncedSearchPhone.length >= 3 && (
                              <CommandEmpty>Không tìm thấy khách hàng nào</CommandEmpty>
                            )}
                          {!isSearchingCustomer && customerSearchResults.length > 0 && (
                            <CommandGroup heading='Kết quả tìm kiếm' className='p-0 text-sm'>
                              {customerSearchResults.map((patient) => (
                                <CommandItem
                                  key={patient.customerId || patient.phoneNumber}
                                  value={patient.phoneNumber}
                                  onSelect={() => handleSelectCustomer(patient)}
                                  className='cursor-pointer flex items-center px-4 py-3 gap-3 border-b border-gray-100 last:border-0 data-[selected=true]:bg-[#F0F6FF]/80 data-[selected=true]:text-blue-900 transition-all text-base'
                                >
                                  <div className='flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-[#0A2463] font-semibold shrink-0 shadow-sm'>
                                    {patient.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className='flex flex-col flex-1 min-w-0'>
                                    <span className='font-medium text-gray-900 truncate'>{patient.fullName}</span>
                                    <span className='text-xs text-gray-500 mt-0.5'>{patient.phoneNumber}</span>
                                  </div>
                                  {patient.email && (
                                    <span className='text-[10px] text-gray-400 truncate max-w-[80px] bg-gray-50 px-1.5 py-0.5 rounded'>
                                      {patient.email}
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>
              ) : (
                <div className='p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-[#BFDBFE] relative shadow-sm'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50'
                    onClick={handleClearCustomer}
                    title='Đổi khách hàng'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                  <div className='space-y-3 pr-6'>
                    <div>
                      <div className='text-gray-900 font-medium text-lg'>{customerInfo.name}</div>
                      <div className='text-sm text-gray-600 flex items-center gap-1 mt-0.5'>
                        <Phone className='w-3 h-3' />
                        {customerInfo.phone}
                        {customerInfo.email && ` • ${customerInfo.email}`}
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={customerInfo.tier === 'vip' ? 'default' : 'secondary'}
                        className={customerInfo.tier === 'vip' ? 'bg-[#0A2463] text-white' : ''}
                      >
                        Khách {customerInfo.tier.toUpperCase()}
                      </Badge>
                      <span className='text-xs text-gray-600'>
                        Đã mua: {customerInfo.totalPurchase.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {customerInfo.prescriptionId && (
                      <div className='text-xs text-[#1E40AF] flex items-center bg-[#F0F6FF] px-2 py-1 rounded overflow-hidden'>
                        <FileText className='w-3 h-3 mr-1 flex-shrink-0' />
                        <span className='truncate'>Đơn thuốc: #{customerInfo.prescriptionId}</span>
                      </div>
                    )}

                    <div className='flex gap-2 pt-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        title='Gọi cho khách hàng'
                        className='flex-1 h-8 border-[#E8EDF5] hover:bg-[#F0F6FF] text-[#0A2463]'
                      >
                        <Phone className='w-4 h-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        title='Chat với khách hàng'
                        className='flex-1 h-8 border-[#E8EDF5] hover:bg-[#F0F6FF] text-[#0A2463]'
                      >
                        <MessageCircle className='w-4 h-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        title='Lịch sử mua hàng'
                        className='flex-1 h-8 border-[#E8EDF5] hover:bg-[#F0F6FF] text-[#0A2463]'
                      >
                        <History className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center mb-0'>
                  <MapPin className='w-5 h-5 mr-2' />
                  Địa chỉ giao hàng (GHN)
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label htmlFor='firstName' className='text-xs text-gray-600 mb-1.5 block'>
                      Họ *
                    </Label>
                    <Input
                      id='firstName'
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder='Họ'
                      className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'
                    />
                  </div>
                  <div>
                    <Label htmlFor='lastName' className='text-xs text-gray-600 mb-1.5 block'>
                      Tên *
                    </Label>
                    <Input
                      id='lastName'
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder='Tên'
                      className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label htmlFor='phone' className='text-xs text-gray-600 mb-1.5 block'>
                      Số điện thoại *
                    </Label>
                    <Input
                      id='phone'
                      value={shippingAddress.phone || customerInfo.phone}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder='Số điện thoại'
                      className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'
                    />
                  </div>
                  <div>
                    <Label htmlFor='email' className='text-xs text-gray-600 mb-1.5 block'>
                      Email (Tuỳ chọn)
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={shippingAddress.email || customerInfo.email}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder='Email'
                      className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600 mb-1.5 block'>Tỉnh/Thành phố *</Label>
                    <Select
                      value={shippingAddress.provinceId ? shippingAddress.provinceId.toString() : ''}
                      onValueChange={(v) => {
                        const id = Number(v)
                        const name = provinces.find((p) => p.ProvinceID === id)?.ProvinceName || ''
                        setShippingAddress((p) => ({
                          ...p,
                          provinceId: id,
                          province: name,
                          districtId: undefined,
                          district: '',
                          wardCode: undefined,
                          ward: '',
                        }))
                      }}
                    >
                      <SelectTrigger className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'>
                        <SelectValue placeholder='Chọn Tỉnh/Thành phố' />
                      </SelectTrigger>
                      <SelectContent className='max-h-[250px]'>
                        {provinces.map((p) => (
                          <SelectItem key={p.ProvinceID} value={p.ProvinceID.toString()}>
                            {p.ProvinceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600 mb-1.5 block'>Quận/Huyện *</Label>
                    <Select
                      value={shippingAddress.districtId ? shippingAddress.districtId.toString() : ''}
                      onValueChange={(v) => {
                        const id = Number(v)
                        const name = districts.find((d) => d.DistrictID === id)?.DistrictName || ''
                        setShippingAddress((p) => ({
                          ...p,
                          districtId: id,
                          district: name,
                          wardCode: undefined,
                          ward: '',
                        }))
                      }}
                      disabled={!shippingAddress.provinceId}
                    >
                      <SelectTrigger className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'>
                        <SelectValue placeholder='Chọn Quận/Huyện' />
                      </SelectTrigger>
                      <SelectContent className='max-h-[250px]'>
                        {districts.map((d) => (
                          <SelectItem key={d.DistrictID} value={d.DistrictID.toString()}>
                            {d.DistrictName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600 mb-1.5 block'>Phường/Xã *</Label>
                    <Select
                      value={shippingAddress.wardCode || ''}
                      onValueChange={(v) => {
                        const name = wards.find((w) => w.WardCode === v)?.WardName || ''
                        setShippingAddress((p) => ({ ...p, wardCode: v, ward: name }))
                      }}
                      disabled={!shippingAddress.districtId}
                    >
                      <SelectTrigger className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'>
                        <SelectValue placeholder='Phường/Xã' />
                      </SelectTrigger>
                      <SelectContent className='max-h-[250px]'>
                        {wards.map((w) => (
                          <SelectItem key={w.WardCode} value={w.WardCode}>
                            {w.WardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor='address' className='text-xs text-gray-600 mb-1.5 block'>
                    Địa chỉ cụ thể *
                  </Label>
                  <Input
                    id='address'
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder='Số nhà, Tên đường'
                    className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm h-10'
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Method */}
          {orderType === 'delivery' && (
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center'>
                  <Truck className='w-5 h-5 mr-2' />
                  Giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {ghnShippingOptions.length === 0 ? (
                  <div className='p-4 text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg'>
                    Vui lòng điền đầy đủ Quận/Huyện và Phường/Xã để xem phí giao hàng
                  </div>
                ) : (
                  ghnShippingOptions.map((option) => {
                    const Icon = option.icon || Truck
                    return (
                      <div
                        key={option.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedDelivery === option.id
                            ? 'border-[#1E40AF] bg-[#F0F6FF]'
                            : 'border-gray-200 hover:border-[#BFDBFE]'
                        }`}
                        onClick={() => setSelectedDelivery(option.id)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <input
                              type='radio'
                              checked={selectedDelivery === option.id}
                              onChange={() => setSelectedDelivery(option.id)}
                              className='text-[#1E40AF]'
                            />
                            <Icon className='w-4 h-4 text-gray-600' />
                            <div>
                              <div className='text-sm text-gray-900'>{option.label}</div>
                              <div className='text-xs text-gray-500'>{option.time}</div>
                            </div>
                          </div>
                          <div className='text-sm text-gray-900 font-medium'>
                            {option.price === 0 ? 'Miễn phí' : `${option.price.toLocaleString('vi-VN')}đ`}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <CreditCard className='w-5 h-5 mr-2' />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {(orderType === 'instore' ? IN_STORE_PAYMENT_METHODS : DELIVERY_PAYMENT_METHODS).map((method) => {
                const Icon = method.icon
                return (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-[#1E40AF] bg-[#F0F6FF] ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-[#BFDBFE]'
                    }`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <div className='flex items-center gap-3'>
                      <input
                        type='radio'
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className='text-[#1E40AF] w-4 h-4'
                      />
                      <Icon className='w-4 h-4 text-gray-600' />
                      <span className='text-sm text-gray-900 font-medium'>{method.label}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Pharmacist Notes */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Ghi chú dược sĩ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                placeholder='- Hướng dẫn sử dụng&#10;- Lưu ý đặc biệt&#10;- Theo dõi tác dụng phụ&#10;- Cảnh báo tương tác thuốc&#10;- Chế độ ăn uống khi dùng thuốc'
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] text-sm'
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Button
              onClick={handleCreateOrder}
              className='w-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#1E40AF] shadow-lg'
              disabled={orderItems.length === 0 || isCreatingOrder}
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang tạo đơn hàng...
                </>
              ) : (
                <>
                  <Package className='w-4 h-4 mr-2' />
                  Tạo đơn hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Drug Interaction Checker Modal */}
      <DrugInteractionChecker
        drugs={orderItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          dosage: item.product.unit,
        }))}
        isOpen={showInteractionChecker}
        onClose={() => setShowInteractionChecker(false)}
      />

      {/* Product Note Modal */}
      <ProductNoteModal
        isOpen={noteModalState.isOpen}
        onClose={closeNoteModal}
        onSave={saveNote}
        productName={noteModalState.productName}
        initialNote={noteModalState.currentNote}
      />

      {/* Prescription Image Viewer Dialog */}
      <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
          <DialogHeader className='px-4 py-3 border-b border-black/5 bg-gray-50/50 relative'>
            <DialogTitle className='flex items-center text-lg text-blue-900'>
              <ImageIcon className='w-5 h-5 mr-2 text-[#1E40AF]' />
              Ảnh đơn thuốc gốc #{sourcePrescription?.prescriptionNumber || prescriptionId}
            </DialogTitle>
          </DialogHeader>
          <div className='flex-1 overflow-y-auto p-4 bg-gray-50/30'>
            {sourcePrescription?.images &&
              sourcePrescription.images.map((img: string, idx: number) => (
                <div key={idx} className='mb-4 last:mb-0 bg-white p-2 rounded-xl border border-black/5 shadow-sm'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Ảnh {idx + 1}</p>
                  <img
                    src={img}
                    alt={`Đơn thuốc ${idx + 1}`}
                    className='w-full object-contain rounded-lg'
                    style={{ maxHeight: '65vh' }}
                  />
                </div>
              ))}
          </div>
          <div className='p-3 border-t border-black/5 bg-white flex justify-end'>
            <Button variant='outline' onClick={() => setIsPrescriptionModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
