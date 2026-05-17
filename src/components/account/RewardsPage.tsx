import { useState, useEffect } from 'react'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Gift,
  Star,
  TrendingUp,
  Clock,
  Award,
  CheckCircle,
  ShoppingBag,
  Zap,
  Trophy,
  Sparkles,
  Info,
  Loader2,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '../../services/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────

type LoyaltyTier = 'member' | 'silver' | 'gold' | 'platinum'

interface AccountInfo {
  pointsBalance: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  tier: LoyaltyTier
  tierLabel: string
  totalSpent: number
  multiplier: number
  nextTier: LoyaltyTier | null
  nextTierLabel: string | null
  nextTierThreshold: number | null
  progressToNextTier: number
  amountToNextTier: number
  config: {
    pointsPerVnd: number
    maxRedeemRatio: number
    expiryDays: number
    minRedeem: number
    pointsToVnd: number
  }
}

interface LoyaltyTransaction {
  _id: string
  type: 'earn' | 'redeem' | 'expire' | 'revoke'
  points: number
  balanceAfter: number
  description: string
  createdAt: string
  orderId?: string
  isExpired?: boolean
}

// ─── Tier config (UI display) ──────────────────────────────────────────────────

const TIER_CONFIG: Record<
  LoyaltyTier,
  { label: string; color: string; bg: string; icon: React.ReactNode; benefits: string[]; threshold: string }
> = {
  member: {
    label: 'Thành Viên',
    color: 'from-gray-400 to-slate-500',
    bg: 'from-gray-50 to-slate-100',
    threshold: '0đ',
    icon: <Award className='w-6 h-6' />,
    benefits: ['Tích điểm cơ bản (x1)', 'Ưu đãi sinh nhật'],
  },
  silver: {
    label: 'Bạc',
    color: 'from-gray-300 to-gray-500',
    bg: 'from-gray-50 to-gray-100',
    threshold: '2.000.000đ',
    icon: <Star className='w-6 h-6' />,
    benefits: ['Tích điểm x1.2', 'Ưu đãi sinh nhật', 'Freeship 2 lần/tháng'],
  },
  gold: {
    label: 'Vàng',
    color: 'from-yellow-400 to-amber-500',
    bg: 'from-yellow-50 to-amber-50',
    threshold: '10.000.000đ',
    icon: <Trophy className='w-6 h-6' />,
    benefits: ['Tích điểm x1.5', 'Ưu đãi sinh nhật VIP', 'Freeship không giới hạn', 'Tư vấn dược sĩ ưu tiên'],
  },
  platinum: {
    label: 'Bạch Kim',
    color: 'from-blue-400 to-purple-500',
    bg: 'from-blue-50 to-purple-50',
    threshold: '50.000.000đ',
    icon: <Sparkles className='w-6 h-6' />,
    benefits: ['Tích điểm x2', 'Ưu đãi sinh nhật VIP', 'Freeship không giới hạn', 'Tư vấn 24/7', 'Ưu đãi đặc biệt'],
  },
}

const TRANSACTION_ICONS: Record<string, React.ReactNode> = {
  earn: <TrendingUp className='w-5 h-5' />,
  redeem: <Gift className='w-5 h-5' />,
  expire: <Clock className='w-5 h-5' />,
  revoke: <TrendingDown className='w-5 h-5' />,
}

const TRANSACTION_COLORS: Record<string, string> = {
  earn: 'bg-green-100 text-green-600',
  redeem: 'bg-blue-100 text-blue-600',
  expire: 'bg-gray-100 text-gray-500',
  revoke: 'bg-red-100 text-red-600',
}

