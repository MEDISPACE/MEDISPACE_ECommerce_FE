import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Tag, Calendar, Percent, DollarSign, Users, Copy, CheckCircle,
  Loader2, AlertCircle, RefreshCw, X, Package, FolderTree,
  ShieldCheck, ShoppingBag, Hash
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../ui/alert-dialog'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { apiClient } from '../../services/apiClient'
import adminService from '../../services/adminService'
import productService from '../../services/productService'
import { PaginationComponent } from '../shared/PaginationComponent'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedUserSummary {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  missing?: boolean
}

interface SelectedProductSummary {
  _id: string
  id?: string
  name?: string
  sku?: string
  missing?: boolean
}

interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount: number
  maxDiscountAmount?: number
  totalUsageLimit: number
  currentUsageCount: number
  perUserLimit: number
  excludePrescriptionItems?: boolean
  isPublic?: boolean
  startDate: string
  endDate: string
  isActive: boolean
  applicableCategories?: string[]
  applicableProductIds?: string[]
  applicableCategoryIds?: string[]
  targetUserIds?: string[]
  targetUsers?: SelectedUserSummary[]
  applicableProducts?: SelectedProductSummary[]
  createdAt: string
}

interface CouponFormData {
  code: string
  name: string
  description: string
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount: number
  maxDiscountAmount: string
  totalUsageLimit: string
  perUserLimit: number
  excludePrescriptionItems: boolean
  isPublic: boolean
  targetUserIds: string[]
  applicableProductIds: string[]
  applicableCategoryIds: string[]
  startDate: string
  endDate: string
  isActive: boolean
}

