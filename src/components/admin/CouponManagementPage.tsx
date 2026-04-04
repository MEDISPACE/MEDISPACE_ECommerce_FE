import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Tag, Calendar, Percent, DollarSign, Users, Copy, CheckCircle,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, X
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
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { apiClient } from '../../services/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount: number
  maxDiscountAmount?: number
  maxUsage: number
  currentUsage: number
  maxUsagePerUser: number
  startDate: string
  endDate: string
  isActive: boolean
  applicableCategories?: string[]
  createdAt: string
}

interface CouponFormData {
  code: string
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount: number
  maxDiscountAmount: string
  maxUsage: number
  maxUsagePerUser: number
  startDate: string
  endDate: string
  isActive: boolean
}

const EMPTY_FORM: CouponFormData = {
  code: '', name: '', description: '',
  type: 'percentage', value: 10,
  minOrderAmount: 0, maxDiscountAmount: '',
  maxUsage: 100, maxUsagePerUser: 1,
  startDate: new Date().toISOString().substring(0, 16),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 16),
  isActive: true
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminCouponPage() {
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
      setCoupons(res.data.result.coupons || [])
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
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditCoupon(c)
    setFormData({
      code: c.code, name: c.name, description: c.description || '',
      type: c.type, value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount?.toString() || '',
      maxUsage: c.maxUsage, maxUsagePerUser: c.maxUsagePerUser,
      startDate: c.startDate.substring(0, 16),
      endDate: c.endDate.substring(0, 16),
      isActive: c.isActive
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      setFormError('Vui lòng điền mã và tên coupon')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined
      }
      if (editCoupon) {
        await apiClient.put(`/coupons/${editCoupon._id}`, payload)
      } else {
        await apiClient.post('/coupons', payload)
      }
      setShowForm(false)
      fetchCoupons()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

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
    } catch { }
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

  const TYPE_LABELS = { percentage: 'Phần trăm', fixed: 'Cố định', free_shipping: 'Freeship' }
  const TYPE_COLORS = {
    percentage: 'bg-blue-100 text-blue-700',
    fixed: 'bg-green-100 text-green-700',
    free_shipping: 'bg-purple-100 text-purple-700'
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isNotStarted = (startDate: string) => new Date(startDate) > new Date()

  const getStatusBadge = (c: Coupon) => {
    if (!c.isActive) return <Badge className='bg-gray-100 text-gray-600 hover:bg-gray-100'>Tắt</Badge>
    if (isExpired(c.endDate)) return <Badge className='bg-red-100 text-red-600 hover:bg-red-100'>Hết hạn</Badge>
    if (isNotStarted(c.startDate)) return <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-100'>Chưa bắt đầu</Badge>
    return <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>Hoạt động</Badge>
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý Coupon</h1>
          <p className='text-gray-500 text-sm mt-1'>Tạo và quản lý các mã giảm giá cho khách hàng</p>
        </div>
        <Button
          onClick={openCreate}
          className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white gap-2 self-start sm:self-auto'
        >
          <Plus className='w-4 h-4' />
          Tạo coupon
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Tổng coupon', value: total, icon: <Tag className='w-5 h-5' />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Đang hoạt động', value: coupons.filter(c => c.isActive && !isExpired(c.endDate)).length, icon: <CheckCircle className='w-5 h-5' />, color: 'text-green-600 bg-green-100' },
          { label: 'Đã dùng', value: coupons.reduce((s, c) => s + c.currentUsage, 0), icon: <Users className='w-5 h-5' />, color: 'text-purple-600 bg-purple-100' },
          { label: 'Hết hạn', value: coupons.filter(c => isExpired(c.endDate)).length, icon: <Calendar className='w-5 h-5' />, color: 'text-red-600 bg-red-100' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
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
      <Card>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm mã coupon, tên...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className='w-40'>
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
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Danh sách coupon ({total})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex items-center justify-center h-48 gap-3'>
              <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
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
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-gray-50 text-gray-600'>
                    <th className='text-left p-3 pl-6'>Mã / Tên</th>
                    <th className='text-left p-3'>Loại / Giá trị</th>
                    <th className='text-left p-3'>Thời hạn</th>
                    <th className='text-left p-3'>Sử dụng</th>
                    <th className='text-left p-3'>Trạng thái</th>
                    <th className='text-right p-3 pr-6'>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c, idx) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className='border-b hover:bg-gray-50 transition-colors'
                    >
                      <td className='p-3 pl-6'>
                        <div className='flex items-center gap-2'>
                          <code className='bg-gray-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-gray-800'>
                            {c.code}
                          </code>
                          <button
                            onClick={() => copyCode(c.code, c._id)}
                            className='text-gray-400 hover:text-blue-600 transition-colors'
                          >
                            {copiedId === c._id ? <CheckCircle className='w-3.5 h-3.5 text-green-500' /> : <Copy className='w-3.5 h-3.5' />}
                          </button>
                        </div>
                        <p className='text-xs text-gray-500 mt-0.5'>{c.name}</p>
                      </td>
                      <td className='p-3'>
                        <Badge className={`${TYPE_COLORS[c.type]} text-xs`}>{TYPE_LABELS[c.type]}</Badge>
                        <p className='text-xs mt-1 font-semibold'>
                          {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatCurrency(c.value) : '0đ ship'}
                          {c.maxDiscountAmount ? ` (tối đa ${formatCurrency(c.maxDiscountAmount)})` : ''}
                        </p>
                        {c.minOrderAmount > 0 && (
                          <p className='text-xs text-gray-400'>ĐH tối thiểu: {formatCurrency(c.minOrderAmount)}</p>
                        )}
                      </td>
                      <td className='p-3 text-xs text-gray-600'>
                        <p>{formatDate(c.startDate)}</p>
                        <p className='text-gray-400'>→ {formatDate(c.endDate)}</p>
                      </td>
                      <td className='p-3'>
                        <div className='text-xs'>
                          <span className='font-semibold'>{c.currentUsage}</span>
                          <span className='text-gray-400'>/{c.maxUsage}</span>
                        </div>
                        <div className='h-1.5 bg-gray-100 rounded-full mt-1 w-20'>
                          <div
                            className='h-full bg-blue-500 rounded-full'
                            style={{ width: `${Math.min(100, (c.currentUsage / c.maxUsage) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className='p-3'>{getStatusBadge(c)}</td>
                      <td className='p-3 pr-6'>
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
                            className='p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors'
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
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between px-6 py-4 border-t'>
              <p className='text-sm text-gray-500'>
                Trang {page}/{totalPages} — {total} coupon
              </p>
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
            <DialogTitle>{editCoupon ? 'Chỉnh sửa coupon' : 'Tạo coupon mới'}</DialogTitle>
          </DialogHeader>

          <div className='space-y-5 py-2'>
            {/* Code & Name */}
            <div className='grid grid-cols-2 gap-4'>
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
            <div className='grid grid-cols-2 gap-4'>
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

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Đơn hàng tối thiểu (đ)</Label>
                <Input
                  type='number'
                  value={formData.minOrderAmount}
                  onChange={e => setFormData(f => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                  min={0}
                />
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
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label>Tổng lượt dùng tối đa</Label>
                <Input
                  type='number'
                  value={formData.maxUsage}
                  onChange={e => setFormData(f => ({ ...f, maxUsage: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div className='space-y-1.5'>
                <Label>Lượt dùng tối đa / người</Label>
                <Input
                  type='number'
                  value={formData.maxUsagePerUser}
                  onChange={e => setFormData(f => ({ ...f, maxUsagePerUser: Number(e.target.value) }))}
                  min={1}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
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

            {formError && (
              <div className='flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg'>
                <AlertCircle className='w-4 h-4 flex-shrink-0' />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowForm(false)}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='bg-blue-600 hover:bg-blue-700 text-white gap-2'
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
              Bạn chắc chắn muốn xóa coupon <strong>{deleteTarget?.code}</strong>? Hành động này không thể hoàn tác.
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