const TRANSACTION_LABELS: Record<string, string> = {
  earn: 'Tích điểm',
  redeem: 'Đổi điểm',
  expire: 'Hết hạn',
  revoke: 'Thu hồi',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RewardsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)
  const [txLoading, setTxLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAccount = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiClient.get<{ result: AccountInfo }>('/loyalty/account')
      setAccount(res.data.result)
    } catch {
      setError('Không thể tải thông tin điểm thưởng. Vui lòng đăng nhập để xem.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransactions = async (page = 1) => {
    setTxLoading(true)
    try {
      const res = await apiClient.get<{
        result: { transactions: LoyaltyTransaction[]; pagination: { total: number } }
      }>(`/loyalty/transactions?page=${page}&limit=15`)
      if (page === 1) {
        setTransactions(res.data.result.transactions)
      } else {
        setTransactions(prev => [...prev, ...res.data.result.transactions])
      }
      setTxTotal(res.data.result.pagination.total)
      setTxPage(page)
    } catch {
      // silently fail on tab load
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => {
    fetchAccount()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions(1)
    }
  }, [activeTab])

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const formatPoints = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (isLoading) {
    return (
      <EnhancedPageTransition>
        <div className='flex flex-col items-center justify-center h-64 gap-4'>
          <Loader2 className='w-10 h-10 animate-spin text-blue-600' />
          <p className='text-gray-500'>Đang tải thông tin điểm thưởng...</p>
        </div>
      </EnhancedPageTransition>
    )
  }

  if (error || !account) {
    return (
      <EnhancedPageTransition>
        <div className='flex flex-col items-center justify-center h-64 gap-4'>
          <AlertCircle className='w-10 h-10 text-red-400' />
          <p className='text-gray-600'>{error || 'Không thể tải dữ liệu.'}</p>
          <Button onClick={fetchAccount} variant='outline' className='gap-2'>
            <RefreshCw className='w-4 h-4' />
            Thử lại
          </Button>
        </div>
      </EnhancedPageTransition>
    )
  }

  const tier = account.tier
  const tierConfig = TIER_CONFIG[tier]
  const nextTierConfig = account.nextTier ? TIER_CONFIG[account.nextTier] : null
  const tiers: LoyaltyTier[] = ['member', 'silver', 'gold', 'platinum']

  return (
    <EnhancedPageTransition>
      <div className='space-y-6'>
        {/* Page Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Điểm thưởng của tôi
            </h1>
            <p className='text-gray-600'>Tích điểm mỗi lần mua sắm và nhận nhiều ưu đãi hấp dẫn</p>
          </div>
          <Button onClick={fetchAccount} variant='outline' size='sm' className='gap-2 hidden sm:flex'>
            <RefreshCw className='w-4 h-4' />
            Cập nhật
          </Button>
        </div>

        {/* Hero Card */}
        <Card className='bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white border-0 shadow-2xl overflow-hidden relative'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32' />
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24' />

          <CardContent className='p-8 relative z-10'>
            <div className='grid md:grid-cols-3 gap-8'>
              {/* Points balance */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <Sparkles className='w-5 h-5' />
                  <span className='text-sm'>Điểm hiện tại</span>
                </div>
                <div className='text-5xl font-bold mb-1'>{formatPoints(account.pointsBalance)}</div>
                <p className='text-sm opacity-75'>điểm ≈ {formatCurrency(account.pointsBalance)}</p>
              </div>

              {/* Tier */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <Trophy className='w-5 h-5' />
                  <span className='text-sm'>Hạng thành viên</span>
                </div>
                <div className='flex items-center gap-3 mb-1'>
                  <div className={`w-12 h-12 bg-gradient-to-br ${tierConfig.color} rounded-full flex items-center justify-center`}>
                    {tierConfig.icon}
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>{tierConfig.label}</div>
                    <div className='text-sm opacity-75'>x{account.multiplier} nhân điểm</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <TrendingUp className='w-5 h-5' />
                  <span className='text-sm'>Tổng điểm tích lũy</span>
                </div>
                <div className='text-5xl font-bold mb-1'>{formatPoints(account.totalPointsEarned)}</div>
                <p className='text-sm opacity-75'>Chi tiêu: {formatCurrency(account.totalSpent)}</p>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTierConfig && account.nextTierThreshold && (
              <div className='mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl'>
                <div className='flex items-center justify-between mb-2 text-sm'>
                  <span>Tiến độ lên hạng <strong>{nextTierConfig.label}</strong></span>
                  <span>Còn {formatCurrency(account.amountToNextTier)}</span>
                </div>
                <Progress value={account.progressToNextTier} className='h-2 bg-white/20' />
              </div>
            )}
            {!account.nextTier && (
              <div className='mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl text-center text-sm'>
                🏆 Bạn đã đạt hạng cao nhất — <strong>Bạch Kim</strong>!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='inline-flex w-full overflow-x-auto bg-blue-100 p-1 rounded-lg shadow-sm scrollbar-hide'>
            {[
              { value: 'overview', icon: <Award className='w-4 h-4' />, label: 'Tổng quan' },
              { value: 'earn', icon: <Zap className='w-4 h-4' />, label: 'Cách tích điểm' },
              { value: 'history', icon: <Clock className='w-4 h-4' />, label: 'Lịch sử' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  {tab.icon}
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Tier cards */}
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='w-6 h-6 text-blue-600' />
                  Các hạng thành viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-4 gap-4'>
                  {tiers.map((t, idx) => {
                    const cfg = TIER_CONFIG[t]
                    const isCurrent = t === tier
                    return (
                      <motion.div
                        key={t}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className={`relative overflow-hidden ${isCurrent ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'}`}>
                          {isCurrent && (
                            <div className='absolute top-2 right-2'>
                              <Badge className='bg-blue-600 text-xs'>Hiện tại</Badge>
                            </div>
                          )}
                          <CardContent className='p-4 text-center'>
                            <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${cfg.color} rounded-full flex items-center justify-center text-white`}>
                              {cfg.icon}
                            </div>
                            <h3 className='font-semibold mb-1'>{cfg.label}</h3>
                            <p className='text-xs text-gray-400 mb-3'>Chi tiêu từ {cfg.threshold}</p>
                            <div className='text-left space-y-1'>
                              {cfg.benefits.map((b, i) => (
                                <p key={i} className='text-xs text-gray-600 flex items-start gap-1'>
                                  <CheckCircle className='w-3 h-3 text-green-600 mt-0.5 flex-shrink-0' />
                                  {b}
                                </p>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Điểm đã đổi</p>
                      <p className='text-3xl font-bold text-blue-600'>{formatPoints(account.totalPointsRedeemed)}</p>
                    </div>
                    <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                      <Gift className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Tổng điểm tích</p>
                      <p className='text-3xl font-bold text-purple-600'>{formatPoints(account.totalPointsEarned)}</p>
                    </div>
                    <div className='w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center'>
                      <TrendingUp className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Số dư điểm</p>
                      <p className='text-3xl font-bold text-green-600'>{formatPoints(account.pointsBalance)}</p>
                    </div>
                    <div className='w-12 h-12 bg-green-600 rounded-full flex items-center justify-center'>
                      <Sparkles className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Earn Points Tab */}
          <TabsContent value='earn' className='space-y-6'>
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='w-6 h-6 text-yellow-600' />
                  Cách tích điểm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-2 gap-6'>
                  {[
                    {
                      icon: <ShoppingBag className='w-8 h-8 text-blue-600' />,
                      title: 'Mua sắm',
                      description: `Tích 1 điểm / ${new Intl.NumberFormat('vi-VN').format(account.config.pointsPerVnd)}đ mua hàng`,
                      badge: `Hạng ${tierConfig.label}: x${account.multiplier}`,
                    },
                    {
                      icon: <Sparkles className='w-8 h-8 text-purple-600' />,
                      title: 'Nâng hạng thành viên',
                      description: 'Nhân điểm cao hơn khi lên hạng Silver, Gold, Platinum',
                      badge: 'x1 → x1.2 → x1.5 → x2',
                    },
                    {
                      icon: <Clock className='w-8 h-8 text-orange-600' />,
                      title: 'Thời hạn điểm',
                      description: `Điểm hết hạn sau ${account.config.expiryDays} ngày kể từ ngày tích`,
                      badge: `${account.config.expiryDays} ngày`,
                    },
                    {
                      icon: <Gift className='w-8 h-8 text-green-600' />,
                      title: 'Đổi điểm',
                      description: `Tối thiểu ${new Intl.NumberFormat('vi-VN').format(account.config.minRedeem)} điểm, tối đa ${account.config.maxRedeemRatio * 100}% giá trị đơn`,
                      badge: '1 điểm = 1đ',
                    },
                  ].map((way, index) => (
                    <motion.div
                      key={way.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors'
                    >
                      <div className='flex-shrink-0'>{way.icon}</div>
                      <div className='flex-1'>
                        <h3 className='font-semibold mb-1'>{way.title}</h3>
                        <p className='text-sm text-gray-600 mb-2'>{way.description}</p>
                        <Badge className='bg-blue-600 text-white text-xs'>{way.badge}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'>
              <CardContent className='p-6'>
                <div className='flex gap-3'>
                  <Info className='w-6 h-6 text-yellow-600 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold mb-2 text-yellow-900'>Lưu ý quan trọng</h3>
                    <ul className='space-y-1 text-sm text-yellow-800'>
                      <li>• Điểm được tích sau khi đơn hàng được giao thành công</li>
                      <li>• Khi hoàn trả đơn hàng, điểm đã tích sẽ bị thu hồi</li>
                      <li>• Điểm đổi giảm tối đa {account.config.maxRedeemRatio * 100}% giá trị đơn hàng</li>
                      <li>• Điểm hết hạn sau {account.config.expiryDays} ngày từ ngày tích lũy</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value='history' className='space-y-4'>
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch điểm</CardTitle>
              </CardHeader>
              <CardContent>
                {txLoading && transactions.length === 0 ? (
                  <div className='flex items-center justify-center h-32 gap-3'>
                    <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
                    <span className='text-gray-500'>Đang tải lịch sử...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className='text-center py-12 text-gray-400'>
                    <Gift className='w-12 h-12 mx-auto mb-3 opacity-30' />
                    <p>Chưa có giao dịch điểm nào</p>
                    <p className='text-sm mt-1'>Mua sắm để bắt đầu tích điểm!</p>
                  </div>
                ) : (
                  <>
                    <div className='space-y-3'>
                      {transactions.map((tx, idx) => {
                        const isPositive = tx.points > 0
                        return (
                          <motion.div
                            key={tx._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className='flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors'
                          >
                            <div className='flex items-center gap-4'>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${TRANSACTION_COLORS[tx.type]}`}>
                                {TRANSACTION_ICONS[tx.type]}
                              </div>
                              <div>
                                <p className='font-medium text-sm'>{tx.description}</p>
                                <p className='text-xs text-gray-400'>{formatDate(tx.createdAt)}</p>
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{formatPoints(tx.points)} điểm
                              </p>
                              <p className='text-xs text-gray-400'>Số dư: {formatPoints(tx.balanceAfter)}</p>
                              <Badge
                                variant='outline'
                                className='text-xs mt-1'
                              >
                                {TRANSACTION_LABELS[tx.type] || tx.type}
                              </Badge>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Load more */}
                    {transactions.length < txTotal && (
                      <div className='mt-4 text-center'>
                        <Button
                          variant='outline'
                          onClick={() => fetchTransactions(txPage + 1)}
                          disabled={txLoading}
                          className='gap-2'
                        >
                          {txLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
                          Xem thêm ({txTotal - transactions.length} giao dịch)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedPageTransition>
  )
}
