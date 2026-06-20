import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Users, TrendingUp, Award, Trophy, Star,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw,
  Search, Crown, Gift, Clock, Save, Upload
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { apiClient } from '../../services/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────

type LoyaltyTier = 'member' | 'silver' | 'gold' | 'platinum'

interface LoyaltyAccount {
  _id: string
  userId: string
  userInfo?: {
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }
  pointsBalance: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  totalPointsExpired: number
  tier: LoyaltyTier
  totalSpent: number
  multiplier: number
  createdAt: string
  updatedAt: string
}

interface LoyaltyStats {
  totalAccounts: number
  totalPointsCirculating: number
  totalPointsEverEarned: number
  totalPointsRedeemed: number
  tierBreakdown: Record<LoyaltyTier, number>
  avgPointsPerUser: number
}

interface LoyaltyTierRule {
  code: LoyaltyTier
  label: string
  minTotalSpent: number
  multiplier: number
}

interface LoyaltyProgramConfig {
  _id?: string
  version: number
  status: 'draft' | 'published' | 'archived'
  pointsPerVnd: number
  pointsToVnd: number
  maxRedeemRatio: number
  minRedeem: number
  expiryDays: number
  tiers: LoyaltyTierRule[]
}

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  member: { label: 'Thành Viên', color: 'text-gray-600', bg: 'bg-gray-100', icon: <Award className='w-4 h-4' /> },
  silver: { label: 'Bạc', color: 'text-gray-500', bg: 'bg-gray-200', icon: <Star className='w-4 h-4' /> },
  gold: { label: 'Vàng', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Trophy className='w-4 h-4' /> },
  platinum: { label: 'Bạch Kim', color: 'text-[#1E40AF]', bg: 'bg-[#E8EDF5]', icon: <Crown className='w-4 h-4' /> },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLoyaltyPage() {
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([])
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [adjustTarget, setAdjustTarget] = useState<LoyaltyAccount | null>(null)
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add')
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustError, setAdjustError] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [programConfig, setProgramConfig] = useState<LoyaltyProgramConfig | null>(null)
  const [draftConfig, setDraftConfig] = useState<LoyaltyProgramConfig | null>(null)
  const [configError, setConfigError] = useState('')
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const LIMIT = 20

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient.get<any>('/loyalty/admin/stats')
      setStats(res.data.result)
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(filterTier !== 'all' && { tier: filterTier }),
        ...(searchTerm && { search: searchTerm })
      })
      const res = await apiClient.get<any>(`/loyalty/admin/accounts?${params}`)
      setAccounts(res.data.result.accounts || [])
      setTotal(res.data.result.pagination?.total || 0)
    } catch {
      setError('Không thể tải danh sách tài khoản loyalty')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProgramConfig = async () => {
    setConfigError('')
    try {
      const res = await apiClient.get<any>('/loyalty/admin/program-config')
      const published = res.data.result.published as LoyaltyProgramConfig
      const draft = res.data.result.draft as LoyaltyProgramConfig | null
      setProgramConfig(published)
      setDraftConfig(draft || { ...published, status: 'draft' })
    } catch {
      setConfigError('Không thể tải cấu hình loyalty program.')
    }
  }

  useEffect(() => {
    fetchStats()
    fetchAccounts()
    fetchProgramConfig()
  }, [page, filterTier])

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchAccounts() }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const formatPoints = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN')
  const totalPages = Math.ceil(total / LIMIT)

  const tiers: LoyaltyTier[] = ['member', 'silver', 'gold', 'platinum']

  const updateDraftField = (field: keyof LoyaltyProgramConfig, value: number) => {
    setDraftConfig(cfg => cfg ? { ...cfg, [field]: value } : cfg)
  }

  const updateDraftTier = (code: LoyaltyTier, field: keyof LoyaltyTierRule, value: string | number) => {
    setDraftConfig(cfg => cfg ? {
      ...cfg,
      tiers: cfg.tiers.map(tier => tier.code === code ? { ...tier, [field]: value } : tier)
    } : cfg)
  }

  const saveProgramDraft = async () => {
    if (!draftConfig) return
    setIsSavingConfig(true)
    setConfigError('')
    try {
      const res = await apiClient.put<any>('/loyalty/admin/program-config/draft', draftConfig)
      setDraftConfig(res.data.result)
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || 'Không thể lưu cấu hình loyalty.')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const publishProgramConfig = async () => {
    setIsSavingConfig(true)
    setConfigError('')
    try {
      const res = await apiClient.post<any>('/loyalty/admin/program-config/publish')
      setProgramConfig(res.data.result)
      setDraftConfig({ ...res.data.result, status: 'draft' })
      await Promise.all([fetchStats(), fetchAccounts()])
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || 'Không thể publish cấu hình loyalty.')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const openAdjustDialog = (account: LoyaltyAccount) => {
    setAdjustTarget(account)
    setAdjustAction('add')
    setAdjustPoints('')
    setAdjustReason('')
    setAdjustError('')
  }

  const submitAdjustment = async () => {
    if (!adjustTarget) return
    const points = Number(adjustPoints)
    if (!Number.isFinite(points) || points <= 0) {
      setAdjustError('Số điểm phải lớn hơn 0.')
      return
    }
    if (adjustReason.trim().length < 5) {
      setAdjustError('Vui lòng nhập lý do tối thiểu 5 ký tự.')
      return
    }

    setIsAdjusting(true)
    setAdjustError('')
    try {
      await apiClient.post(`/loyalty/admin/accounts/${adjustTarget.userId}/adjust-points`, {
        action: adjustAction,
        points,
        reason: adjustReason.trim()
      })
      setAdjustTarget(null)
      await Promise.all([fetchStats(), fetchAccounts()])
    } catch (err: any) {
      setAdjustError(err?.response?.data?.message || 'Không thể điều chỉnh điểm.')
    } finally {
      setIsAdjusting(false)
    }
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
            Loyalty & Điểm thưởng
          </h1>
          <p className='text-gray-600 mt-2 text-sm'>Quản lý tài khoản điểm thưởng và hạng thành viên</p>
        </div>
        <Button
          onClick={() => { fetchStats(); fetchAccounts() }}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] gap-2 text-white self-start sm:self-auto'
        >
          <RefreshCw className='w-4 h-4' />
          Cập nhật
        </Button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className='p-4 h-20 animate-pulse bg-gray-100 rounded' /></Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              {
                label: 'Tài khoản tích điểm',
                value: formatPoints(stats.totalAccounts),
                icon: <Users className='w-5 h-5' />,
                color: 'text-[#1E40AF] bg-[#E8EDF5]'
              },
              {
                label: 'Điểm đang lưu hành',
                value: formatPoints(stats.totalPointsCirculating),
                icon: <Sparkles className='w-5 h-5' />,
                color: 'text-[#1E40AF] bg-[#E8EDF5]'
              },
              {
                label: 'Tổng điểm đã tích',
                value: formatPoints(stats.totalPointsEverEarned),
                icon: <TrendingUp className='w-5 h-5' />,
                color: 'text-green-600 bg-green-100'
              },
              {
                label: 'Tổng điểm đã đổi',
                value: formatPoints(stats.totalPointsRedeemed),
                icon: <Gift className='w-5 h-5' />,
                color: 'text-orange-600 bg-orange-100'
              },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
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

          {/* Tier Distribution */}
          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <Crown className='w-5 h-5 text-[#1E40AF]' />
                Phân bổ hạng thành viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
                {tiers.map(tier => {
                  const cfg = TIER_CONFIG[tier]
                  const count = stats.tierBreakdown?.[tier] || 0
                  const pct = stats.totalAccounts > 0 ? Math.round((count / stats.totalAccounts) * 100) : 0
                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className='text-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors'
                    >
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <p className='font-semibold text-gray-900'>{cfg.label}</p>
                      <p className='text-2xl font-bold mt-1'>{count}</p>
                      <p className='text-xs text-gray-400'>{pct}%</p>
                      <Progress value={pct} className='mt-2 h-1.5' />
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <CardTitle className='text-base flex items-center gap-2'>
                <Sparkles className='w-5 h-5 text-[#1E40AF]' />
                Cấu hình chương trình loyalty
              </CardTitle>
              {programConfig && (
                <p className='text-xs text-gray-500 mt-1'>
                  Đang áp dụng version {programConfig.version} • {programConfig.pointsPerVnd.toLocaleString('vi-VN')}đ = 1 điểm • đổi tối đa {Math.round(programConfig.maxRedeemRatio * 100)}% đơn hàng
                </p>
              )}
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={saveProgramDraft} disabled={!draftConfig || isSavingConfig} className='gap-2'>
                <Save className='w-4 h-4' />
                Lưu nháp
              </Button>
              <Button size='sm' onClick={publishProgramConfig} disabled={!draftConfig || isSavingConfig} className='bg-[#0A2463] hover:bg-[#071A49] text-white gap-2'>
                <Upload className='w-4 h-4' />
                Publish
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {configError && (
            <div className='flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md'>
              <AlertCircle className='w-4 h-4 flex-shrink-0' />
              {configError}
            </div>
          )}

          {draftConfig ? (
            <>
              <div className='grid grid-cols-2 lg:grid-cols-5 gap-3'>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>VNĐ / 1 điểm</Label>
                  <Input type='number' min={1} value={draftConfig.pointsPerVnd} onChange={e => updateDraftField('pointsPerVnd', Number(e.target.value))} />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>1 điểm = VNĐ</Label>
                  <Input type='number' min={1} value={draftConfig.pointsToVnd} onChange={e => updateDraftField('pointsToVnd', Number(e.target.value))} />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Đổi tối đa (%)</Label>
                  <Input type='number' min={1} max={100} value={Math.round(draftConfig.maxRedeemRatio * 100)} onChange={e => updateDraftField('maxRedeemRatio', Number(e.target.value) / 100)} />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Điểm đổi tối thiểu</Label>
                  <Input type='number' min={0} value={draftConfig.minRedeem} onChange={e => updateDraftField('minRedeem', Number(e.target.value))} />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Hết hạn sau ngày</Label>
                  <Input type='number' min={1} value={draftConfig.expiryDays} onChange={e => updateDraftField('expiryDays', Number(e.target.value))} />
                </div>
              </div>

              <div className='overflow-x-auto rounded-lg border border-[#E8EDF5]'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-[#F0F6FF] text-blue-900'>
                      <th className='text-left p-3'>Hạng</th>
                      <th className='text-left p-3'>Tên hiển thị</th>
                      <th className='text-left p-3'>Chi tiêu tối thiểu</th>
                      <th className='text-left p-3'>Hệ số tích điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map(code => {
                      const tier = draftConfig.tiers.find(t => t.code === code)!
                      return (
                        <tr key={code} className='border-t border-[#E8EDF5]'>
                          <td className='p-3 font-medium'>{code}</td>
                          <td className='p-3'>
                            <Input value={tier.label} onChange={e => updateDraftTier(code, 'label', e.target.value)} />
                          </td>
                          <td className='p-3'>
                            <Input type='number' min={0} value={tier.minTotalSpent} onChange={e => updateDraftTier(code, 'minTotalSpent', Number(e.target.value))} />
                          </td>
                          <td className='p-3'>
                            <Input type='number' min={0.1} step={0.1} value={tier.multiplier} onChange={e => updateDraftTier(code, 'multiplier', Number(e.target.value))} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className='text-sm text-gray-500'>Đang tải cấu hình loyalty...</div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm theo tên, email...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
            />
          </div>
          <Select value={filterTier} onValueChange={v => { setFilterTier(v); setPage(1) }}>
            <SelectTrigger className='w-44 border-2 border-[#BFDBFE]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả hạng</SelectItem>
              {tiers.map(t => (
                <SelectItem key={t} value={t}>{TIER_CONFIG[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='text-base'>Tài khoản điểm thưởng ({total})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex items-center justify-center h-48 gap-3'>
              <Loader2 className='w-6 h-6 animate-spin text-[#1E40AF]' />
              <span className='text-gray-500'>Đang tải...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-48 gap-3 text-red-500'>
              <AlertCircle className='w-5 h-5' />{error}
            </div>
          ) : accounts.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <Sparkles className='w-12 h-12 mx-auto mb-3 opacity-30' />
              <p>Không có tài khoản nào</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='!border-b-2 !border-[#BFDBFE] bg-gray-50 text-gray-600'>
                    <th className='text-left p-3 pl-6'>Khách hàng</th>
                    <th className='text-left p-3'>Hạng</th>
                    <th className='text-left p-3'>Số dư điểm</th>
                    <th className='text-left p-3'>Tổng tích / Đổi</th>
                    <th className='text-left p-3'>Chi tiêu</th>
                    <th className='text-left p-3'>Ngày tạo</th>
                    <th className='text-right p-3 pr-6'>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => {
                    const tierCfg = TIER_CONFIG[acc.tier]
                    return (
                      <motion.tr
                        key={acc._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className='border-b-2 border-[#BFDBFE] hover:bg-[#F0F6FF]/30 transition-colors'
                      >
                        <td className='p-3 pl-6'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {acc.userInfo
                                ? `${acc.userInfo.lastName} ${acc.userInfo.firstName}`
                                : acc.userId}
                            </p>
                            {acc.userInfo?.email && (
                              <p className='text-xs text-gray-400'>{acc.userInfo.email}</p>
                            )}
                            <p className='text-xs text-gray-400 font-mono mt-0.5'>ID: {acc.userId}</p>
                          </div>
                        </td>
                        <td className='p-3'>
                          <Badge className={`${tierCfg.bg} ${tierCfg.color} border-0 gap-1 hover:${tierCfg.bg}`}>
                            {tierCfg.icon}
                            {tierCfg.label}
                          </Badge>
                        </td>
                        <td className='p-3'>
                          <p className='font-bold text-[#0A2463]'>{formatPoints(acc.pointsBalance)}</p>
                          <p className='text-xs text-gray-400'>điểm</p>
                        </td>
                        <td className='p-3 text-xs'>
                          <p className='text-green-600'>+{formatPoints(acc.totalPointsEarned)} tích</p>
                          <p className='text-[#1E40AF]'>-{formatPoints(acc.totalPointsRedeemed)} đổi</p>
                          {acc.totalPointsExpired > 0 && (
                            <p className='text-gray-400'>-{formatPoints(acc.totalPointsExpired)} hết hạn</p>
                          )}
                        </td>
                        <td className='p-3'>
                          <p className='font-semibold'>{formatCurrency(acc.totalSpent)}</p>
                        </td>
                        <td className='p-3 text-xs text-gray-500'>
                          <p>{formatDate(acc.createdAt)}</p>
                          <p className='text-gray-400'>Cập nhật: {formatDate(acc.updatedAt)}</p>
                        </td>
                        <td className='p-3 pr-6 text-right'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
                            onClick={() => openAdjustDialog(acc)}
                          >
                            Điều chỉnh điểm
                          </Button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-between px-6 py-4 border-t'>
              <p className='text-sm text-gray-500'>Trang {page}/{totalPages} — {total} tài khoản</p>
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

      <Dialog open={!!adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent className='sm:max-w-[420px] max-h-[90vh] overflow-y-auto p-5'>
          <DialogHeader className='space-y-1'>
            <DialogTitle className='text-lg'>Điều chỉnh điểm thưởng</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 py-1'>
            <div className='rounded-md bg-[#F0F6FF] border border-[#E8EDF5] px-3 py-2 text-sm'>
              <p className='font-medium text-gray-900'>
                {adjustTarget?.userInfo
                  ? `${adjustTarget.userInfo.lastName} ${adjustTarget.userInfo.firstName}`
                  : adjustTarget?.userId}
              </p>
              <p className='text-gray-500'>Số dư hiện tại: {formatPoints(adjustTarget?.pointsBalance || 0)} điểm</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Loại điều chỉnh</Label>
                <Select value={adjustAction} onValueChange={(value) => setAdjustAction(value as 'add' | 'subtract')}>
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='add'>Cộng điểm</SelectItem>
                    <SelectItem value='subtract'>Trừ điểm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Số điểm</Label>
                <Input
                  type='number'
                  min={1}
                  value={adjustPoints}
                  onChange={e => setAdjustPoints(e.target.value)}
                  placeholder='VD: 10000'
                  className='h-9'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Lý do điều chỉnh</Label>
              <Textarea
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                rows={2}
                placeholder='VD: Bù điểm do lỗi hoàn tiền đơn hàng...'
                className='min-h-[76px] resize-none'
              />
            </div>

            {adjustError && (
              <div className='flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md'>
                <AlertCircle className='w-4 h-4 flex-shrink-0' />
                {adjustError}
              </div>
            )}
          </div>
          <DialogFooter className='gap-2 sm:gap-2 pt-1'>
            <Button variant='outline' size='sm' onClick={() => setAdjustTarget(null)}>Hủy</Button>
            <Button
              size='sm'
              onClick={submitAdjustment}
              disabled={isAdjusting}
              className='bg-[#0A2463] hover:bg-[#071A49] text-white'
            >
              {isAdjusting ? 'Đang lưu...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
