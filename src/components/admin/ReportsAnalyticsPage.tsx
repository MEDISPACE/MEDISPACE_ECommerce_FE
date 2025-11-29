import { useState } from 'react'
import { TrendingUp, Users, ShoppingCart, FileText, DollarSign, Package, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export function ReportsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')

  // Mock data
  const stats = {
    totalRevenue: 156800000,
    revenueGrowth: 18.5,
    totalOrders: 1245,
    ordersGrowth: 12.3,
    totalUsers: 3420,
    usersGrowth: 24.1,
    totalProducts: 892,
    productsGrowth: 5.2,
    avgOrderValue: 125900,
    conversionRate: 3.8,
    customerRetention: 68.5,
    topProducts: [
      { name: 'Paracetamol 500mg', sales: 450, revenue: 900000 },
      { name: 'Vitamin C 1000mg', sales: 380, revenue: 3800000 },
      { name: 'Amoxicillin 500mg', sales: 320, revenue: 3840000 },
    ],
    salesByCategory: [
      { category: 'Thuốc kê đơn', value: 45, amount: 70560000 },
      { category: 'Thuốc không kê đơn', value: 30, amount: 47040000 },
      { category: 'Thực phẩm chức năng', value: 25, amount: 39200000 },
    ],
    monthlyRevenue: [
      { month: 'T1', revenue: 145000000 },
      { month: 'T2', revenue: 152000000 },
      { month: 'T3', revenue: 156800000 },
    ],
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1
              className='text-3xl font-bold bg-clip-text text-transparent'
              style={{
                backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
              }}
            >
              Báo cáo & Phân tích
            </h1>
            <p className='text-gray-600 mt-1'>Dashboard tổng quan về doanh thu và hoạt động kinh doanh</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-40 border-2 border-blue-200'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='week'>Tuần này</SelectItem>
              <SelectItem value='month'>Tháng này</SelectItem>
              <SelectItem value='quarter'>Quý này</SelectItem>
              <SelectItem value='year'>Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign className='w-5 h-5 text-blue-600' />
              <span className='text-sm text-blue-800'>Doanh thu</span>
            </div>
            <p className='text-2xl text-blue-900'>{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            <p className='text-xs text-blue-600 mt-1'>+{stats.revenueGrowth}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <ShoppingCart className='w-5 h-5 text-green-600' />
              <span className='text-sm text-green-800'>Đơn hàng</span>
            </div>
            <p className='text-2xl text-green-900'>{stats.totalOrders}</p>
            <p className='text-xs text-green-600 mt-1'>+{stats.ordersGrowth}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Users className='w-5 h-5 text-[#0066CC]' />
              <span className='text-sm text-[#0066CC]'>Người dùng</span>
            </div>
            <p className='text-2xl text-[#0066CC]'>{stats.totalUsers}</p>
            <p className='text-xs text-[#4A90E2] mt-1'>+{stats.usersGrowth}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Package className='w-5 h-5 text-orange-600' />
              <span className='text-sm text-orange-800'>Sản phẩm</span>
            </div>
            <p className='text-2xl text-orange-900'>{stats.totalProducts}</p>
            <p className='text-xs text-orange-600 mt-1'>+{stats.productsGrowth}% so với kỳ trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <TabsList className='grid w-full grid-cols-4 bg-blue-50'>
            <TabsTrigger value='overview'>Tổng quan</TabsTrigger>
            <TabsTrigger value='sales'>Doanh số</TabsTrigger>
            <TabsTrigger value='customers'>Khách hàng</TabsTrigger>
            <TabsTrigger value='products'>Sản phẩm</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6 mt-6'>
            {/* Revenue Chart */}
            <div>
              <h3 className='text-blue-900 mb-4'>Doanh thu 3 tháng gần nhất</h3>
              <div className='space-y-4'>
                {stats.monthlyRevenue.map((item, idx) => (
                  <div key={idx}>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-700'>{item.month}</span>
                      <span className='text-sm text-blue-600'>{(item.revenue / 1000000).toFixed(1)}M ₫</span>
                    </div>
                    <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all'
                        style={{ width: `${(item.revenue / 160000000) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='border border-blue-200'>
                <CardContent className='p-4 text-center'>
                  <Activity className='w-8 h-8 mx-auto text-blue-600 mb-2' />
                  <p className='text-sm text-gray-600'>Giá trị đơn TB</p>
                  <p className='text-xl text-blue-900 mt-1'>{stats.avgOrderValue.toLocaleString()}₫</p>
                </CardContent>
              </Card>

              <Card className='border border-green-200'>
                <CardContent className='p-4 text-center'>
                  <TrendingUp className='w-8 h-8 mx-auto text-green-600 mb-2' />
                  <p className='text-sm text-gray-600'>Tỷ lệ chuyển đổi</p>
                  <p className='text-xl text-green-900 mt-1'>{stats.conversionRate}%</p>
                </CardContent>
              </Card>

              <Card className='border border-blue-200'>
                <CardContent className='p-4 text-center'>
                  <Users className='w-8 h-8 mx-auto text-[#0066CC] mb-2' />
                  <p className='text-sm text-gray-600'>Giữ chân KH</p>
                  <p className='text-xl text-[#0066CC] mt-1'>{stats.customerRetention}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='sales' className='space-y-6 mt-6'>
            {/* Sales by Category */}
            <div>
              <h3 className='text-blue-900 mb-4'>Doanh số theo danh mục</h3>
              <div className='space-y-4'>
                {stats.salesByCategory.map((cat, idx) => (
                  <div key={idx}>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-700'>{cat.category}</span>
                      <div className='text-right'>
                        <span className='text-sm text-blue-600'>{(cat.amount / 1000000).toFixed(1)}M ₫</span>
                        <span className='text-xs text-gray-500 ml-2'>({cat.value}%)</span>
                      </div>
                    </div>
                    <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full'
                        style={{ width: `${cat.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h3 className='text-blue-900 mb-4'>Sản phẩm bán chạy</h3>
              <div className='space-y-3'>
                {stats.topProducts.map((product, idx) => (
                  <Card key={idx} className='border border-blue-200'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-blue-600'>#{idx + 1}</span>
                          </div>
                          <div>
                            <p className='text-gray-900'>{product.name}</p>
                            <p className='text-sm text-gray-600'>{product.sales} đơn bán</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-green-600'>{product.revenue.toLocaleString()}₫</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='customers' className='space-y-6 mt-6'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-[#0066CC]'>Phân tích khách hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-[#0066CC] mb-1'>Khách hàng mới</p>
                    <p className='text-2xl text-[#0066CC]'>825</p>
                    <p className='text-xs text-[#4A90E2] mt-1'>+24.1% so với kỳ trước</p>
                  </div>
                  <div className='p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-blue-800 mb-1'>Khách quay lại</p>
                    <p className='text-2xl text-blue-900'>2,595</p>
                    <p className='text-xs text-blue-600 mt-1'>Tỷ lệ: 75.9%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='products' className='space-y-6 mt-6'>
            <Card className='border border-orange-200'>
              <CardHeader>
                <CardTitle className='text-orange-900'>Thống kê sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid md:grid-cols-3 gap-4'>
                  <div className='p-4 bg-orange-50 rounded-lg text-center'>
                    <FileText className='w-8 h-8 mx-auto text-orange-600 mb-2' />
                    <p className='text-sm text-orange-800 mb-1'>Tổng sản phẩm</p>
                    <p className='text-2xl text-orange-900'>{stats.totalProducts}</p>
                  </div>
                  <div className='p-4 bg-green-50 rounded-lg text-center'>
                    <Package className='w-8 h-8 mx-auto text-green-600 mb-2' />
                    <p className='text-sm text-green-800 mb-1'>Còn hàng</p>
                    <p className='text-2xl text-green-900'>834</p>
                  </div>
                  <div className='p-4 bg-red-50 rounded-lg text-center'>
                    <Activity className='w-8 h-8 mx-auto text-red-600 mb-2' />
                    <p className='text-sm text-red-800 mb-1'>Sắp hết</p>
                    <p className='text-2xl text-red-900'>58</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
