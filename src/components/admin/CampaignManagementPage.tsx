import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Zap, Calendar, Percent, DollarSign, Tag, Globe, Lock,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw,
  ArrowUp, ArrowDown, Check, ChevronsUpDown
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { apiClient } from '../../services/apiClient'
import adminService from '../../services/adminService'
import brandService from '../../services/brandService'
import productService from '../../services/productService'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  _id: string
  name: string
  slug: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscountAmount?: number
  priority: number
  startDate: string
  endDate: string
  status: 'active' | 'inactive' | 'scheduled' | 'expired'
  isPublic: boolean
  scope: 'all' | 'products' | 'categories' | 'brands'
  productIds?: string[]
  categoryIds?: string[]
  brandIds?: string[]
  excludePrescription?: boolean
  badgeText?: string
  badgeColor?: string
  conditionType?: string
  conditionValue?: number
  createdAt: string
}

interface CampaignFormData {
  name: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscountAmount: string
  priority: number
  startDate: string
  endDate: string
  status: 'active' | 'inactive'
  isPublic: boolean
  scope: 'all' | 'products' | 'categories' | 'brands'
  productIds: string[]
  categoryIds: string[]
  brandIds: string[]
  excludePrescription: boolean
  badgeText: string
  badgeColor: string
}

const EMPTY_FORM: CampaignFormData = {
  name: '', description: '',
  discountType: 'percentage', discountValue: 10,
  maxDiscountAmount: '',
  priority: 10,
  startDate: new Date().toISOString().substring(0, 16),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 16),
  status: 'active', isPublic: true,
  scope: 'all', productIds: [], categoryIds: [], brandIds: [], excludePrescription: false,
  badgeText: '', badgeColor: '#EF4444'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 15

  const [openCat, setOpenCat] = useState(false)
  const [openBrand, setOpenBrand] = useState(false)
  const [openProduct, setOpenProduct] = useState(false)
  const [searchProductTerm, setSearchProductTerm] = useState('')
  const [searchedProducts, setSearchedProducts] = useState<any[]>([])

  useEffect(() => {
    if (!searchProductTerm) {
      productService.getProductsPaginated({ limit: 10 }).then(res => setSearchedProducts(res.products))
      return
    }
    const timer = setTimeout(() => {
      productService.searchProducts(searchProductTerm).then(res => setSearchedProducts(res))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchProductTerm])

  const { data: categoriesData = [] } = useQuery({ queryKey: ['admin', 'categories', 'tree'], queryFn: adminService.getCategoryTree })
  const { data: brandsData = [] } = useQuery({ queryKey: ['brands'], queryFn: () => brandService.getBrands({ limit: 450 }) })
  const categories = useMemo(() => {
    const flatten = (cats: any[], result: any[] = []): any[] => {
      cats.forEach((cat) => { result.push(cat); if (cat.children?.length) flatten(cat.children, result) })
      return result
    }
    return flatten(categoriesData)
  }, [categoriesData])

  const [showForm, setShowForm] = useState(false)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      })
      const res = await apiClient.get<any>(`/campaigns?${params}`)
      setCampaigns(res.data.result.campaigns || [])
      setTotal(res.data.result.pagination?.total || 0)
    } catch {
      setError('Không thể tải danh sách chiến dịch')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [page, filterStatus])

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchCampaigns() }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const openCreate = () => {
    setEditCampaign(null)
    setFormData(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (c: Campaign) => {
    setEditCampaign(c)
    setFormData({
      name: c.name, description: c.description || '',
      discountType: c.discountType, discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount?.toString() || '',
      priority: c.priority,
      startDate: c.startDate.substring(0, 16),
      endDate: c.endDate.substring(0, 16),
      status: (c.status === 'active' ? 'active' : 'inactive') as any,
      isPublic: c.isPublic,
      scope: c.scope || 'all',
      productIds: c.productIds || [],
      categoryIds: c.categoryIds || [],
      brandIds: c.brandIds || [],
      excludePrescription: c.excludePrescription || false,
      badgeText: c.badgeText || '',
      badgeColor: c.badgeColor || '#EF4444'
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      setFormError('Vui lòng nhập tên chiến dịch')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const payload: any = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        badgeText: formData.badgeText || undefined,
        badgeColor: formData.badgeText ? formData.badgeColor : undefined
      }
      if (payload.scope !== 'products') payload.productIds = []
      if (payload.scope !== 'categories') payload.categoryIds = []
      if (payload.scope !== 'brands') payload.brandIds = []
      if (editCampaign) {
        await apiClient.put(`/campaigns/${editCampaign._id}`, payload)
      } else {
        await apiClient.post('/campaigns', payload)
      }
      setShowForm(false)
      fetchCampaigns()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (c: Campaign) => {
    try {
      await apiClient.patch(`/campaigns/${c._id}/toggle`)
      fetchCampaigns()
    } catch { }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiClient.delete(`/campaigns/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchCampaigns()
    } catch { }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN')
  const totalPages = Math.ceil(total / LIMIT)

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isActive = (c: Campaign) => c.status === 'active' && !isExpired(c.endDate)

  const getStatusBadge = (c: Campaign) => {
    if (isExpired(c.endDate)) return <Badge className='bg-red-100 text-red-600 hover:bg-red-100'>Hết hạn</Badge>
    if (c.status === 'inactive') return <Badge className='bg-gray-100 text-gray-500 hover:bg-gray-100'>Tắt</Badge>
    return <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>Đang chạy</Badge>
  }

  const BADGE_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)` }}
          >
            Quản lý Chiến dịch
          </h1>
          <p className='text-gray-600 mt-2 text-sm'>Tạo chiến dịch giảm giá tự động áp dụng cho sản phẩm</p>
        </div>
        <Button
          onClick={openCreate}
          className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2 text-white self-start sm:self-auto'
        >
          <Plus className='w-4 h-4' />
          Tạo chiến dịch
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Tổng chiến dịch', value: total, icon: <Zap className='w-5 h-5' />, color: 'text-purple-600 bg-purple-100' },
          { label: 'Đang chạy', value: campaigns.filter(isActive).length, icon: <Zap className='w-5 h-5' />, color: 'text-green-600 bg-green-100' },
          { label: 'Công khai', value: campaigns.filter(c => c.isPublic).length, icon: <Globe className='w-5 h-5' />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Hết hạn', value: campaigns.filter(c => isExpired(c.endDate)).length, icon: <Calendar className='w-5 h-5' />, color: 'text-red-600 bg-red-100' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className='bg-white backdrop-blur-lg border-blue-100'>
              <CardContent className='p-4 flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className='text-xs text-gray-500'>{s.label}</p>
                  <p className='text-xl font-bold text-gray-900'>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm tên chiến dịch...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 border-2 border-blue-200 focus:border-blue-500'
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className='w-44 border-2 border-blue-200'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='active'>Đang chạy</SelectItem>
              <SelectItem value='inactive'>Đã tắt</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' onClick={fetchCampaigns}><RefreshCw className='w-4 h-4' /></Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='text-base'>Danh sách chiến dịch ({total})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex items-center justify-center h-48 gap-3'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <span className='text-gray-500'>Đang tải...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-48 gap-3 text-red-500'>
              <AlertCircle className='w-5 h-5' />{error}
            </div>
          ) : campaigns.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <Zap className='w-12 h-12 mx-auto mb-3 opacity-30' />
              <p>Không có chiến dịch nào</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='!border-b-2 !border-blue-300 bg-gray-50 text-gray-600'>
                    <th className='text-left p-3 pl-6'>Tên chiến dịch</th>
                    <th className='text-left p-3'>Giảm giá</th>
                    <th className='text-left p-3'>Thời gian</th>
                    <th className='text-left p-3'>Phạm vi & Ưu tiên</th>
                    <th className='text-left p-3'>Trạng thái</th>
                    <th className='text-right p-3 pr-6'>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, idx) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className='border-b-2 border-blue-200 hover:bg-blue-50/30 transition-colors'
                    >
                      <td className='p-3 pl-6'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-gray-900'>{c.name}</p>
                          {c.isPublic ? (
                            <Globe className='w-3.5 h-3.5 text-blue-400' />
                          ) : (
                            <Lock className='w-3.5 h-3.5 text-gray-400' />
                          )}
                        </div>
                        {c.badgeText && (
                          <span
                            className='text-white text-xs px-1.5 py-0.5 rounded'
                            style={{ backgroundColor: c.badgeColor || '#EF4444' }}
                          >
                            {c.badgeText}
                          </span>
                        )}
                        {c.description && (
                          <p className='text-xs text-gray-400 mt-0.5 truncate max-w-48'>{c.description}</p>
                        )}
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-1.5'>
                          {c.discountType === 'percentage'
                            ? <Percent className='w-3.5 h-3.5 text-purple-500' />
                            : <DollarSign className='w-3.5 h-3.5 text-green-500' />
                          }
                          <span className='font-semibold text-purple-700'>
                            {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                          </span>
                        </div>
                        {c.maxDiscountAmount && (
                          <p className='text-xs text-gray-400'>tối đa {formatCurrency(c.maxDiscountAmount)}</p>
                        )}
                      </td>
                      <td className='p-3 text-xs text-gray-600'>
                        <p>{formatDate(c.startDate)}</p>
                        <p className='text-gray-400'>→ {formatDate(c.endDate)}</p>
                      </td>
                      <td className='p-3'>
                        <div className='flex flex-col gap-1'>
                          <span className='text-sm text-gray-800 font-medium'>
                            {c.scope === 'all' && 'Toàn sàn'}
                            {c.scope === 'categories' && 'Danh mục chỉ định'}
                            {c.scope === 'brands' && 'Thương hiệu chỉ định'}
                            {c.scope === 'products' && 'Sản phẩm chỉ định'}
                          </span>
                          {c.excludePrescription && (
                            <span className='text-[10px] text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded w-fit'>
                              Cấm Thuốc Rx
                            </span>
                          )}
                          <div className='flex items-center gap-1 mt-1'>
                            <ArrowUp className='w-3 h-3 text-gray-400' />
                            <span className='text-xs font-semibold text-gray-500'>Mức ưu tiên: {c.priority}</span>
                          </div>
                        </div>
                      </td>
                      <td className='p-3'>{getStatusBadge(c)}</td>
                      <td className='p-3 pr-6'>
                        <div className='flex items-center justify-end gap-1'>
                          <button onClick={() => handleToggle(c)} className='p-1.5 rounded hover:bg-gray-100'>
                            {isActive(c)
                              ? <ToggleRight className='w-4 h-4 text-green-600' />
                              : <ToggleLeft className='w-4 h-4 text-gray-400' />
                            }
                          </button>
                          <button onClick={() => openEdit(c)} className='p-1.5 rounded hover:bg-blue-50 text-blue-600'>
                            <Edit2 className='w-4 h-4' />
                          </button>
                          <button onClick={() => setDeleteTarget(c)} className='p-1.5 rounded hover:bg-red-50 text-red-500'>
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-between px-6 py-4 border-t'>
              <p className='text-sm text-gray-500'>Trang {page}/{totalPages}</p>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className='w-4 h-4' />
                </Button>
                <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editCampaign ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}</DialogTitle>
          </DialogHeader>

          <div className='space-y-5 py-2'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Tên chiến dịch *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder='VD: Flash Sale Cuối Tuần'
                />
              </div>
              <div className='space-y-1.5'>
                <Label>Độ ưu tiên (số cao = ưu tiên cao hơn)</Label>
                <Input
                  type='number' min={0}
                  value={formData.priority}
                  onChange={e => setFormData(f => ({ ...f, priority: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder='Mô tả chiến dịch...'
              />
            </div>

            <Separator />

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Loại giảm giá</Label>
                <Select value={formData.discountType} onValueChange={(v: any) => setFormData(f => ({ ...f, discountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'>Phần trăm (%)</SelectItem>
                    <SelectItem value='fixed'>Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label>{formData.discountType === 'percentage' ? 'Giảm (%)' : 'Giảm (đ)'}</Label>
                <Input
                  type='number' min={0}
                  value={formData.discountValue}
                  onChange={e => setFormData(f => ({ ...f, discountValue: Number(e.target.value) }))}
                />
              </div>
            </div>

            {formData.discountType === 'percentage' && (
              <div className='space-y-1.5'>
                <Label>Giảm tối đa (đ, để trống = không giới hạn)</Label>
                <Input
                  type='number' min={0}
                  value={formData.maxDiscountAmount}
                  onChange={e => setFormData(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                  placeholder='Không giới hạn'
                />
              </div>
            )}

            <Separator />

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Ngày bắt đầu</Label>
                <Input type='datetime-local' value={formData.startDate}
                  onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className='space-y-1.5'>
                <Label>Ngày kết thúc</Label>
                <Input type='datetime-local' value={formData.endDate}
                  onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <Separator />

            {/* Phạm vi áp dụng */}
            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <Label>Phạm vi áp dụng</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v: any) => setFormData(f => ({ ...f, scope: v, categoryIds: [], brandIds: [] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Toàn sàn (Tất cả sản phẩm)</SelectItem>
                    <SelectItem value='categories'>Theo Danh mục</SelectItem>
                    <SelectItem value='brands'>Theo Thương hiệu</SelectItem>
                    <SelectItem value='products'>Sản phẩm cụ thể</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.scope === 'products' && (
                <div className='space-y-1.5 p-3 bg-gray-50 rounded-md border'>
                  <Label>Chọn Sản phẩm áp dụng</Label>
                  <Popover open={openProduct} onOpenChange={setOpenProduct}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openProduct}
                        className="w-full justify-between font-normal bg-white"
                      >
                        {formData.productIds && formData.productIds[0]
                          ? searchedProducts.find((p: any) => p._id === formData.productIds[0])?.name || "1 Sản phẩm đã chọn"
                          : "Tìm tên sản phẩm..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 border shadow-md rounded-md bg-white overflow-hidden" align="start">
                      <Command shouldFilter={false} className="bg-white">
                        <CommandInput 
                          placeholder="Gõ tên sản phẩm..." 
                          value={searchProductTerm} 
                          onValueChange={setSearchProductTerm} 
                          className="focus:ring-0 outline-none border-none py-3 px-1"
                        />
                        <CommandList className="max-h-[250px] overflow-y-auto border-t border-gray-100">
                          <CommandEmpty className="p-4 text-sm text-center text-gray-500">Không tìm thấy sản phẩm phù hợp.</CommandEmpty>
                          <CommandGroup className="p-1">
                            {searchedProducts.map((p: any) => (
                              <CommandItem
                                key={p._id}
                                value={p._id}
                                className="cursor-pointer py-2 px-3 hover:bg-gray-100 data-[selected=true]:bg-gray-100 rounded-sm"
                                onSelect={() => {
                                  setFormData(f => ({ ...f, productIds: [p._id] }))
                                  setOpenProduct(false)
                                  setSearchProductTerm('')
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    (formData.productIds && formData.productIds[0] === p._id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className='text-xs text-gray-500'>Tính năng hiện hỗ trợ áp dụng cho 1 sản phẩm chỉ định.</p>
                </div>
              )}

              {formData.scope === 'categories' && (
                <div className='space-y-1.5 p-3 bg-gray-50 rounded-md border'>
                  <Label>Chọn Danh mục áp dụng</Label>
                  <Popover open={openCat} onOpenChange={setOpenCat}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCat}
                        className="w-full justify-between font-normal bg-white"
                      >
                        {formData.categoryIds[0]
                          ? categories.find((c: any) => c._id === formData.categoryIds[0])?.name
                          : "Chọn 1 danh mục..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 border shadow-md rounded-md bg-white overflow-hidden" align="start">
                      <Command className="bg-white">
                        <CommandInput placeholder="Tìm kiếm danh mục..." className="focus:ring-0 outline-none border-none py-3 px-1" />
                        <CommandList className="max-h-[250px] overflow-y-auto border-t border-gray-100">
                          <CommandEmpty className="p-4 text-sm text-center text-gray-500">Không tìm thấy danh mục phù hợp.</CommandEmpty>
                          <CommandGroup className="p-1">
                            {categories.map((c: any) => (
                              <CommandItem
                                key={c._id}
                                value={c.name}
                                className="cursor-pointer py-2 px-3 hover:bg-gray-100 data-[selected=true]:bg-gray-100 rounded-sm"
                                onSelect={() => {
                                  setFormData(f => ({ ...f, categoryIds: [c._id] }))
                                  setOpenCat(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.categoryIds[0] === c._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className='text-xs text-gray-500'>Hiện tại giao diện chỉ hỗ trợ chọn 1 danh mục chính. Các sản phẩm thuộc danh mục này sẽ được giảm giá.</p>
                </div>
              )}

              {formData.scope === 'brands' && (
                <div className='space-y-1.5 p-3 bg-gray-50 rounded-md border'>
                  <Label>Chọn Thương hiệu áp dụng</Label>
                  <Popover open={openBrand} onOpenChange={setOpenBrand}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBrand}
                        className="w-full justify-between font-normal bg-white"
                      >
                        {formData.brandIds[0]
                          ? brandsData.find((b: any) => b._id === formData.brandIds[0])?.name
                          : "Chọn 1 thương  hiệu..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 border shadow-md rounded-md bg-white overflow-hidden" align="start">
                      <Command className="bg-white">
                        <CommandInput placeholder="Tìm kiếm thương hiệu..." className="focus:ring-0 outline-none border-none py-3 px-1" />
                        <CommandList className="max-h-[250px] overflow-y-auto border-t border-gray-100">
                          <CommandEmpty className="p-4 text-sm text-center text-gray-500">Không tìm thấy thương hiệu phù hợp.</CommandEmpty>
                          <CommandGroup className="p-1">
                            {brandsData.map((b: any) => (
                              <CommandItem
                                key={b._id}
                                value={b.name}
                                className="cursor-pointer py-2 px-3 hover:bg-gray-100 data-[selected=true]:bg-gray-100 rounded-sm"
                                onSelect={() => {
                                  setFormData(f => ({ ...f, brandIds: [b._id] }))
                                  setOpenBrand(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.brandIds[0] === b._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {b.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className='text-xs text-gray-500'>Sản phẩm thuộc thương hiệu này sẽ được giảm giá.</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Badge */}
            <div className='space-y-3'>
              <Label>Badge hiển thị (tùy chọn)</Label>
              <div className='flex gap-3'>
                <Input
                  value={formData.badgeText}
                  onChange={e => setFormData(f => ({ ...f, badgeText: e.target.value }))}
                  placeholder='VD: Flash Sale, -20%, Mới'
                  className='flex-1'
                />
                <div className='flex gap-1'>
                  {BADGE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(f => ({ ...f, badgeColor: color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${formData.badgeColor === color ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Warning: khi có maxDiscountAmount mà không đặt badgeText */}
              {formData.discountType === 'percentage' && formData.maxDiscountAmount && !formData.badgeText && (
                <div className='flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800'>
                  <span>⚠️</span>
                  <div>
                    <p className='font-medium'>Nên đặt badge text khi có giảm tối đa</p>
                    <p className='text-amber-600 mt-0.5'>
                      Campaign giảm <strong>{formData.discountValue}%</strong> tối đa <strong>{Number(formData.maxDiscountAmount).toLocaleString('vi-VN')}đ</strong> — 
                      với sản phẩm giá cao, badge % thực tế sẽ khác {formData.discountValue}%.
                    </p>
                    <button
                      type='button'
                      onClick={() => setFormData(f => ({ ...f, badgeText: `Giảm ${f.discountValue}% tối đa ${Number(f.maxDiscountAmount).toLocaleString('vi-VN')}đ` }))}
                      className='mt-1.5 text-amber-700 underline font-medium hover:text-amber-900'
                    >
                      Tự động điền: "Giảm {formData.discountValue}% tối đa {Number(formData.maxDiscountAmount).toLocaleString('vi-VN')}đ"
                    </button>
                  </div>
                </div>
              )}
              {formData.badgeText && (
                <span
                  className='text-white text-xs px-2 py-1 rounded inline-block'
                  style={{ backgroundColor: formData.badgeColor }}
                >
                  {formData.badgeText}
                </span>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='flex items-center gap-2'>
                <Switch checked={formData.isPublic} onCheckedChange={v => setFormData(f => ({ ...f, isPublic: v }))} />
                <Label>Công khai</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={v => setFormData(f => ({ ...f, status: v ? 'active' : 'inactive' }))}
                />
                <Label>Kích hoạt</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={formData.excludePrescription}
                  onCheckedChange={v => setFormData(f => ({ ...f, excludePrescription: v }))}
                />
                <Label className='text-red-600'>Cấm thuốc Rx</Label>
              </div>
            </div>

            {formError && (
              <div className='flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg'>
                <AlertCircle className='w-4 h-4' />{formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowForm(false)}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='bg-purple-600 hover:bg-purple-700 text-white gap-2'
            >
              {isSubmitting && <Loader2 className='w-4 h-4 animate-spin' />}
              {editCampaign ? 'Cập nhật' : 'Tạo chiến dịch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chiến dịch?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xóa chiến dịch <strong className='text-blue-600'>{deleteTarget?.name}</strong>?
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