const EMPTY_FORM: CouponFormData = {
  code: '', name: '', description: '',
  type: 'percentage', value: 10,
  minOrderAmount: 0, maxDiscountAmount: '', totalUsageLimit: '100',
  perUserLimit: 1, excludePrescriptionItems: false, isPublic: true,
  targetUserIds: [], applicableProductIds: [], applicableCategoryIds: [],
  startDate: new Date().toISOString().substring(0, 16),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 16),
  isActive: true
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 15

  // Dialog states
  const [showForm, setShowForm] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState<CouponFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userOptions, setUserOptions] = useState<any[]>([])
  const [selectedUsersById, setSelectedUsersById] = useState<Record<string, SelectedUserSummary>>({})
  const [knownUsersById, setKnownUsersById] = useState<Record<string, SelectedUserSummary>>({})
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<any[]>([])
  const [selectedProductsById, setSelectedProductsById] = useState<Record<string, SelectedProductSummary>>({})
  const [knownProductsById, setKnownProductsById] = useState<Record<string, SelectedProductSummary>>({})
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<any[]>([])

  const fetchCoupons = async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { isActive: (filterStatus === 'active').toString() })
      })
      const res = await apiClient.get<any>(`/coupons?${params}`)
      const fetchedCoupons = (res.data.result.coupons || []) as Coupon[]
      setCoupons(fetchedCoupons)
      setKnownUsersById(prev =>
        fetchedCoupons
          .flatMap((coupon: Coupon) => coupon.targetUsers || [])
          .reduce((acc: Record<string, SelectedUserSummary>, user: SelectedUserSummary) => {
            const id = user._id?.toString()
            if (id && (!user.missing || !acc[id])) acc[id] = user
            return acc
          }, { ...prev })
      )
      setKnownProductsById(prev =>
        fetchedCoupons
          .flatMap((coupon: Coupon) => coupon.applicableProducts || [])
          .reduce((acc: Record<string, SelectedProductSummary>, product: SelectedProductSummary) => {
            const id = (product._id || product.id || '').toString()
            if (id && (!product.missing || !acc[id])) acc[id] = product
            return acc
          }, { ...prev })
      )
      setTotal(res.data.result.pagination?.total || 0)
    } catch {
      setError('Không thể tải danh sách coupon')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [page, filterStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchCoupons() }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const openCreate = () => {
    setEditCoupon(null)
    setFormData({ ...EMPTY_FORM, code: generateCode() })
    setUserSearch('')
    setUserOptions([])
    setSelectedUsersById({})
    setProductSearch('')
    setProductOptions([])
    setSelectedProductsById({})
    setFormError('')
    setShowForm(true)
    loadCategoryOptions()
  }

  const openEdit = (c: Coupon) => {
    const targetUserIds = (c.targetUserIds || []).map((id: any) => id.toString())
    setEditCoupon(c)
    setFormData({
      code: c.code, name: c.name, description: c.description || '',
      type: c.type === 'fixed_amount' ? 'fixed' : c.type, value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount?.toString() || '',
      totalUsageLimit: c.totalUsageLimit?.toString() || '',
      perUserLimit: c.perUserLimit || 1,
      excludePrescriptionItems: c.excludePrescriptionItems || false,
      isPublic: c.isPublic !== false,
      targetUserIds,
      applicableProductIds: (c.applicableProductIds || []).map((id: any) => id.toString()),
      applicableCategoryIds: (c.applicableCategoryIds || c.applicableCategories || []).map((id: any) => id.toString()),
      startDate: c.startDate.substring(0, 16),
      endDate: c.endDate.substring(0, 16),
      isActive: c.isActive
    })
    setUserSearch('')
    setUserOptions([])
    setSelectedUsersById(
      (c.targetUsers || []).reduce<Record<string, SelectedUserSummary>>((acc, user) => {
        const id = user._id.toString()
        if (!user.missing || !acc[id]) acc[id] = user
        return acc
      }, { ...knownUsersById })
    )
    setProductSearch('')
    setProductOptions([])
    setSelectedProductsById(
      (c.applicableProducts || []).reduce<Record<string, SelectedProductSummary>>((acc, product) => {
        const id = (product._id || product.id || '').toString()
        if (id && (!product.missing || !acc[id])) acc[id] = product
        return acc
      }, { ...knownProductsById })
    )
    setFormError('')
    setShowForm(true)
    loadCategoryOptions()
    hydrateUsersByIds(targetUserIds)
  }

  const flattenCategories = (items: any[], depth = 0): any[] =>
    items.flatMap((item) => [
      { ...item, depth },
      ...flattenCategories(item.children || [], depth + 1)
    ])

  const loadCategoryOptions = async () => {
    if (categoryOptions.length > 0) return
    try {
      const tree = await adminService.getCategoryTree()
      setCategoryOptions(flattenCategories(tree || []))
    } catch {
      // non-critical; coupon can still be saved without category targeting
    }
  }

  const searchUsers = async (term = userSearch) => {
    const keyword = term.trim()
    if (keyword.length < 2) {
      setUserOptions([])
      return
    }
    setIsSearchingUsers(true)
    try {
      const res: any = await adminService.getAllUsers({ page: 1, limit: 8, role: '0', search: keyword } as any)
      const users = (res.result?.users || res.users || []) as SelectedUserSummary[]
      setUserOptions(users)
      setKnownUsersById(prev => users.reduce((acc, user) => {
        if (!user.missing || !acc[user._id]) acc[user._id] = user
        return acc
      }, { ...prev }))
    } catch {
      setUserOptions([])
    } finally {
      setIsSearchingUsers(false)
    }
  }

  const searchProducts = async (term = productSearch) => {
    const keyword = term.trim()
    if (keyword.length < 2) {
      setProductOptions([])
      return
    }
    setIsSearchingProducts(true)
    try {
      const products = await productService.getProducts({ search: keyword, limit: 8, bypassTypesense: 'true' } as any)
      const productList = products || []
      setProductOptions(productList)
      setKnownProductsById(prev => productList.reduce<Record<string, SelectedProductSummary>>((acc, product: SelectedProductSummary) => {
        const id = (product._id || product.id || '').toString()
        if (id && (!product.missing || !acc[id])) acc[id] = product
        return acc
      }, { ...prev }))
    } catch {
      setProductOptions([])
    } finally {
      setIsSearchingProducts(false)
    }
  }

  const hydrateUsersByIds = async (ids: string[]) => {
    const missingIds = ids.filter(id => !knownUsersById[id] || knownUsersById[id]?.missing)
    if (missingIds.length === 0) return

    const users = await Promise.all(
      missingIds.map(async id => {
        try {
          const res: any = await adminService.getAllUsers({ page: 1, limit: 1, role: '0', search: id } as any)
          return (res.result?.users || res.users || [])[0] as SelectedUserSummary | undefined
        } catch {
          return undefined
        }
      })
    )

    const foundUsers = users.filter(Boolean) as SelectedUserSummary[]
    if (foundUsers.length === 0) return

    setKnownUsersById(prev => foundUsers.reduce((acc, user) => {
      acc[user._id] = user
      return acc
    }, { ...prev }))
    setSelectedUsersById(prev => foundUsers.reduce((acc, user) => {
      acc[user._id] = user
      return acc
    }, { ...prev }))
  }

  useEffect(() => {
    const timer = window.setTimeout(() => searchUsers(userSearch), 350)
    return () => window.clearTimeout(timer)
  }, [userSearch])

  useEffect(() => {
    const timer = window.setTimeout(() => searchProducts(productSearch), 350)
    return () => window.clearTimeout(timer)
  }, [productSearch])

  const addUniqueId = (field: 'targetUserIds' | 'applicableProductIds' | 'applicableCategoryIds', id: string) => {
    setFormData(f => f[field].includes(id) ? f : { ...f, [field]: [...f[field], id] })
  }

  const addTargetUser = (user: SelectedUserSummary) => {
    addUniqueId('targetUserIds', user._id)
    setSelectedUsersById(prev => ({ ...prev, [user._id]: user }))
    setKnownUsersById(prev => ({ ...prev, [user._id]: user }))
    setUserSearch('')
    setUserOptions([])
  }

  const addApplicableProduct = (product: SelectedProductSummary) => {
    const id = (product._id || product.id || '').toString()
    if (!id) return
    addUniqueId('applicableProductIds', id)
    setSelectedProductsById(prev => ({ ...prev, [id]: product }))
    setKnownProductsById(prev => ({ ...prev, [id]: product }))
    setProductSearch('')
    setProductOptions([])
  }

  const removeId = (field: 'targetUserIds' | 'applicableProductIds' | 'applicableCategoryIds', id: string) => {
    setFormData(f => ({ ...f, [field]: f[field].filter(existing => existing !== id) }))
    if (field === 'targetUserIds') {
      setSelectedUsersById(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
    if (field === 'applicableProductIds') {
      setSelectedProductsById(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      setFormError('Vui lòng điền mã và tên coupon')
      return
    }
    if (formData.type === 'percentage' && (formData.value <= 0 || formData.value > 100)) {
      setFormError('Coupon phần trăm phải có giá trị từ 1 đến 100.')
      return
    }
    if (formData.type === 'fixed' && formData.value <= 0) {
      setFormError('Coupon giảm tiền cố định phải lớn hơn 0đ.')
      return
    }
    if (formData.minOrderAmount < 0 || formData.perUserLimit < 1) {
      setFormError('Điều kiện đơn hàng và lượt dùng phải hợp lệ.')
      return
    }
    if (formData.totalUsageLimit && Number(formData.totalUsageLimit) < 1) {
      setFormError('Tổng lượt dùng phải lớn hơn 0 hoặc để trống nếu không giới hạn.')
      return
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError('Ngày kết thúc phải sau ngày bắt đầu.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...formData,
        value: formData.type === 'free_shipping' ? 0 : formData.value,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : undefined,
        maxDiscountAmount: formData.type === 'percentage' && formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined
      }
      if (editCoupon) {
        await apiClient.put(`/coupons/${editCoupon._id}`, payload)
      } else {
        await apiClient.post('/coupons', payload)
      }
      await fetchCoupons()
      setShowForm(false)
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formWarnings = [
    formData.type === 'free_shipping' && formData.minOrderAmount === 0
      ? 'Freeship đang không có giá trị đơn tối thiểu. Nên đặt ngưỡng để tránh miễn phí vận chuyển cho đơn quá nhỏ.'
      : '',
    formData.type === 'fixed' && formData.minOrderAmount > 0 && formData.value > formData.minOrderAmount
      ? 'Số tiền giảm đang lớn hơn giá trị đơn tối thiểu. Hãy kiểm tra lại để tránh đơn vừa đủ điều kiện được giảm quá sâu.'
      : '',
    formData.isPublic === false && formData.targetUserIds.length === 0
      ? 'Mã đang bị ẩn và chưa gán khách hàng. Khách sẽ chỉ dùng được nếu biết code để nhập thủ công.'
      : '',
    formData.targetUserIds.some(id => !selectedUsersById[id] || selectedUsersById[id]?.missing)
      ? 'Có khách hàng đã gán nhưng chưa tải được thông tin tên/email. Hãy tìm và chọn lại khách đúng nếu cần.'
      : '',
    formData.applicableProductIds.some(id => !selectedProductsById[id] || selectedProductsById[id]?.missing)
      ? 'Có sản phẩm đã gán nhưng chưa tải được thông tin tên/SKU. Hãy tìm và chọn lại sản phẩm đúng nếu cần.'
      : ''
  ].filter(Boolean)

  const handleToggle = async (c: Coupon) => {
    try {
      await apiClient.patch(`/coupons/${c._id}/toggle`)
      fetchCoupons()
    } catch { }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiClient.delete(`/coupons/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchCoupons()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa coupon')
      setDeleteTarget(null)
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN')

  const totalPages = Math.ceil(total / LIMIT)

  const TYPE_LABELS: Record<string, string> = { percentage: 'Phần trăm', fixed: 'Cố định', fixed_amount: 'Cố định', free_shipping: 'Freeship' }
  const TYPE_COLORS: Record<string, string> = {
    percentage: 'bg-[#E8EDF5] text-[#0A2463]',
    fixed: 'bg-green-100 text-green-700',
    fixed_amount: 'bg-green-100 text-green-700',
    free_shipping: 'bg-[#E8EDF5] text-[#1E40AF]'
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isNotStarted = (startDate: string) => new Date(startDate) > new Date()
  const isExhausted = (c: Coupon) => Boolean(c.totalUsageLimit) && (c.currentUsageCount || 0) >= c.totalUsageLimit
  const getTargetCount = (couponOrForm: Pick<Coupon, 'targetUserIds' | 'isPublic'> | Pick<CouponFormData, 'targetUserIds' | 'isPublic'>) =>
    couponOrForm.targetUserIds?.length || 0

  const getDistributionInfo = (couponOrForm: Pick<Coupon, 'targetUserIds' | 'isPublic'> | Pick<CouponFormData, 'targetUserIds' | 'isPublic'>) => {
    const targetCount = getTargetCount(couponOrForm)
    if (couponOrForm.isPublic === false && targetCount > 0) {
      return {
        label: `Gán riêng ${targetCount} khách`,
        description: 'Chỉ khách được chọn nhìn thấy mã trong checkout.',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      }
    }
    if (couponOrForm.isPublic === false) {
      return {
        label: 'Ẩn, nhập mã thủ công',
        description: 'Khách không thấy mã trong checkout; chỉ dùng khi biết code.',
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
      }
    }
    if (targetCount > 0) {
      return {
        label: `Công khai + gán ${targetCount} khách`,
        description: 'Mọi khách đều thấy mã; danh sách gán chỉ để quản trị/ghi nhớ.',
        className: 'bg-green-100 text-green-700 hover:bg-green-100'
      }
    }
    return {
      label: 'Công khai',
      description: 'Mọi khách đủ điều kiện có thể thấy mã trong checkout.',
      className: 'bg-green-100 text-green-700 hover:bg-green-100'
    }
  }

  const getDiscountPreview = () => {
    if (formData.type === 'free_shipping') return 'Miễn phí vận chuyển'
    if (formData.type === 'percentage') {
      const cappedBy = formData.maxDiscountAmount ? `, tối đa ${formatCurrency(Number(formData.maxDiscountAmount))}` : ''
      return `Giảm ${formData.value}%${cappedBy}`
    }
    return `Giảm ${formatCurrency(formData.value)}`
  }

  const getAudiencePreview = () => {
    if (formData.isPublic) return 'Tất cả khách đủ điều kiện'
    if (formData.targetUserIds.length > 0) return `${formData.targetUserIds.length} khách được gán`
    return 'Không tự hiển thị'
  }

  const getScopePreview = () => {
    const productCount = formData.applicableProductIds.length
    const categoryCount = formData.applicableCategoryIds.length
    if (productCount === 0 && categoryCount === 0) return 'Tất cả sản phẩm đủ điều kiện'
    return [
      productCount > 0 ? `${productCount} sản phẩm` : '',
      categoryCount > 0 ? `${categoryCount} danh mục` : ''
    ].filter(Boolean).join(', ')
  }

  const impactPreviewItems = [
    {
      icon: Users,
      label: 'Khách nhìn thấy',
      value: getAudiencePreview(),
      hint: formData.isPublic
        ? 'Mã có thể xuất hiện trong checkout và trang ưu đãi.'
        : formData.targetUserIds.length > 0
          ? 'Chỉ khách được gán nhìn thấy sau khi đăng nhập.'
          : 'Khách chỉ dùng được nếu biết code để nhập tay.'
    },
    {
      icon: Package,
      label: 'Phạm vi sản phẩm',
      value: getScopePreview(),
      hint: formData.applicableProductIds.length || formData.applicableCategoryIds.length
        ? 'Chỉ các sản phẩm hoặc danh mục đã chọn được tính giảm.'
        : 'Không khóa theo sản phẩm hoặc danh mục.'
    },
    {
      icon: ShieldCheck,
      label: 'Thuốc kê đơn',
      value: formData.excludePrescriptionItems ? 'Đã loại trừ' : 'Không loại trừ',
      hint: formData.excludePrescriptionItems
        ? 'BE sẽ chặn mã với đơn có sản phẩm cần đơn thuốc.'
        : 'Mã vẫn có thể áp dụng cho đơn có thuốc kê đơn nếu đủ điều kiện khác.'
    },
    {
      icon: ShoppingBag,
      label: 'Đơn tối thiểu',
      value: formData.minOrderAmount > 0 ? formatCurrency(formData.minOrderAmount) : 'Không yêu cầu',
      hint: 'Tính trên phần hàng hóa hợp lệ sau khi xét phạm vi áp dụng.'
    },
    {
      icon: Hash,
      label: 'Giới hạn lượt dùng',
      value: formData.totalUsageLimit && Number(formData.totalUsageLimit) > 0
        ? `${Number(formData.totalUsageLimit)} lượt tổng`
        : 'Không giới hạn tổng',
      hint: formData.perUserLimit > 0 ? `Tối đa ${formData.perUserLimit} lượt/khách.` : 'Không giới hạn theo từng khách.'
    }
  ]

  const getUserDisplayName = (id: string) => {
    const user = selectedUsersById[id] || userOptions.find((option: any) => option._id === id)
    if (user?.missing) return `Không tìm thấy khách ${id.slice(-6)}`
    const fullName = `${user?.lastName || ''} ${user?.firstName || ''}`.trim()
    return fullName || user?.email || user?.phoneNumber || `Chưa tải tên khách ${id.slice(-6)}`
  }

  const getProductDisplayName = (id: string) => {
    const product = selectedProductsById[id] || productOptions.find((option: any) => (option._id || option.id) === id)
    if (product?.missing) return `Không tìm thấy sản phẩm ${id.slice(-6)}`
    return product?.name || product?.sku || `Chưa tải tên sản phẩm ${id.slice(-6)}`
  }

  const getStatusBadge = (c: Coupon) => {
    if (!c.isActive) return <Badge className='bg-gray-100 text-gray-600 hover:bg-gray-100'>Tắt</Badge>
    if (isExhausted(c)) return <Badge className='bg-orange-100 text-orange-700 hover:bg-orange-100'>Hết lượt</Badge>
    if (isExpired(c.endDate)) return <Badge className='bg-red-100 text-red-600 hover:bg-red-100'>Hết hạn</Badge>
    if (isNotStarted(c.startDate)) return <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-100'>Chưa bắt đầu</Badge>
    return <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>Hoạt động</Badge>
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)` }}
          >
            Quản lý Coupon
          </h1>
          <p className='text-gray-600 mt-2 text-sm'>Tạo và quản lý các mã giảm giá cho khách hàng</p>
        </div>
        <Button
          onClick={openCreate}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] gap-2 text-white self-start sm:self-auto'
        >
          <Plus className='w-4 h-4' />
          Tạo coupon
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Tổng coupon', value: total, icon: <Tag className='w-5 h-5' />, color: 'text-[#1E40AF] bg-[#E8EDF5]' },
          { label: 'Đang hoạt động', value: coupons.filter(c => c.isActive && !isExpired(c.endDate) && !isExhausted(c)).length, icon: <CheckCircle className='w-5 h-5' />, color: 'text-green-600 bg-green-100' },
          { label: 'Đã dùng', value: coupons.reduce((s, c) => s + (c.currentUsageCount || 0), 0), icon: <Users className='w-5 h-5' />, color: 'text-[#1E40AF] bg-[#E8EDF5]' },
          { label: 'Hết hạn', value: coupons.filter(c => isExpired(c.endDate)).length, icon: <Calendar className='w-5 h-5' />, color: 'text-red-600 bg-red-100' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
              <CardContent className='p-4 flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className='text-xs text-gray-500'>{stat.label}</p>
                  <p className='text-xl font-bold text-gray-900'>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm mã coupon, tên...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='active'>Đang hoạt động</SelectItem>
              <SelectItem value='inactive'>Đã tắt</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' onClick={fetchCoupons} className='gap-2'>
            <RefreshCw className='w-4 h-4' />
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Tag className='w-5 h-5 text-[#1E40AF]' />
            Danh sách coupon ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center h-48 gap-3'>
              <Loader2 className='w-6 h-6 animate-spin text-[#1E40AF]' />
              <span className='text-gray-500'>Đang tải...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-48 gap-3 text-red-500'>
              <AlertCircle className='w-5 h-5' />
              {error}
            </div>
          ) : coupons.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <Tag className='w-12 h-12 mx-auto mb-3 opacity-30' />
              <p>Không có coupon nào</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='!border-b-2 border-[#BFDBFE] bg-[#F0F6FF] hover:bg-[#F0F6FF]'>
                    <TableHead>Mã / Tên</TableHead>
                    <TableHead>Loại / Giá trị</TableHead>
                    <TableHead>Thời hạn</TableHead>
                    <TableHead>Sử dụng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c, idx) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className='border-b-2 border-[#BFDBFE] hover:bg-[#F0F6FF]/30 transition-colors'
                    >
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <code className='bg-gray-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-gray-800'>
                            {c.code}
                          </code>
                          <button
                            onClick={() => copyCode(c.code, c._id)}
                            className='text-gray-400 hover:text-[#1E40AF] transition-colors'
                          >
                            {copiedId === c._id ? <CheckCircle className='w-3.5 h-3.5 text-green-500' /> : <Copy className='w-3.5 h-3.5' />}
                          </button>
                        </div>
                        <p className='text-xs text-gray-500 mt-0.5'>{c.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${TYPE_COLORS[c.type]} text-xs`}>{TYPE_LABELS[c.type]}</Badge>
                        <p className='text-xs mt-1 font-semibold'>
                          {c.type === 'percentage' ? `${c.value}%` : (c.type === 'fixed' || c.type === 'fixed_amount') ? formatCurrency(c.value) : 'Miễn phí ship'}
                          {c.maxDiscountAmount ? ` (tối đa ${formatCurrency(c.maxDiscountAmount)})` : ''}
                        </p>
                        {c.minOrderAmount > 0 && (
                          <p className='text-xs text-gray-400'>ĐH tối thiểu: {formatCurrency(c.minOrderAmount)}</p>
                        )}
                        <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                          <Badge className={`${getDistributionInfo(c).className} text-[11px]`}>
                            {getDistributionInfo(c).label}
                          </Badge>
                          {c.excludePrescriptionItems && (
                            <span className='text-xs text-gray-400'>Không áp dụng Rx</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-xs text-gray-600'>
                        <p>{formatDate(c.startDate)}</p>
                        <p className='text-gray-400'>→ {formatDate(c.endDate)}</p>
                      </TableCell>
                      <TableCell>
                        <div className='text-xs'>
                          <span className='font-semibold'>{c.currentUsageCount || 0}</span>
                          <span className='text-gray-400'>/{c.totalUsageLimit || '∞'}</span>
                        </div>
                        <p className='text-xs text-gray-400 mt-1'>/{c.perUserLimit || 1} mỗi khách</p>
                        <div className='h-1.5 bg-gray-100 rounded-full mt-1 w-20'>
                          <div
                            className={`h-full rounded-full ${isExhausted(c) ? 'bg-orange-500' : 'bg-[#1E40AF]'}`}
                            style={{ width: `${Math.min(100, ((c.currentUsageCount || 0) / Math.max(c.totalUsageLimit || 1, 1)) * 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(c)}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            onClick={() => handleToggle(c)}
                            className='p-1.5 rounded hover:bg-gray-100 transition-colors'
                            title={c.isActive ? 'Tắt' : 'Bật'}
                          >
                            {c.isActive
                              ? <ToggleRight className='w-4 h-4 text-green-600' />
                              : <ToggleLeft className='w-4 h-4 text-gray-400' />
                            }
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className='p-1.5 rounded hover:bg-[#F0F6FF] text-[#1E40AF] transition-colors'
                          >
                            <Edit2 className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className='p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between border-t border-blue-400 pt-4'>
              <div className='text-sm text-gray-600'>
                Hiển thị {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} trong tổng số {total} coupon
              </div>
              <PaginationComponent currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className='!w-[94vw] !max-w-[calc(100%-2rem)] sm:!max-w-[980px] max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col'>
          <DialogHeader className='shrink-0 border-b border-[#E8EDF5] px-8 py-6 pr-14'>
            <DialogTitle>{editCoupon ? 'Chỉnh sửa coupon' : 'Tạo coupon mới'}</DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto px-8 py-5 space-y-5'>
            {/* Code & Name */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Mã coupon *</Label>
                <div className='flex gap-2'>
                  <Input
                    value={formData.code}
                    onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder='VD: SALE20'
                    className='font-mono'
                  />
                  {!editCoupon && (
                    <Button variant='outline' size='sm' onClick={() => setFormData(f => ({ ...f, code: generateCode() }))}>
                      <RefreshCw className='w-3.5 h-3.5' />
                    </Button>
                  )}
                </div>
              </div>
              <div className='space-y-1.5'>
                <Label>Tên coupon *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder='VD: Giảm 20% mùa hè'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder='Mô tả điều kiện áp dụng...'
              />
            </div>

            <Separator />

            {/* Type & Value */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Loại giảm giá</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'><Percent className='w-3.5 h-3.5 inline mr-1.5' />Phần trăm (%)</SelectItem>
                    <SelectItem value='fixed'><DollarSign className='w-3.5 h-3.5 inline mr-1.5' />Số tiền cố định</SelectItem>
                    <SelectItem value='free_shipping'>Freeship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type !== 'free_shipping' && (
                <div className='space-y-1.5'>
                  <Label>{formData.type === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)'}</Label>
                  <Input
                    type='number'
                    value={formData.value}
                    onChange={e => setFormData(f => ({ ...f, value: Number(e.target.value) }))}
                    min={0}
                    max={formData.type === 'percentage' ? 100 : undefined}
                  />
                </div>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Giá trị đơn tối thiểu để dùng mã</Label>
                <Input
                  type='number'
                  value={formData.minOrderAmount || ''}
                  onChange={e => setFormData(f => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                  min={0}
                  placeholder='0'
                />
                <p className='text-xs text-gray-500'>
                  Tính trên tạm tính sản phẩm trước phí ship, điểm thưởng và giảm giá. Nhập 0 nếu không yêu cầu.
                </p>
              </div>
              {formData.type === 'percentage' && (
                <div className='space-y-1.5'>
                  <Label>Giảm tối đa (đ, để trống = không giới hạn)</Label>
                  <Input
                    type='number'
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                    min={0}
                    placeholder='Không giới hạn'
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Usage & Dates */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Tổng lượt dùng tối đa</Label>
                <Input
                  type='number'
                  value={formData.totalUsageLimit}
                  onChange={e => setFormData(f => ({ ...f, totalUsageLimit: e.target.value }))}
                  min={1}
                  placeholder='Để trống = không giới hạn'
                />
              </div>
              <div className='space-y-1.5'>
                <Label>Lượt dùng tối đa / người</Label>
                <Input
                  type='number'
                  value={formData.perUserLimit}
                  onChange={e => setFormData(f => ({ ...f, perUserLimit: Number(e.target.value) }))}
                  min={1}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type='datetime-local'
                  value={formData.startDate}
                  onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className='space-y-1.5'>
                <Label>Ngày kết thúc</Label>
                <Input
                  type='datetime-local'
                  value={formData.endDate}
                  onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Switch
                checked={formData.isActive}
                onCheckedChange={v => setFormData(f => ({ ...f, isActive: v }))}
              />
              <Label>Kích hoạt ngay</Label>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-[#E8EDF5] bg-[#F0F6FF]/40 p-4'>
              <div className='flex items-center gap-3'>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={v => setFormData(f => ({ ...f, isPublic: v }))}
                />
                <div>
                  <Label>Công khai trong checkout</Label>
                  <p className='text-xs text-gray-500 mt-0.5'>Bật để mọi khách đủ điều kiện nhìn thấy mã.</p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <Switch
                  checked={formData.excludePrescriptionItems}
                  onCheckedChange={v => setFormData(f => ({ ...f, excludePrescriptionItems: v }))}
                />
                <div>
                  <Label>Không áp dụng thuốc kê đơn</Label>
                  <p className='text-xs text-gray-500 mt-0.5'>BE sẽ chặn đơn có sản phẩm cần đơn thuốc.</p>
                </div>
              </div>
            </div>

            <div className='rounded-lg border border-[#BFDBFE] bg-[#F0F6FF] p-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-semibold text-[#0A2463]'>Ai sẽ thấy mã này?</span>
                <Badge className={getDistributionInfo(formData).className}>
                  {getDistributionInfo(formData).label}
                </Badge>
              </div>
              <p className='mt-1 text-xs text-gray-600'>{getDistributionInfo(formData).description}</p>
              {formData.isPublic === false && formData.targetUserIds.length === 0 && (
                <p className='mt-2 text-xs font-medium text-yellow-700'>
                  Chưa chọn khách hàng: mã này sẽ không tự hiện cho khách, chỉ dùng được khi họ biết code.
                </p>
              )}
            </div>

            <div className='rounded-lg border border-[#E8EDF5] bg-white p-4'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <h3 className='text-sm font-semibold text-[#0A2463]'>Phạm vi áp dụng dự kiến</h3>
                  <p className='mt-0.5 text-xs text-gray-500'>{getDiscountPreview()}</p>
                </div>
                <Badge className={formData.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                  {formData.isActive ? 'Đang bật' : 'Đang tắt'}
                </Badge>
              </div>

              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {impactPreviewItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className='flex min-h-[76px] gap-3 rounded-md border border-[#EEF2F7] bg-[#F8FAFB] p-3'>
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8EDF5] text-[#0A2463]'>
                        <Icon className='h-4 w-4' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-xs font-medium uppercase text-gray-500'>{item.label}</p>
                        <p className='mt-0.5 text-sm font-semibold text-gray-900'>{item.value}</p>
                        <p className='mt-1 text-xs leading-5 text-gray-500'>{item.hint}</p>
                      </div>
                    </div>
                  )
                })}

                <div className='flex min-h-[76px] gap-3 rounded-md border border-[#EEF2F7] bg-[#F8FAFB] p-3 md:col-span-2'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8EDF5] text-[#0A2463]'>
                    <FolderTree className='h-4 w-4' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium uppercase text-gray-500'>Danh mục đã chọn</p>
                    <p className='mt-0.5 text-sm font-semibold text-gray-900'>
                      {formData.applicableCategoryIds.length > 0
                        ? `${formData.applicableCategoryIds.length} danh mục`
                        : 'Chưa giới hạn theo danh mục'}
                    </p>
                    <p className='mt-1 text-xs leading-5 text-gray-500'>
                      {formData.applicableCategoryIds.length > 0
                        ? 'Coupon chỉ tính trên các danh mục này và sản phẩm được chọn riêng nếu có.'
                        : 'Có thể chọn thêm danh mục ở phần bên dưới nếu muốn khóa phạm vi áp dụng.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div>
                <Label>Khách hàng được gán riêng</Label>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Nếu tắt công khai, khách được chọn sẽ nhìn thấy mã này trong checkout sau khi đăng nhập.
                </p>
                <div className='flex gap-2 mt-2'>
                  <Input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUsers()}
                    placeholder='Tìm tên, email, số điện thoại'
                  />
                  <Button type='button' variant='outline' onClick={() => searchUsers()} disabled={isSearchingUsers}>
                    {isSearchingUsers ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Tìm'}
                  </Button>
                </div>
                {userSearch.trim().length >= 2 && (
                  <div className='mt-2 rounded-lg border border-[#E8EDF5] bg-white shadow-sm'>
                    {isSearchingUsers && (
                      <div className='flex items-center gap-2 px-3 py-2 text-sm text-gray-500'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Đang tìm khách hàng...
                      </div>
                    )}
                    {!isSearchingUsers && userOptions.length === 0 && (
                      <div className='px-3 py-2 text-sm text-gray-500'>Không tìm thấy khách hàng phù hợp.</div>
                    )}
                    {!isSearchingUsers && userOptions.length > 0 && (
                      <div className='divide-y max-h-44 overflow-y-auto'>
                    {userOptions.map((user: any) => (
                      <button
                        key={user._id}
                        type='button'
                        disabled={formData.targetUserIds.includes(user._id)}
                        className='w-full text-left px-3 py-2 hover:bg-[#F0F6FF] disabled:bg-gray-50 disabled:text-gray-400 text-sm'
                        onClick={() => addTargetUser(user)}
                      >
                        <span className='font-medium'>{user.lastName} {user.firstName}</span>
                        <span className='text-gray-500 ml-2'>{user.email || user.phoneNumber}</span>
                        {formData.targetUserIds.includes(user._id) && <span className='ml-2 text-xs'>Đã chọn</span>}
                      </button>
                    ))}
                      </div>
                    )}
                  </div>
                )}
                {formData.targetUserIds.length > 0 && (
                  <div className='flex max-h-24 flex-wrap gap-2 overflow-y-auto mt-2 pr-1'>
                    {formData.targetUserIds.map(id => (
                      <Badge key={id} className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5] gap-1'>
                        {getUserDisplayName(id)}
                        <button type='button' onClick={() => removeId('targetUserIds', id)}><X className='w-3 h-3' /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label>Danh mục áp dụng</Label>
                  <Select onValueChange={(id) => addUniqueId('applicableCategoryIds', id)}>
                    <SelectTrigger className='mt-2'>
                      <SelectValue placeholder='Chọn danh mục' />
                    </SelectTrigger>
                    <SelectContent className='!max-h-[320px] overflow-y-auto'>
                      {categoryOptions.map((category: any) => (
                        <SelectItem key={category._id} value={category._id}>
                          {'—'.repeat(category.depth || 0)} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.applicableCategoryIds.length > 0 && (
                    <div className='flex max-h-24 flex-wrap gap-2 overflow-y-auto mt-2 pr-1'>
                      {formData.applicableCategoryIds.map(id => {
                        const category = categoryOptions.find((c: any) => c._id === id)
                        return (
                          <Badge key={id} className='bg-green-100 text-green-700 hover:bg-green-100 gap-1'>
                            {category?.name || `Category ${id.slice(-6)}`}
                            <button type='button' onClick={() => removeId('applicableCategoryIds', id)}><X className='w-3 h-3' /></button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Sản phẩm áp dụng</Label>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchProducts()}
                      placeholder='Tìm tên hoặc SKU'
                    />
                    <Button type='button' variant='outline' onClick={() => searchProducts()} disabled={isSearchingProducts}>
                      {isSearchingProducts ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Tìm'}
                    </Button>
                  </div>
                  {productSearch.trim().length >= 2 && (
                    <div className='mt-2 rounded-lg border border-[#E8EDF5] bg-white shadow-sm'>
                      {isSearchingProducts && (
                        <div className='flex items-center gap-2 px-3 py-2 text-sm text-gray-500'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Đang tìm sản phẩm...
                        </div>
                      )}
                      {!isSearchingProducts && productOptions.length === 0 && (
                        <div className='px-3 py-2 text-sm text-gray-500'>Không tìm thấy sản phẩm phù hợp.</div>
                      )}
                      {!isSearchingProducts && productOptions.length > 0 && (
                        <div className='divide-y max-h-44 overflow-y-auto'>
                      {productOptions.map((product: any) => (
                        <button
                          key={product._id || product.id}
                          type='button'
                          disabled={formData.applicableProductIds.includes(product._id || product.id)}
                          className='w-full text-left px-3 py-2 hover:bg-[#F0F6FF] disabled:bg-gray-50 disabled:text-gray-400 text-sm'
                          onClick={() => addApplicableProduct(product)}
                        >
                          <span className='font-medium'>{product.name}</span>
                          <span className='text-gray-500 ml-2'>{product.sku}</span>
                          {formData.applicableProductIds.includes(product._id || product.id) && <span className='ml-2 text-xs'>Đã chọn</span>}
                        </button>
                      ))}
                        </div>
                      )}
                    </div>
                  )}
                  {formData.applicableProductIds.length > 0 && (
                    <div className='flex max-h-24 flex-wrap gap-2 overflow-y-auto mt-2 pr-1'>
                      {formData.applicableProductIds.map(id => (
                        <Badge key={id} className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5] gap-1'>
                          {getProductDisplayName(id)}
                          <button type='button' onClick={() => removeId('applicableProductIds', id)}><X className='w-3 h-3' /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formWarnings.length > 0 && (
              <div className='space-y-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3'>
                {formWarnings.map((warning) => (
                  <div key={warning} className='flex items-start gap-2 text-sm text-yellow-800'>
                    <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {formError && (
              <div className='flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg'>
                <AlertCircle className='w-4 h-4 flex-shrink-0' />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className='shrink-0 border-t border-[#E8EDF5] bg-white px-8 py-4'>
            <Button variant='outline' onClick={() => setShowForm(false)}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='bg-[#0A2463] hover:bg-[#071A49] text-white gap-2'
            >
              {isSubmitting && <Loader2 className='w-4 h-4 animate-spin' />}
              {editCoupon ? 'Cập nhật' : 'Tạo coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xóa coupon <strong className='text-[#1E40AF]'>{deleteTarget?.code}</strong>? Chỉ coupon chưa có lượt dùng mới được xóa; coupon đã dùng nên tắt để giữ lịch sử đối soát.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700 text-white'>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
