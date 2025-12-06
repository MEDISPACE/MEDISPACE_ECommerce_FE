import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, ShoppingCart, FileText, DollarSign, Package, Activity, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { getReportsAnalytics } from '../../services/admin/reports.service'
import { formatCurrency } from '../../utils/formatCurrency'

export function ReportsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')

  // Fetch analytics data from API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reports-analytics', timeRange],
    queryFn: () => getReportsAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-600'>Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Card className='max-w-md border-red-200'>
          <CardContent className='p-6 text-center'>
            <AlertCircle className='w-12 h-12 text-red-600 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-red-900 mb-2'>Không thể tải dữ liệu</h3>
            <p className='text-red-700 mb-4'>
              {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải báo cáo'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
            >
              Tải lại trang
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data check
  if (!data) {
    return null
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...(data.revenue.monthlyTrends?.map(item => item.revenue) || [1]))

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
              Báo cáo &amp; Phân tích
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
            <p className='text-2xl text-blue-900'>{((data.revenue?.total || 0) / 1000000).toFixed(1)}M</p>
            <p className='text-xs text-blue-600 mt-1'>+{(data.revenue?.growth || 0).toFixed(1)}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <ShoppingCart className='w-5 h-5 text-green-600' />
              <span className='text-sm text-green-800'>Đơn hàng</span>
            </div>
            <p className='text-2xl text-green-900'>{data.orders?.total || 0}</p>
            <p className='text-xs text-green-600 mt-1'>+{(data.orders?.growth || 0).toFixed(1)}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Users className='w-5 h-5 text-[#0066CC]' />
              <span className='text-sm text-[#0066CC]'>Người dùng</span>
            </div>
            <p className='text-2xl text-[#0066CC]'>{data.users?.total || 0}</p>
            <p className='text-xs text-[#4A90E2] mt-1'>+{(data.users?.growth || 0).toFixed(1)}% so với kỳ trước</p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Package className='w-5 h-5 text-orange-600' />
              <span className='text-sm text-orange-800'>Sản phẩm</span>
            </div>
            <p className='text-2xl text-orange-900'>{data.products?.total || 0}</p>
            <p className='text-xs text-orange-600 mt-1'>+{(data.products?.growth || 0).toFixed(1)}% so với kỳ trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <TabsList className='grid w-full grid-cols-4 !bg-blue-50 p-1.5 rounded-lg h-auto'>
            <TabsTrigger
              value='overview'
              className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'
            >
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value='sales'
              className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'
            >
              Doanh số
            </TabsTrigger>
            <TabsTrigger
              value='customers'
              className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'
            >
              Khách hàng
            </TabsTrigger>
            <TabsTrigger
              value='products'
              className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'
            >
              Sản phẩm
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6 mt-6'>
            {/* Revenue Chart */}
            <div>
              <h3 className='text-blue-900 mb-4'>Doanh thu theo thời gian</h3>
              <div className='space-y-4'>
                {data.revenue.monthlyTrends && data.revenue.monthlyTrends.length > 0 ? (
                  data.revenue.monthlyTrends.map((item, idx) => (
                    <div key={idx}>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-gray-700'>{item.month}</span>
                        <span className='text-sm text-blue-600'>{(item.revenue / 1000000).toFixed(1)}M VND</span>
                      </div>
                      <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all'
                          style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-gray-500 text-center py-4'>Không có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='border border-blue-200'>
                <CardContent className='p-4 text-center'>
                  <Activity className='w-8 h-8 mx-auto text-blue-600 mb-2' />
                  <p className='text-sm text-gray-600'>Giá trị đơn TB</p>
                  <p className='text-xl text-blue-900 mt-1'>{formatCurrency(data.metrics?.avgOrderValue || 0)}</p>
                </CardContent>
              </Card>

              <Card className='border border-green-200'>
                <CardContent className='p-4 text-center'>
                  <TrendingUp className='w-8 h-8 mx-auto text-green-600 mb-2' />
                  <p className='text-sm text-gray-600'>Tỷ lệ chuyển đổi</p>
                  <p className='text-xl text-green-900 mt-1'>{(data.metrics?.conversionRate || 0).toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className='border border-blue-200'>
                <CardContent className='p-4 text-center'>
                  <Users className='w-8 h-8 mx-auto text-[#0066CC] mb-2' />
                  <p className='text-sm text-gray-600'>Giữ chân KH</p>
                  <p className='text-xl text-[#0066CC] mt-1'>{(data.metrics?.customerRetention || 0).toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='sales' className='space-y-6 mt-6'>
            {/* Sales by Category */}
            <div>
              <h3 className='text-blue-900 mb-4'>Doanh số theo danh mục</h3>
              <div className='space-y-4'>
                {data.products.salesByCategory && data.products.salesByCategory.length > 0 ? (
                  data.products.salesByCategory.map((cat, idx) => (
                    <div key={idx}>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-gray-700'>{cat.categoryName || cat.category}</span>
                        <div className='text-right'>
                          <span className='text-sm text-blue-600'>{(cat.amount / 1000000).toFixed(1)}M VND</span>
                          <span className='text-xs text-gray-500 ml-2'>({cat.value.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full'
                          style={{ width: `${cat.value}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-gray-500 text-center py-4'>Không có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h3 className='text-blue-900 mb-4'>Sản phẩm bán chạy</h3>
              <div className='space-y-3'>
                {data.products.topProducts && data.products.topProducts.length > 0 ? (
                  data.products.topProducts.map((product, idx) => (
                    <Card key={product._id} className='border border-blue-200'>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                              <span className='text-blue-600 font-semibold'>#{idx + 1}</span>
                            </div>
                            <div>
                              <p className='font-medium text-gray-900'>{product.name}</p>
                              <p className='text-sm text-gray-600'>{product.sales} đơn bán</p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold text-green-600'>{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className='text-gray-500 text-center py-4'>Không có dữ liệu</p>
                )}
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
                    <p className='text-2xl font-bold text-[#0066CC]'>{(data.users?.newUsers || 0).toLocaleString()}</p>
                    <p className='text-xs text-[#4A90E2] mt-1'>+{(data.users?.growth || 0).toFixed(1)}% so với kỳ trước</p>
                  </div>
                  <div className='p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-blue-800 mb-1'>Khách quay lại</p>
                    <p className='text-2xl font-bold text-blue-900'>{(data.users?.returningUsers || 0).toLocaleString()}</p>
                    <p className='text-xs text-blue-600 mt-1'>
                      Tỷ lệ: {(((data.users?.returningUsers || 0) / (data.users?.total || 1)) * 100).toFixed(1)}%
                    </p>
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
                    <p className='text-2xl font-bold text-orange-900'>{data.products?.total || 0}</p>
                  </div>
                  <div className='p-4 bg-green-50 rounded-lg text-center'>
                    <Package className='w-8 h-8 mx-auto text-green-600 mb-2' />
                    <p className='text-sm text-green-800 mb-1'>Còn hàng</p>
                    <p className='text-2xl font-bold text-green-900'>{data.products?.active || 0}</p>
                  </div>
                  <div className='p-4 bg-red-50 rounded-lg text-center'>
                    <Activity className='w-8 h-8 mx-auto text-red-600 mb-2' />
                    <p className='text-sm text-red-800 mb-1'>Sắp hết</p>
                    <p className='text-2xl font-bold text-red-900'>{data.products?.lowStock || 0}</p>
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
