import { useState } from 'react'

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
  Users,
  Calendar,
  Zap,
  Trophy,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface RewardTransaction {
  id: string
  type: 'earn' | 'redeem'
  points: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'expired'
}

interface RewardTier {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  benefits: string[]
  icon: React.ReactNode
}

interface VoucherOffer {
  id: string
  title: string
  description: string
  pointsCost: number
  discount: string
  validUntil: string
  category: string
  available: number
}

export function RewardsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock user rewards data
  const userPoints = 2850
  const lifetimePoints = 5420
  const currentTierIndex = 2 // Silver
  const pointsToNextTier = 1150 // To Gold (4000 - 2850)

  const rewardTiers: RewardTier[] = [
    {
      name: 'Đồng',
      minPoints: 0,
      maxPoints: 999,
      color: 'from-orange-600 to-amber-700',
      icon: <Award className='w-6 h-6' />,
      benefits: ['Tích điểm cơ bản', 'Ưu đãi sinh nhật'],
    },
    {
      name: 'Bạc',
      minPoints: 1000,
      maxPoints: 2999,
      color: 'from-gray-400 to-gray-600',
      icon: <Star className='w-6 h-6' />,
      benefits: ['Tích điểm x1.2', 'Ưu đãi sinh nhật', 'Miễn phí vận chuyển 2 lần/tháng'],
    },
    {
      name: 'Vàng',
      minPoints: 3000,
      maxPoints: 5999,
      color: 'from-yellow-400 to-yellow-600',
      icon: <Trophy className='w-6 h-6' />,
      benefits: [
        'Tích điểm x1.5',
        'Ưu đãi sinh nhật VIP',
        'Miễn phí vận chuyển không giới hạn',
        'Tư vấn dược sĩ ưu tiên',
      ],
    },
    {
      name: 'Kim cương',
      minPoints: 6000,
      maxPoints: Infinity,
      color: 'from-blue-400 to-purple-600',
      icon: <Sparkles className='w-6 h-6' />,
      benefits: [
        'Tích điểm x2',
        'Ưu đãi sinh nhật VIP',
        'Miễn phí vận chuyển không giới hạn',
        'Tư vấn dược sĩ 24/7',
        'Ưu đãi đặc biệt từ đối tác',
      ],
    },
  ]

  const currentTier = rewardTiers[currentTierIndex]
  const nextTier = rewardTiers[currentTierIndex + 1]
  const tierProgress = nextTier
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  const recentTransactions: RewardTransaction[] = [
    {
      id: '1',
      type: 'earn',
      points: 150,
      description: 'Mua đơn hàng #ORD-2024-001',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'redeem',
      points: -500,
      description: 'Đổi voucher giảm 50.000đ',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '3',
      type: 'earn',
      points: 200,
      description: 'Mua đơn hàng #ORD-2024-000',
      date: '2024-01-10',
      status: 'completed',
    },
    {
      id: '4',
      type: 'earn',
      points: 100,
      description: 'Giới thiệu bạn bè thành công',
      date: '2024-01-08',
      status: 'completed',
    },
    {
      id: '5',
      type: 'earn',
      points: 50,
      description: 'Đánh giá sản phẩm',
      date: '2024-01-05',
      status: 'completed',
    },
  ]

  const voucherOffers: VoucherOffer[] = [
    {
      id: 'v1',
      title: 'Giảm 50.000đ',
      description: 'Cho đơn hàng từ 300.000đ',
      pointsCost: 500,
      discount: '50.000đ',
      validUntil: '31/03/2024',
      category: 'all',
      available: 15,
    },
    {
      id: 'v2',
      title: 'Giảm 100.000đ',
      description: 'Cho đơn hàng từ 500.000đ',
      pointsCost: 900,
      discount: '100.000đ',
      validUntil: '31/03/2024',
      category: 'all',
      available: 8,
    },
    {
      id: 'v3',
      title: 'Miễn phí vận chuyển',
      description: 'Áp dụng cho mọi đơn hàng',
      pointsCost: 300,
      discount: '0đ phí ship',
      validUntil: '31/03/2024',
      category: 'shipping',
      available: 20,
    },
    {
      id: 'v4',
      title: 'Giảm 20%',
      description: 'Cho Thực phẩm chức năng',
      pointsCost: 700,
      discount: '20%',
      validUntil: '31/03/2024',
      category: 'supplement',
      available: 10,
    },
    {
      id: 'v5',
      title: 'Giảm 15%',
      description: 'Cho Dược mỹ phẩm',
      pointsCost: 600,
      discount: '15%',
      validUntil: '31/03/2024',
      category: 'cosmetic',
      available: 12,
    },
    {
      id: 'v6',
      title: 'Giảm 200.000đ',
      description: 'Cho đơn hàng từ 1.000.000đ',
      pointsCost: 1500,
      discount: '200.000đ',
      validUntil: '31/03/2024',
      category: 'all',
      available: 5,
    },
  ]

  const earnPointsWays = [
    {
      icon: <ShoppingBag className='w-8 h-8 text-blue-600' />,
      title: 'Mua sắm',
      description: '1 điểm cho mỗi 10.000đ',
      points: '1-10 điểm',
    },
    {
      icon: <Users className='w-8 h-8 text-green-600' />,
      title: 'Giới thiệu bạn bè',
      description: 'Bạn bè đăng ký thành công',
      points: '100 điểm',
    },
    {
      icon: <Star className='w-8 h-8 text-yellow-600' />,
      title: 'Đánh giá sản phẩm',
      description: 'Chia sẻ trải nghiệm',
      points: '50 điểm',
    },
    {
      icon: <Calendar className='w-8 h-8 text-purple-600' />,
      title: 'Check-in hàng ngày',
      description: 'Đăng nhập liên tục 7 ngày',
      points: '20 điểm',
    },
  ]

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
          <Button className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
            <Gift className='w-4 h-4 mr-2' />
            Lịch sử đổi quà
          </Button>
        </div>

        {/* Points Overview Card */}
        <Card className='bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white border-0 shadow-2xl overflow-hidden relative'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24'></div>

          <CardContent className='p-8 relative z-10'>
            <div className='grid md:grid-cols-3 gap-8'>
              {/* Total Points */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <Sparkles className='w-5 h-5' />
                  <span className='text-sm'>Điểm hiện tại</span>
                </div>
                <div className='text-5xl mb-1'>{userPoints.toLocaleString()}</div>
                <p className='text-sm opacity-75'>điểm</p>
              </div>

              {/* Current Tier */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <Trophy className='w-5 h-5' />
                  <span className='text-sm'>Hạng thành viên</span>
                </div>
                <div className='flex items-center gap-3 mb-1'>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${currentTier.color} rounded-full flex items-center justify-center`}
                  >
                    {currentTier.icon}
                  </div>
                  <div>
                    <div className='text-2xl'>{currentTier.name}</div>
                  </div>
                </div>
              </div>

              {/* Lifetime Points */}
              <div>
                <div className='flex items-center gap-2 mb-2 opacity-90'>
                  <TrendingUp className='w-5 h-5' />
                  <span className='text-sm'>Tổng điểm tích lũy</span>
                </div>
                <div className='text-5xl mb-1'>{lifetimePoints.toLocaleString()}</div>
                <p className='text-sm opacity-75'>điểm</p>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className='mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl'>
                <div className='flex items-center justify-between mb-2 text-sm'>
                  <span>Tiến độ lên hạng {nextTier.name}</span>
                  <span>{pointsToNextTier.toLocaleString()} điểm nữa</span>
                </div>
                <Progress value={tierProgress} className='h-2 bg-white/20' />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='inline-flex w-full overflow-x-auto bg-blue-100 p-1 rounded-lg shadow-sm scrollbar-hide'>
            <TabsTrigger
              value='overview'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                <Award className='w-4 h-4' />
                Tổng quan
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='vouchers'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                <Gift className='w-4 h-4' />
                Đổi quà
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='earn'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                <Zap className='w-4 h-4' />
                Cách tích điểm
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='history'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                <Clock className='w-4 h-4' />
                Lịch sử
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Membership Tiers */}
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='w-6 h-6 text-blue-600' />
                  Các hạng thành viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-4 gap-4'>
                  {rewardTiers.map((tier, index) => (
                    <motion.div
                      key={tier.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`relative overflow-hidden ${
                          index === currentTierIndex ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'
                        }`}
                      >
                        {index === currentTierIndex && (
                          <div className='absolute top-2 right-2'>
                            <Badge className='bg-blue-600'>Hạng hiện tại</Badge>
                          </div>
                        )}
                        <CardContent className='p-4 text-center'>
                          <div
                            className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center text-white`}
                          >
                            {tier.icon}
                          </div>
                          <h3 className='mb-2'>{tier.name}</h3>
                          <p className='text-xs text-gray-500 mb-3'>
                            {tier.minPoints.toLocaleString()} -{' '}
                            {tier.maxPoints === Infinity ? '∞' : tier.maxPoints.toLocaleString()} điểm
                          </p>
                          <div className='text-left space-y-1'>
                            {tier.benefits.map((benefit, i) => (
                              <p key={i} className='text-xs text-gray-600 flex items-start gap-1'>
                                <CheckCircle className='w-3 h-3 text-green-600 mt-0.5 flex-shrink-0' />
                                <span>{benefit}</span>
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Điểm sắp hết hạn</p>
                      <p className='text-3xl text-blue-600'>0</p>
                    </div>
                    <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                      <Clock className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Voucher đã đổi</p>
                      <p className='text-3xl text-green-600'>8</p>
                    </div>
                    <div className='w-12 h-12 bg-green-600 rounded-full flex items-center justify-center'>
                      <Gift className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Điểm tháng này</p>
                      <p className='text-3xl text-purple-600'>+450</p>
                    </div>
                    <div className='w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center'>
                      <TrendingUp className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vouchers Tab */}
          <TabsContent value='vouchers' className='space-y-4'>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {voucherOffers.map((voucher, index) => (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between mb-3'>
                        <Badge className='bg-blue-600 text-white'>{voucher.pointsCost} điểm</Badge>
                        <Badge variant='outline' className='text-xs'>
                          Còn {voucher.available}
                        </Badge>
                      </div>
                      <h3 className='text-lg mb-1'>{voucher.title}</h3>
                      <p className='text-sm text-gray-600 mb-3'>{voucher.description}</p>
                      <div className='flex items-center justify-between text-xs text-gray-500 mb-4'>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          HSD: {voucher.validUntil}
                        </span>
                      </div>
                      <Button
                        className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        disabled={userPoints < voucher.pointsCost}
                      >
                        {userPoints >= voucher.pointsCost ? 'Đổi ngay' : 'Chưa đủ điểm'}
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Earn Points Tab */}
          <TabsContent value='earn' className='space-y-6'>
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='w-6 h-6 text-yellow-600' />
                  Các cách tích điểm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-2 gap-6'>
                  {earnPointsWays.map((way, index) => (
                    <motion.div
                      key={way.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors'
                    >
                      <div className='flex-shrink-0'>{way.icon}</div>
                      <div className='flex-1'>
                        <h3 className='mb-1'>{way.title}</h3>
                        <p className='text-sm text-gray-600 mb-2'>{way.description}</p>
                        <Badge className='bg-blue-600 text-white'>{way.points}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'>
              <CardContent className='p-6'>
                <div className='flex gap-3'>
                  <Info className='w-6 h-6 text-yellow-600 flex-shrink-0' />
                  <div>
                    <h3 className='mb-2 text-yellow-900'>Mẹo tích điểm nhanh</h3>
                    <ul className='space-y-1 text-sm text-yellow-800'>
                      <li>• Mua sắm vào ngày sinh nhật để nhận điểm x2</li>
                      <li>• Tham gia các chương trình khuyến mãi đặc biệt</li>
                      <li>• Đánh giá sản phẩm sau khi mua để tích thêm điểm</li>
                      <li>• Giới thiệu bạn bè để nhận 100 điểm/người</li>
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
                <div className='space-y-3'>
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className='flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {transaction.type === 'earn' ? (
                            <TrendingUp className='w-5 h-5' />
                          ) : (
                            <Gift className='w-5 h-5' />
                          )}
                        </div>
                        <div>
                          <p className='font-medium'>{transaction.description}</p>
                          <p className='text-sm text-gray-500'>{transaction.date}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p
                          className={`text-lg font-semibold ${
                            transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'earn' ? '+' : ''}
                          {transaction.points.toLocaleString()}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'}>
                          {transaction.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedPageTransition>
  )
}
