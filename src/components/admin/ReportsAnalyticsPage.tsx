import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Users,
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
  Activity,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  ArrowLeftRight,
  Download,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Calendar } from '../ui/calendar'
import { getReportsAnalytics } from '../../services/admin/reports.service'
import { downloadExportFile } from '../../services/admin/reports-export.service'
import { formatCurrency } from '../../utils/formatCurrency'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'

// Color palette for charts
const CHART_COLORS = ['#0A2463', '#1E40AF', '#36B37E', '#FF9F43', '#FF6B6B', '#A855F7', '#06B6D4', '#F59E0B']
const PIE_COLORS = ['#0A2463', '#36B37E', '#FF9F43', '#FF6B6B', '#A855F7', '#06B6D4', '#F59E0B', '#EC4899']

// Date formatter for Vietnamese locale
const formatDate = (date: Date) => {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Custom tooltip for currency values
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className='bg-white/95 backdrop-blur-sm border border-[#E8EDF5] shadow-xl rounded-xl p-3 min-w-[160px]'>
      <p className='text-sm font-medium text-gray-900 mb-1'>{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className='text-sm' style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className='bg-white/95 backdrop-blur-sm border border-[#E8EDF5] shadow-xl rounded-xl p-3'>
      <p className='text-sm font-medium text-gray-900'>{data.name}</p>
      <p className='text-sm text-[#1E40AF]'>{formatCurrency(data.payload.amount)}</p>
      <p className='text-xs text-gray-500'>{data.value.toFixed(1)}%</p>
    </div>
  )
}

