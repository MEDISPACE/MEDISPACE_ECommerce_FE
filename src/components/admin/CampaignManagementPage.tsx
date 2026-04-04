import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Zap, Calendar, Percent, DollarSign, Tag, Globe, Lock,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw,
  ArrowUp, ArrowDown
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
  applicableProducts?: string[]
  applicableCategories?: string[]
  badgeLabel?: string
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
  badgeLabel: string
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
  badgeLabel: '', badgeColor: '#EF4444'
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
      badgeLabel: c.badgeLabel || '',
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
      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        badgeLabel: formData.badgeLabel || undefined,
        badgeColor: formData.badgeLabel ? formData.badgeColor : undefined
      }
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
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý Chiến dịch</h1>
          <p className='text-gray-500 text-sm mt-1'>Tạo chiến dịch giảm giá tự động áp dụng cho sản phẩm</p>
        </div>
        <Button
          onClick={openCreate}
          className='bg-gradient-to-r from-purple-600 to-pink-500 text-white gap-2 self-start'
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
            <Card>
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
      <Card>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm tên chiến dịch...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className='w-44'>
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
      <Card>
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
                  <tr className='border-b bg-gray-50 text-gray-600'>
                    <th className='text-left p-3 pl-6'>Tên chiến dịch</th>
                    <th className='text-left p-3'>Giảm giá</th>
                    <th className='text-left p-3'>Thời gian</th>
                    <th className='text-left p-3'>Độ ưu tiên</th>
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
                      className='border-b hover:bg-gray-50 transition-colors'
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
                        {c.badgeLabel && (
                          <span
                            className='text-white text-xs px-1.5 py-0.5 rounded'
                            style={{ backgroundColor: c.badgeColor || '#EF4444' }}
                          >
                            {c.badgeLabel}
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
                        <div className='flex items-center gap-1'>
                          <ArrowUp className='w-3 h-3 text-gray-400' />
                          <span className='font-semibold'>{c.priority}</span>
                        </div>
                        <p className='text-xs text-gray-400'>Cao = ưu tiên trước</p>
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
        <DialogContent className='max-w-xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editCampaign ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label>Tên chiến dịch *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder='VD: Flash Sale Cuối Tuần'
              />
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

            <div className='space-y-1.5'>
              <Label>Độ ưu tiên (số cao = ưu tiên cao hơn)</Label>
              <Input
                type='number' min={0}
                value={formData.priority}
                onChange={e => setFormData(f => ({ ...f, priority: Number(e.target.value) }))}
              />
            </div>

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

            {/* Badge */}
            <div className='space-y-3'>
              <Label>Badge hiển thị (tùy chọn)</Label>
              <div className='flex gap-3'>
                <Input
                  value={formData.badgeLabel}
                  onChange={e => setFormData(f => ({ ...f, badgeLabel: e.target.value }))}
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
              {formData.badgeLabel && (
                <span
                  className='text-white text-xs px-2 py-1 rounded inline-block'
                  style={{ backgroundColor: formData.badgeColor }}
                >
                  {formData.badgeLabel}
                </span>
              )}
            </div>

            <div className='flex gap-6'>
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
              Bạn chắc chắn muốn xóa chiến dịch <strong>{deleteTarget?.name}</strong>?
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
