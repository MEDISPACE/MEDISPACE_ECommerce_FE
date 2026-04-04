import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Users, TrendingUp, Award, Trophy, Star,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw,
  Search, Crown, Gift, Clock
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
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

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  member: { label: 'Thành Viên', color: 'text-gray-600', bg: 'bg-gray-100', icon: <Award className='w-4 h-4' /> },
  silver: { label: 'Bạc', color: 'text-gray-500', bg: 'bg-gray-200', icon: <Star className='w-4 h-4' /> },
  gold: { label: 'Vàng', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Trophy className='w-4 h-4' /> },
  platinum: { label: 'Bạch Kim', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Crown className='w-4 h-4' /> },
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

  useEffect(() => {
    fetchStats()
    fetchAccounts()
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Loyalty & Điểm thưởng</h1>
          <p className='text-gray-500 text-sm mt-1'>Quản lý tài khoản điểm thưởng và hạng thành viên</p>
        </div>
        <Button variant='outline' onClick={() => { fetchStats(); fetchAccounts() }} className='gap-2 self-start'>
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
                color: 'text-blue-600 bg-blue-100'
              },
              {
                label: 'Điểm đang lưu hành',
                value: formatPoints(stats.totalPointsCirculating),
                icon: <Sparkles className='w-5 h-5' />,
                color: 'text-purple-600 bg-purple-100'
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

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <Crown className='w-5 h-5 text-purple-500' />
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

      {/* Filters */}
      <Card>
        <CardContent className='p-4 flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm theo tên, email...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={filterTier} onValueChange={v => { setFilterTier(v); setPage(1) }}>
            <SelectTrigger className='w-44'>
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
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tài khoản điểm thưởng ({total})</CardTitle>
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
          ) : accounts.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <Sparkles className='w-12 h-12 mx-auto mb-3 opacity-30' />
              <p>Không có tài khoản nào</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-gray-50 text-gray-600'>
                    <th className='text-left p-3 pl-6'>Khách hàng</th>
                    <th className='text-left p-3'>Hạng</th>
                    <th className='text-left p-3'>Số dư điểm</th>
                    <th className='text-left p-3'>Tổng tích / Đổi</th>
                    <th className='text-left p-3'>Chi tiêu</th>
                    <th className='text-left p-3'>Ngày tạo</th>
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
                        className='border-b hover:bg-gray-50 transition-colors'
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
                          </div>
                        </td>
                        <td className='p-3'>
                          <Badge className={`${tierCfg.bg} ${tierCfg.color} border-0 gap-1 hover:${tierCfg.bg}`}>
                            {tierCfg.icon}
                            {tierCfg.label}
                          </Badge>
                        </td>
                        <td className='p-3'>
                          <p className='font-bold text-purple-700'>{formatPoints(acc.pointsBalance)}</p>
                          <p className='text-xs text-gray-400'>điểm</p>
                        </td>
                        <td className='p-3 text-xs'>
                          <p className='text-green-600'>+{formatPoints(acc.totalPointsEarned)} tích</p>
                          <p className='text-blue-600'>-{formatPoints(acc.totalPointsRedeemed)} đổi</p>
                          {acc.totalPointsExpired > 0 && (
                            <p className='text-gray-400'>-{formatPoints(acc.totalPointsExpired)} hết hạn</p>
                          )}
                        </td>
                        <td className='p-3'>
                          <p className='font-semibold'>{formatCurrency(acc.totalSpent)}</p>
                        </td>
                        <td className='p-3 text-xs text-gray-500'>
                          {formatDate(acc.createdAt)}
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
    </div>
  )
}