// Growth badge component
const GrowthBadge = ({ value }: { value: number }) => {
  const isPositive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {isPositive ? <ArrowUpRight className='w-3 h-3' /> : <ArrowDownRight className='w-3 h-3' />}
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

export function ReportsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Build query key and params for custom dates
  const startDateStr = customStartDate ? customStartDate.toISOString().split('T')[0] : undefined
  const endDateStr = customEndDate ? customEndDate.toISOString().split('T')[0] : undefined

  // Calculate comparison period label
  const comparisonLabel = useMemo(() => {
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      const durationMs = customEndDate.getTime() - customStartDate.getTime()
      const prevEnd = new Date(customStartDate.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - durationMs)
      return `So sánh với: ${formatDate(prevStart)} → ${formatDate(prevEnd)}`
    }
    const labels: Record<string, string> = {
      week: 'So sánh với tuần trước',
      month: 'So sánh với tháng trước',
      quarter: 'So sánh với quý trước',
      year: 'So sánh với năm trước',
    }
    return labels[timeRange] || ''
  }, [timeRange, customStartDate, customEndDate])

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    if (value !== 'custom') {
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
    } else if (!customStartDate) {
      // Default custom range: last 30 days
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      setCustomStartDate(start)
      setCustomEndDate(end)
    }
  }

  // Fetch analytics data from API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reports-analytics', timeRange, startDateStr, endDateStr],
    queryFn: () => getReportsAnalytics(timeRange, startDateStr, endDateStr),
    staleTime: 5 * 60 * 1000,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-[#1E40AF] mx-auto mb-4' />
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

  if (!data) return null

  // Prepare chart data
  const revenueChartData = (data.revenue.monthlyTrends || []).map((item: any) => ({
    name: item.month,
    'Doanh thu': item.revenue,
    'Đơn hàng': item.orderCount || 0,
  }))

  const categoryPieData = (data.products.salesByCategory || []).map((cat: any) => ({
    name: cat.categoryName || cat.category || 'Khác',
    value: cat.value || cat.percentage || 0,
    amount: cat.amount || cat.totalRevenue || 0,
  }))

  const orderStatusData = data.orders?.statusBreakdown
    ? [
        { name: 'Chờ xử lý', value: data.orders.statusBreakdown.pending || 0, color: '#FF9F43' },
        { name: 'Đang xử lý', value: data.orders.statusBreakdown.processing || 0, color: '#0A2463' },
        { name: 'Đang giao', value: data.orders.statusBreakdown.shipped || 0, color: '#06B6D4' },
        { name: 'Hoàn thành', value: data.orders.statusBreakdown.delivered || 0, color: '#36B37E' },
        { name: 'Đã hủy', value: data.orders.statusBreakdown.cancelled || 0, color: '#FF6B6B' },
      ].filter((item) => item.value > 0)
    : []

  const tabTriggerClass =
    '!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1
              className='text-3xl font-bold bg-clip-text text-transparent'
              style={{
                backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
              }}
            >
              Báo cáo &amp; Phân tích
            </h1>
            <p className='text-gray-600 mt-1'>Dashboard tổng quan về doanh thu và hoạt động kinh doanh</p>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
            <div className='flex items-center gap-3'>
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='week'>Tuần này</SelectItem>
                  <SelectItem value='month'>Tháng này</SelectItem>
                  <SelectItem value='quarter'>Quý này</SelectItem>
                  <SelectItem value='year'>Năm nay</SelectItem>
                  <SelectItem value='custom'>Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Pickers */}
              {timeRange === 'custom' && (
                <div className='flex items-center gap-2'>
                  {/* Start Date Picker */}
                  <Popover open={showStartPicker} onOpenChange={setShowStartPicker}>
                    <PopoverTrigger asChild>
                      <button className='flex items-center gap-1.5 px-3 py-2 text-sm border-2 border-[#BFDBFE] rounded-lg hover:bg-[#F0F6FF] transition-colors'>
                        <CalendarIcon className='w-4 h-4 text-blue-500' />
                        <span className='text-gray-700'>{customStartDate ? formatDate(customStartDate) : 'Từ ngày'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date || undefined)
                          setShowStartPicker(false)
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <ArrowLeftRight className='w-4 h-4 text-gray-400 flex-shrink-0' />

                  {/* End Date Picker */}
                  <Popover open={showEndPicker} onOpenChange={setShowEndPicker}>
                    <PopoverTrigger asChild>
                      <button className='flex items-center gap-1.5 px-3 py-2 text-sm border-2 border-[#BFDBFE] rounded-lg hover:bg-[#F0F6FF] transition-colors'>
                        <CalendarIcon className='w-4 h-4 text-blue-500' />
                        <span className='text-gray-700'>{customEndDate ? formatDate(customEndDate) : 'Đến ngày'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date || undefined)
                          setShowEndPicker(false)
                        }}
                        disabled={(date) => date > new Date() || (customStartDate ? date < customStartDate : false)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className='flex items-center'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={!data || isExporting}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0A2463] bg-[#1E40AF]/10 border-2 border-[#1E40AF]/20 rounded-lg transition-colors ${!data || isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1E40AF]/20'} !outline-none`}
                >
                  {isExporting ? <Loader2 className='w-4 h-4 animate-spin' /> : <Download className='w-4 h-4' />}
                  <span className='hidden sm:inline'>Xuất báo cáo</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-[160px] bg-white/95 backdrop-blur-sm border border-[#E8EDF5] shadow-xl'
                >
                  <DropdownMenuItem
                    className='cursor-pointer flex items-center gap-2 text-green-700 focus:text-green-800 focus:bg-green-500/10'
                    onClick={async () => {
                      if (!data || isExporting) return
                      setIsExporting(true)
                      try {
                        await downloadExportFile('excel', timeRange, startDateStr, endDateStr)
                      } finally {
                        setIsExporting(false)
                      }
                    }}
                  >
                    <FileSpreadsheet className='w-4 h-4' />
                    <span>Xuất Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer flex items-center gap-2 text-red-700 focus:text-red-800 focus:bg-red-500/10'
                    onClick={async () => {
                      if (!data || isExporting) return
                      setIsExporting(true)
                      try {
                        await downloadExportFile('pdf', timeRange, startDateStr, endDateStr)
                      } finally {
                        setIsExporting(false)
                      }
                    }}
                  >
                    <FileDown className='w-4 h-4' />
                    <span>Xuất PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Comparison period info */}
        {comparisonLabel && (
          <div className='mt-3 flex items-center gap-2'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F6FF] text-[#0A2463] rounded-full text-xs font-medium'>
              <ArrowLeftRight className='w-3 h-3' />
              {comparisonLabel}
            </div>
            {timeRange === 'custom' && customStartDate && customEndDate && (
              <span className='text-xs text-gray-500'>
                Kỳ hiện tại: {formatDate(customStartDate)} → {formatDate(customEndDate)} (
                {Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24))} ngày)
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-[#BFDBFE] hover:shadow-lg transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-[#BFDBFE]/60 flex items-center justify-center'>
                  <DollarSign className='w-4 h-4 text-[#0A2463]' />
                </div>
                <span className='text-sm font-medium text-blue-800'>Doanh thu</span>
              </div>
            </div>
            <p className='text-2xl font-bold text-blue-900'>{((data.revenue?.total || 0) / 1000000).toFixed(1)}M</p>
            <div className='mt-1'>
              <GrowthBadge value={data.revenue?.growth || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-green-200/60 flex items-center justify-center'>
                  <ShoppingCart className='w-4 h-4 text-green-700' />
                </div>
                <span className='text-sm font-medium text-green-800'>Đơn hàng</span>
              </div>
            </div>
            <p className='text-2xl font-bold text-green-900'>{data.orders?.total || 0}</p>
            <div className='mt-1'>
              <GrowthBadge value={data.orders?.growth || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF] border-[#BFDBFE] hover:shadow-lg transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-[#BFDBFE]/60 flex items-center justify-center'>
                  <Users className='w-4 h-4 text-[#1E40AF]' />
                </div>
                <span className='text-sm font-medium text-[#0A2463]'>Người dùng</span>
              </div>
            </div>
            <p className='text-2xl font-bold text-[#0A2463]'>{data.users?.total || 0}</p>
            <div className='mt-1'>
              <GrowthBadge value={data.users?.growth || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-orange-200/60 flex items-center justify-center'>
                  <Package className='w-4 h-4 text-orange-700' />
                </div>
                <span className='text-sm font-medium text-orange-800'>Sản phẩm</span>
              </div>
            </div>
            <p className='text-2xl font-bold text-orange-900'>{data.products?.total || 0}</p>
            <div className='mt-1'>
              <GrowthBadge value={data.products?.growth || 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
          <TabsList className='grid w-full grid-cols-4 !bg-[#F0F6FF] p-1.5 rounded-lg h-auto'>
            <TabsTrigger value='overview' className={tabTriggerClass}>
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value='sales' className={tabTriggerClass}>
              Doanh số
            </TabsTrigger>
            <TabsTrigger value='customers' className={tabTriggerClass}>
              Khách hàng
            </TabsTrigger>
            <TabsTrigger value='products' className={tabTriggerClass}>
              Sản phẩm
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB: TỔNG QUAN ==================== */}
          <TabsContent value='overview' className='space-y-6 mt-6'>
            <div className='grid lg:grid-cols-5 gap-6'>
              {/* Revenue Area Chart */}
              <div className='lg:col-span-3'>
                <h3 className='text-base font-semibold text-gray-900 mb-4'>Doanh thu theo thời gian</h3>
                {revenueChartData.length > 0 ? (
                  <div className='h-[300px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#0A2463' stopOpacity={0.3} />
                            <stop offset='95%' stopColor='#0A2463' stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' vertical={false} />
                        <XAxis
                          dataKey='name'
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip content={<CurrencyTooltip />} />
                        <Area
                          type='monotone'
                          dataKey='Doanh thu'
                          stroke='#0A2463'
                          strokeWidth={2.5}
                          fill='url(#revenueGradient)'
                          dot={{ r: 4, fill: '#0A2463', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#0A2463', strokeWidth: 2, stroke: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className='h-[300px] flex items-center justify-center text-gray-400'>
                    <p>Không có dữ liệu doanh thu</p>
                  </div>
                )}
              </div>

              {/* Order Status Pie Chart */}
              <div className='lg:col-span-2'>
                <h3 className='text-base font-semibold text-gray-900 mb-4'>Trạng thái đơn hàng</h3>
                {orderStatusData.length > 0 ? (
                  <div className='h-[300px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx='50%'
                          cy='45%'
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey='value'
                          strokeWidth={2}
                          stroke='#fff'
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} đơn`, name]}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend
                          verticalAlign='bottom'
                          iconType='circle'
                          iconSize={8}
                          formatter={(value) => <span className='text-xs text-gray-600 ml-1'>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className='h-[300px] flex items-center justify-center text-gray-400'>
                    <p>Không có dữ liệu đơn hàng</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='border border-[#BFDBFE] hover:shadow-md transition-shadow'>
                <CardContent className='p-5 text-center'>
                  <div className='w-12 h-12 rounded-xl bg-[#E8EDF5] flex items-center justify-center mx-auto mb-3'>
                    <Activity className='w-6 h-6 text-[#1E40AF]' />
                  </div>
                  <p className='text-sm text-gray-500 mb-1'>Giá trị đơn TB</p>
                  <p className='text-2xl font-bold text-blue-900'>{formatCurrency(data.metrics?.avgOrderValue || 0)}</p>
                </CardContent>
              </Card>

              <Card className='border border-green-200 hover:shadow-md transition-shadow'>
                <CardContent className='p-5 text-center'>
                  <div className='w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3'>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                  <p className='text-sm text-gray-500 mb-1'>Tỷ lệ chuyển đổi</p>
                  <p className='text-2xl font-bold text-green-900'>{(data.metrics?.conversionRate || 0).toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className='border border-[#BFDBFE] hover:shadow-md transition-shadow'>
                <CardContent className='p-5 text-center'>
                  <div className='w-12 h-12 rounded-xl bg-[#E8EDF5] flex items-center justify-center mx-auto mb-3'>
                    <Users className='w-6 h-6 text-[#1E40AF]' />
                  </div>
                  <p className='text-sm text-gray-500 mb-1'>Giữ chân KH</p>
                  <p className='text-2xl font-bold text-[#0A2463]'>
                    {(data.metrics?.customerRetention || 0).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== TAB: DOANH SỐ ==================== */}
          <TabsContent value='sales' className='space-y-6 mt-6'>
            <div className='grid lg:grid-cols-5 gap-6'>
              {/* Sales by Category - Pie Chart */}
              <div className='lg:col-span-2'>
                <h3 className='text-base font-semibold text-gray-900 mb-4'>Doanh số theo danh mục</h3>
                {categoryPieData.length > 0 ? (
                  <div className='h-[320px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx='50%'
                          cy='42%'
                          outerRadius={100}
                          innerRadius={45}
                          paddingAngle={2}
                          dataKey='value'
                          strokeWidth={2}
                          stroke='#fff'
                          label={(props: any) =>
                            `${
                              props.name && props.name.length > 12 ? props.name.slice(0, 12) + '…' : props.name
                            } (${(props.value || 0).toFixed(0)}%)`
                          }
                          labelLine={{ strokeWidth: 1, stroke: '#9CA3AF' }}
                        >
                          {categoryPieData.map((_: any, index: number) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className='h-[320px] flex items-center justify-center text-gray-400'>
                    <p>Không có dữ liệu</p>
                  </div>
                )}
              </div>

              {/* Sales by Category - Bar Chart */}
              <div className='lg:col-span-3'>
                <h3 className='text-base font-semibold text-gray-900 mb-4'>So sánh doanh thu theo danh mục</h3>
                {categoryPieData.length > 0 ? (
                  <div className='h-[320px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={categoryPieData}
                        layout='vertical'
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' horizontal={false} />
                        <XAxis
                          type='number'
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <YAxis
                          type='category'
                          dataKey='name'
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#374151' }}
                          width={120}
                        />
                        <Tooltip content={<CurrencyTooltip />} />
                        <Bar dataKey='amount' name='Doanh thu' radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {categoryPieData.map((_: any, index: number) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className='h-[320px] flex items-center justify-center text-gray-400'>
                    <p>Không có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 mb-4'>Sản phẩm bán chạy</h3>
              <div className='space-y-3'>
                {data.products.topProducts && data.products.topProducts.length > 0 ? (
                  data.products.topProducts.map((product: any, idx: number) => (
                    <Card key={product._id} className='border border-[#E8EDF5] hover:shadow-md transition-shadow'>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <div
                              className='w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm'
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <p className='font-medium text-gray-900'>{product.name}</p>
                              <div className='flex items-center gap-2'>
                                <p className='text-sm text-gray-500'>{product.sales} đơn bán</p>
                                {product.categoryName && (
                                  <span className='text-xs bg-[#F0F6FF] text-[#1E40AF] px-2 py-0.5 rounded-full'>
                                    {product.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold text-green-600'>{formatCurrency(product.revenue)}</p>
                            {product.growth !== undefined && product.growth !== 0 && (
                              <GrowthBadge value={product.growth} />
                            )}
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

          {/* ==================== TAB: KHÁCH HÀNG ==================== */}
          <TabsContent value='customers' className='space-y-6 mt-6'>
            <div className='grid md:grid-cols-2 gap-6'>
              {/* New vs Returning Customers */}
              <Card className='border border-[#BFDBFE]'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base text-gray-900'>Phân tích khách hàng</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='p-4 bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF] rounded-xl'>
                      <p className='text-sm text-[#1E40AF] mb-1'>Khách hàng mới</p>
                      <p className='text-2xl font-bold text-[#0A2463]'>
                        {(data.users?.newUsers || 0).toLocaleString()}
                      </p>
                      <div className='mt-1'>
                        <GrowthBadge value={data.users?.growth || 0} />
                      </div>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl'>
                      <p className='text-sm text-green-600 mb-1'>Khách quay lại</p>
                      <p className='text-2xl font-bold text-green-900'>
                        {(data.users?.returningUsers || 0).toLocaleString()}
                      </p>
                      <p className='text-xs text-green-600 mt-1'>
                        Tỷ lệ: {(((data.users?.returningUsers || 0) / (data.users?.total || 1)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Customer Composition Bar */}
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>Thành phần người dùng</p>
                    <div className='h-[200px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={[
                            { name: 'Khách hàng', value: data.users?.customers || 0 },
                            { name: 'Dược sĩ', value: data.users?.pharmacists || 0 },
                            { name: 'Admin', value: data.users?.admins || 0 },
                          ]}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' vertical={false} />
                          <XAxis
                            dataKey='name'
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <Tooltip
                            formatter={(value: any) => [`${value} người`, 'Số lượng']}
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                            }}
                          />
                          <Bar dataKey='value' name='Số lượng' radius={[6, 6, 0, 0]} maxBarSize={50}>
                            <Cell fill='#0A2463' />
                            <Cell fill='#36B37E' />
                            <Cell fill='#FF9F43' />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Metrics Summary */}
              <Card className='border border-[#BFDBFE]'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base text-gray-900'>Chỉ số khách hàng</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='p-3 bg-[#F0F6FF] rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Tổng KH</p>
                      <p className='text-xl font-bold text-blue-900'>{data.users?.customers || 0}</p>
                    </div>
                    <div className='p-3 bg-green-50 rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Đã xác thực</p>
                      <p className='text-xl font-bold text-green-900'>{data.users?.verified || 0}</p>
                    </div>
                    <div className='p-3 bg-[#F0F6FF] rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Conversion</p>
                      <p className='text-xl font-bold text-[#0A2463]'>
                        {(data.metrics?.conversionRate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className='p-3 bg-orange-50 rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Retention</p>
                      <p className='text-xl font-bold text-orange-900'>
                        {(data.metrics?.customerRetention || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* New vs Returning Donut */}
                  <div className='h-[200px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Khách mới', value: data.users?.newUsers || 0 },
                            { name: 'Quay lại', value: data.users?.returningUsers || 0 },
                          ].filter((d) => d.value > 0)}
                          cx='50%'
                          cy='50%'
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey='value'
                          strokeWidth={2}
                          stroke='#fff'
                        >
                          <Cell fill='#1E40AF' />
                          <Cell fill='#36B37E' />
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} người`, name]}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign='bottom'
                          iconType='circle'
                          iconSize={8}
                          formatter={(value) => <span className='text-xs text-gray-600 ml-1'>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== TAB: SẢN PHẨM ==================== */}
          <TabsContent value='products' className='space-y-6 mt-6'>
            <Card className='border border-orange-200'>
              <CardHeader>
                <CardTitle className='text-base text-gray-900'>Thống kê sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid md:grid-cols-3 gap-4'>
                  <div className='p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl text-center'>
                    <div className='w-10 h-10 rounded-lg bg-orange-200/60 flex items-center justify-center mx-auto mb-2'>
                      <FileText className='w-5 h-5 text-orange-600' />
                    </div>
                    <p className='text-sm text-orange-800 mb-1'>Tổng sản phẩm</p>
                    <p className='text-2xl font-bold text-orange-900'>{data.products?.total || 0}</p>
                  </div>
                  <div className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center'>
                    <div className='w-10 h-10 rounded-lg bg-green-200/60 flex items-center justify-center mx-auto mb-2'>
                      <Package className='w-5 h-5 text-green-600' />
                    </div>
                    <p className='text-sm text-green-800 mb-1'>Còn hàng</p>
                    <p className='text-2xl font-bold text-green-900'>{data.products?.active || 0}</p>
                  </div>
                  <div className='p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl text-center'>
                    <div className='w-10 h-10 rounded-lg bg-red-200/60 flex items-center justify-center mx-auto mb-2'>
                      <Activity className='w-5 h-5 text-red-600' />
                    </div>
                    <p className='text-sm text-red-800 mb-1'>Sắp hết</p>
                    <p className='text-2xl font-bold text-red-900'>{data.products?.lowStock || 0}</p>
                  </div>
                </div>

                {/* Stock status Pie */}
                {(data.products?.active || 0) + (data.products?.outOfStock || 0) + (data.products?.lowStock || 0) >
                  0 && (
                  <div>
                    <h4 className='text-sm font-medium text-gray-700 mb-3'>Phân bổ tình trạng kho</h4>
                    <div className='h-[250px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Còn hàng',
                                value: (data.products?.active || 0) - (data.products?.lowStock || 0),
                                color: '#36B37E',
                              },
                              { name: 'Sắp hết', value: data.products?.lowStock || 0, color: '#FF9F43' },
                              { name: 'Hết hàng', value: data.products?.outOfStock || 0, color: '#FF6B6B' },
                            ].filter((d) => d.value > 0)}
                            cx='50%'
                            cy='45%'
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey='value'
                            strokeWidth={2}
                            stroke='#fff'
                          >
                            {[{ color: '#36B37E' }, { color: '#FF9F43' }, { color: '#FF6B6B' }]
                              .filter((_, i) => {
                                const vals = [
                                  (data.products?.active || 0) - (data.products?.lowStock || 0),
                                  data.products?.lowStock || 0,
                                  data.products?.outOfStock || 0,
                                ]
                                return vals[i] > 0
                              })
                              .map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => [`${value} sản phẩm`, name]}
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                            }}
                          />
                          <Legend
                            verticalAlign='bottom'
                            iconType='circle'
                            iconSize={8}
                            formatter={(value) => <span className='text-xs text-gray-600 ml-1'>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Product Trends */}
                {data.products?.trends && (
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='p-3 bg-[#F0F6FF] rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>SP mới trong kỳ</p>
                      <p className='text-lg font-bold text-blue-900'>{data.products.trends.newProducts}</p>
                    </div>
                    <div className='p-3 bg-red-50 rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Ngừng kinh doanh</p>
                      <p className='text-lg font-bold text-red-900'>{data.products.trends.discontinuedProducts}</p>
                    </div>
                    <div className='p-3 bg-green-50 rounded-xl text-center'>
                      <p className='text-xs text-gray-500'>Tăng trưởng</p>
                      <p className='text-lg font-bold text-green-900'>
                        <GrowthBadge value={data.products.trends.growthRate} />
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
