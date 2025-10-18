import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, FileText, MessageCircle, BarChart3, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'

const mockStats = {
  pendingPrescriptions: 12,
  activeChats: 5,
  ordersToday: 8,
  totalRevenue: 2500000,
}

const mockPrescriptions = [
  {
    id: 'PRE001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0123456789',
    prescriptionImages: ['/images/prescription1.jpg'],
    productName: 'Amoxicillin 500mg',
    status: 'pending',
    createdAt: '2024-01-10T14:30:00Z',
    notes: 'Đau họng, sốt nhẹ',
  },
  {
    id: 'PRE002',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    prescriptionImages: ['/images/prescription2.jpg'],
    productName: 'Paracetamol 500mg',
    status: 'pending',
    createdAt: '2024-01-10T15:45:00Z',
    notes: 'Hạ sốt cho trẻ em',
  },
]

const mockChats = [
  {
    id: 'CHAT001',
    customerName: 'Lê Văn C',
    lastMessage: 'Thuốc này uống như thế nào ạ?',
    timestamp: '2024-01-10T16:20:00Z',
    unreadCount: 2,
    status: 'active',
  },
  {
    id: 'CHAT002',
    customerName: 'Phạm Thị D',
    lastMessage: 'Cảm ơn dược sĩ đã tư vấn',
    timestamp: '2024-01-10T15:30:00Z',
    unreadCount: 0,
    status: 'completed',
  },
]

