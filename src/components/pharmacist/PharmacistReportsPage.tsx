import { useState } from 'react'
import { TrendingUp, FileText, Users, Clock, CheckCircle, MessageSquare, Download, BarChart3 } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'

export function PharmacistReportsPage() {
  const [timeRange, setTimeRange] = useState('week')

  // Mock data
  const stats = {
    prescriptionsProcessed: 45,
    ordersCreated: 38,
    consultations: 52,
    avgResponseTime: '8 phút',
    customerSatisfaction: 4.8,
    revenue: 12500000,
  }

  const dailyData = [
    { day: 'T2', prescriptions: 8, orders: 6, consultations: 10 },
    { day: 'T3', prescriptions: 12, orders: 10, consultations: 14 },
    { day: 'T4', prescriptions: 6, orders: 5, consultations: 8 },
    { day: 'T5', prescriptions: 10, orders: 8, consultations: 12 },
    { day: 'T6', prescriptions: 9, orders: 9, consultations: 8 },
  ]

  const handleExport = (type: string) => {
    toast.success(`Đang xuất báo cáo ${type}...`)
  }

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                Báo cáo công việc
              </h1>
              <p className='text-gray-600 mt-1'>Theo dõi hiệu suất và thống kê công việc của bạn</p>
            </div>
            <div className='flex gap-2'>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className='w-32 border-2 border-blue-200'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='today'>Hôm nay</SelectItem>
                  <SelectItem value='week'>Tuần này</SelectItem>
                  <SelectItem value='month'>Tháng này</SelectItem>
                  <SelectItem value='quarter'>Quý này</SelectItem>
                </SelectContent>
              </Select>
              <Button variant='outline' onClick={() => handleExport('PDF')}>
                <Download className='w-4 h-4 mr-2' />
                Xuất PDF
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <FileText className='w-5 h-5 text-blue-600' />
                <span className='text-sm text-blue-800'>Đơn thuốc</span>
              </div>
              <p className='text-2xl text-blue-900'>{stats.prescriptionsProcessed}</p>
              <p className='text-xs text-blue-600 mt-1'>+12% so với tuần trước</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                <span className='text-sm text-green-800'>Đơn hàng</span>
              </div>
              <p className='text-2xl text-green-900'>{stats.ordersCreated}</p>
              <p className='text-xs text-green-600 mt-1'>+8% so với tuần trước</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <MessageSquare className='w-5 h-5 text-purple-600' />
                <span className='text-sm text-purple-800'>Tư vấn</span>
              </div>
              <p className='text-2xl text-purple-900'>{stats.consultations}</p>
              <p className='text-xs text-purple-600 mt-1'>+5% so với tuần trước</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Clock className='w-5 h-5 text-yellow-600' />
                <span className='text-sm text-yellow-800'>Thời gian TB</span>
              </div>
              <p className='text-2xl text-yellow-900'>{stats.avgResponseTime}</p>
              <p className='text-xs text-yellow-600 mt-1'>Cải thiện 2 phút</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Users className='w-5 h-5 text-red-600' />
                <span className='text-sm text-red-800'>Đánh giá</span>
              </div>
              <p className='text-2xl text-red-900'>{stats.customerSatisfaction}/5</p>
              <p className='text-xs text-red-600 mt-1'>95% hài lòng</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <TrendingUp className='w-5 h-5 text-cyan-600' />
                <span className='text-sm text-cyan-800'>Doanh thu</span>
              </div>
              <p className='text-xl text-cyan-900'>{(stats.revenue / 1000000).toFixed(1)}M</p>
              <p className='text-xs text-cyan-600 mt-1'>+15% so với tuần trước</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue='daily' className='space-y-4'>
          <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='daily'>Theo ngày</TabsTrigger>
              <TabsTrigger value='category'>Theo danh mục</TabsTrigger>
              <TabsTrigger value='performance'>Hiệu suất</TabsTrigger>
            </TabsList>

            <TabsContent value='daily' className='space-y-6 mt-6'>
              <div className='space-y-4'>
                {dailyData.map((day, idx) => (
                  <div key={idx}>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-700'>{day.day}</span>
                      <span className='text-sm text-gray-600'>
                        Tổng: {day.prescriptions + day.orders + day.consultations}
                      </span>
                    </div>
                    <div className='flex gap-1 h-8'>
                      <div
                        className='bg-blue-500 rounded-l'
                        style={{ width: `${(day.prescriptions / 15) * 100}%` }}
                        title={`Đơn thuốc: ${day.prescriptions}`}
                      />
                      <div
                        className='bg-green-500'
                        style={{ width: `${(day.orders / 15) * 100}%` }}
                        title={`Đơn hàng: ${day.orders}`}
                      />
                      <div
                        className='bg-purple-500 rounded-r'
                        style={{ width: `${(day.consultations / 15) * 100}%` }}
                        title={`Tư vấn: ${day.consultations}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className='flex items-center justify-center gap-6 pt-4 border-t'>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-blue-500 rounded' />
                  <span className='text-sm text-gray-700'>Đơn thuốc</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-green-500 rounded' />
                  <span className='text-sm text-gray-700'>Đơn hàng</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-purple-500 rounded' />
                  <span className='text-sm text-gray-700'>Tư vấn</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='category' className='mt-6'>
              <div className='grid md:grid-cols-2 gap-4'>
                <Card className='border border-blue-200'>
                  <CardHeader>
                    <CardTitle className='text-blue-900'>Danh mục thuốc phổ biến</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {[
                      { name: 'Kháng sinh', count: 15, percent: 33 },
                      { name: 'Giảm đau', count: 12, percent: 27 },
                      { name: 'Tim mạch', count: 10, percent: 22 },
                      { name: 'Tiêu hóa', count: 8, percent: 18 },
                    ].map((cat, idx) => (
                      <div key={idx}>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-sm text-gray-700'>{cat.name}</span>
                          <span className='text-sm text-blue-600'>{cat.count} đơn</span>
                        </div>
                        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className='border border-green-200'>
                  <CardHeader>
                    <CardTitle className='text-green-900'>Khung giờ hoạt động</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {[
                      { time: '8:00 - 12:00', count: 18, percent: 35 },
                      { time: '12:00 - 14:00', count: 8, percent: 15 },
                      { time: '14:00 - 18:00', count: 20, percent: 39 },
                      { time: '18:00 - 20:00', count: 6, percent: 11 },
                    ].map((slot, idx) => (
                      <div key={idx}>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-sm text-gray-700'>{slot.time}</span>
                          <span className='text-sm text-green-600'>{slot.count} hoạt động</span>
                        </div>
                        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full'
                            style={{ width: `${slot.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='performance' className='mt-6'>
              <div className='grid md:grid-cols-3 gap-4'>
                <Card className='border border-purple-200'>
                  <CardContent className='p-6 text-center'>
                    <BarChart3 className='w-12 h-12 mx-auto text-purple-600 mb-3' />
                    <h3 className='text-purple-900 mb-2'>Hiệu quả xử lý</h3>
                    <p className='text-3xl text-purple-600 mb-1'>94%</p>
                    <p className='text-sm text-gray-600'>Tỷ lệ hoàn thành đúng hạn</p>
                  </CardContent>
                </Card>

                <Card className='border border-blue-200'>
                  <CardContent className='p-6 text-center'>
                    <Clock className='w-12 h-12 mx-auto text-blue-600 mb-3' />
                    <h3 className='text-blue-900 mb-2'>Thời gian phản hồi</h3>
                    <p className='text-3xl text-blue-600 mb-1'>8 phút</p>
                    <p className='text-sm text-gray-600'>Trung bình mỗi tư vấn</p>
                  </CardContent>
                </Card>

                <Card className='border border-green-200'>
                  <CardContent className='p-6 text-center'>
                    <Users className='w-12 h-12 mx-auto text-green-600 mb-3' />
                    <h3 className='text-green-900 mb-2'>Khách hàng hài lòng</h3>
                    <p className='text-3xl text-green-600 mb-1'>95%</p>
                    <p className='text-sm text-gray-600'>Đánh giá 4-5 sao</p>
                  </CardContent>
                </Card>
              </div>

              <Card className='mt-4 border border-yellow-200'>
                <CardHeader>
                  <CardTitle className='text-yellow-900'>Gợi ý cải thiện</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-start gap-3 p-3 bg-yellow-50 rounded-lg'>
                    <TrendingUp className='w-5 h-5 text-yellow-600 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-900 mb-1'>
                        Tăng tốc độ xử lý đơn thuốc vào khung giờ 14:00-18:00
                      </p>
                      <p className='text-xs text-gray-600'>
                        Đây là khung giờ cao điểm với thời gian chờ trung bình 12 phút
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg'>
                    <MessageSquare className='w-5 h-5 text-blue-600 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-900 mb-1'>Cải thiện chất lượng tư vấn về thuốc tim mạch</p>
                      <p className='text-xs text-gray-600'>
                        Có 3 feedback yêu cầu thêm thông tin chi tiết về tương tác thuốc
                      </p>
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