export function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { StatsCard } = useStatsCards()

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'active':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-gray-100 text-gray-700'
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'preparing':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý'
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'active':
        return 'Đang chat'
      case 'completed':
        return 'Hoàn thành'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'preparing':
        return 'Đang chuẩn bị'
      default:
        return status
    }
  }

  // Define stats cards config
  const statsCards: StatCardConfig[] = [
    {
      title: 'Đơn thuốc chờ',
      value: mockStats.pendingPrescriptions,
      icon: FileText,
      color: 'yellow',
      badge:
        mockStats.pendingPrescriptions > 0
          ? {
              text: 'Cần xử lý',
              icon: AlertCircle,
              show: true,
            }
          : undefined,
    },
    {
      title: 'Chat đang hoạt động',
      value: mockStats.activeChats,
      icon: MessageCircle,
      color: 'blue',
    },
    {
      title: 'Đơn hàng hôm nay',
      value: mockStats.ordersToday,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Doanh thu hôm nay',
      value: `₫${(mockStats.totalRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'emerald',
      trend: {
        value: '+12%',
        type: 'positive' as const,
        label: 'so với hôm qua',
      },
    },
  ]

  return (
    
      <div>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
            Dashboard Tổng quan
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý công việc hàng ngày của bạn</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList className='grid w-full grid-cols-5 bg-white/80 backdrop-blur-lg border-2 border-blue-100'>
            <TabsTrigger value='overview' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value='prescriptions'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Đơn thuốc
            </TabsTrigger>
            <TabsTrigger
              value='create-order'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Tạo đơn hàng
            </TabsTrigger>
            <TabsTrigger value='chats' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
              Tư vấn
            </TabsTrigger>
            <TabsTrigger value='reports' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
              Báo cáo
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Stats Cards - Using reusable hook */}
            <StatsCardGrid cols={4}>
              {statsCards.map((stat, index) => (
                <StatsCard key={index} config={stat} />
              ))}
            </StatsCardGrid>

            {/* Recent Activities */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Recent Prescriptions */}
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
                <CardHeader>
                  <CardTitle className='text-blue-800 flex items-center justify-between'>
                    Đơn thuốc mới nhất
                    <Link to='/pharmacist/prescriptions'>
                      <Button variant='outline' size='sm'>
                        Xem tất cả
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {mockPrescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <Avatar className='w-8 h-8'>
                            <AvatarFallback>{prescription.customerName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{prescription.customerName}</p>
                            <p className='text-xs text-gray-500'>{prescription.customerPhone}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(prescription.status)}`}>
                          {getStatusText(prescription.status)}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-600 mb-2'>{prescription.productName}</p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500'>{formatTime(prescription.createdAt)}</span>
                        <Button size='sm' variant='outline'>
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Active Chats */}
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
                <CardHeader>
                  <CardTitle className='text-blue-800 flex items-center justify-between'>
                    Tư vấn đang hoạt động
                    <Link to='/pharmacist/chats'>
                      <Button variant='outline' size='sm'>
                        Xem tất cả
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {mockChats.map((chat) => (
                    <div key={chat.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <Avatar className='w-8 h-8'>
                            <AvatarFallback>{chat.customerName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{chat.customerName}</p>
                            <p className='text-xs text-gray-500'>{formatTime(chat.timestamp)}</p>
                          </div>
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge className='bg-red-500 text-white text-xs'>{chat.unreadCount}</Badge>
                        )}
                      </div>
                      <p className='text-sm text-gray-600 line-clamp-1 mb-2'>{chat.lastMessage}</p>
                      <Button size='sm' variant='outline' className='w-full'>
                        Trả lời
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value='prescriptions'>
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Quản lý đơn thuốc</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {mockPrescriptions.map((prescription) => (
                    <div key={prescription.id} className='border border-gray-200 rounded-lg p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center gap-4'>
                          <Avatar>
                            <AvatarFallback>{prescription.customerName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className='font-medium'>{prescription.customerName}</h3>
                            <p className='text-sm text-gray-600'>{prescription.customerPhone}</p>
                            <p className='text-xs text-gray-500'>
                              {formatDate(prescription.createdAt)} lúc {formatTime(prescription.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(prescription.status)}>
                          {getStatusText(prescription.status)}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                        <div>
                          <p className='text-sm font-medium mb-1'>Sản phẩm:</p>
                          <p className='text-sm text-gray-600'>{prescription.productName}</p>
                        </div>
                        <div>
                          <p className='text-sm font-medium mb-1'>Ghi chú:</p>
                          <p className='text-sm text-gray-600'>{prescription.notes}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <Button variant='outline' size='sm'>
                          📋 Xem đơn thuốc
                        </Button>
                        <Button variant='outline' size='sm'>
                          💬 Chat
                        </Button>
                        <Link to={`/pharmacist/create-order?prescription=${prescription.id}`}>
                          <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                            <Plus className='w-4 h-4 mr-1' />
                            Tạo đơn hàng
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Order Tab */}
          <TabsContent value='create-order'>
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <Plus className='w-5 h-5' />
                  Tạo đơn hàng mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-12'>
                  <Plus className='w-16 h-16 text-blue-300 mx-auto mb-4' />
                  <h3 className='text-xl font-medium text-gray-900 mb-2'>Module tạo đơn hàng</h3>
                  <p className='text-gray-600 mb-6'>Tính năng này sẽ được triển khai trong phiên bản tiếp theo</p>
                  <Link to='/pharmacist/create-order'>
                    <Button className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'>
                      Đi đến trang tạo đơn hàng
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value='chats'>
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Quản lý tư vấn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {mockChats.map((chat) => (
                    <div key={chat.id} className='border border-gray-200 rounded-lg p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarFallback>{chat.customerName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className='font-medium'>{chat.customerName}</h3>
                            <p className='text-sm text-gray-600'>
                              {formatDate(chat.timestamp)} lúc {formatTime(chat.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {chat.unreadCount > 0 && (
                            <Badge className='bg-red-500 text-white'>{chat.unreadCount} tin nhắn mới</Badge>
                          )}
                          <Badge className={getStatusColor(chat.status)}>{getStatusText(chat.status)}</Badge>
                        </div>
                      </div>

                      <p className='text-sm text-gray-600 mb-4'>Tin nhắn cuối: "{chat.lastMessage}"</p>

                      <div className='flex items-center gap-3'>
                        <Link to={`/consultation/chat/${chat.id}`}>
                          <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                            <MessageCircle className='w-4 h-4 mr-1' />
                            Trả lời
                          </Button>
                        </Link>
                        <Button variant='outline' size='sm'>
                          Hoàn thành
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value='reports'>
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Báo cáo & Thống kê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-12'>
                  <BarChart3 className='w-16 h-16 text-blue-300 mx-auto mb-4' />
                  <h3 className='text-xl font-medium text-gray-900 mb-2'>Báo cáo chi tiết</h3>
                  <p className='text-gray-600 mb-6'>Thống kê doanh thu, đơn hàng và hiệu suất làm việc</p>
                  <Button className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'>
                    Xem báo cáo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  )
}
