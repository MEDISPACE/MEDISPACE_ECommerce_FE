import { useState } from 'react'
import { Plus, Image, FileText, Tag, Edit, Trash2, Eye, Calendar, TrendingUp, Megaphone } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { getContentStatusBadge as getBadge } from '../../utils/badgeUtils'

interface Banner {
  id: string
  title: string
  imageUrl: string
  link: string
  position: 'hero' | 'sidebar' | 'footer'
  status: 'active' | 'scheduled' | 'inactive'
  startDate: string
  endDate?: string
  clicks: number
  views: number
}

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl: string
  category: string
  author: string
  publishDate: string
  status: 'published' | 'draft' | 'scheduled'
  views: number
  featured: boolean
}

interface Promotion {
  id: string
  code: string
  title: string
  description: string
  type: 'percentage' | 'fixed' | 'freeShip'
  value: number
  minOrder?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
  status: 'active' | 'expired' | 'scheduled'
}

const mockBanners: Banner[] = [
  {
    id: 'B001',
    title: 'Khuyến mãi Black Friday 2025',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    link: '/promotions/black-friday',
    position: 'hero',
    status: 'active',
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    clicks: 2450,
    views: 15230,
  },
  {
    id: 'B002',
    title: 'Tư vấn miễn phí 24/7',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    link: '/contact',
    position: 'sidebar',
    status: 'active',
    startDate: '2025-01-01',
    clicks: 890,
    views: 8420,
  },
]

const mockNews: NewsArticle[] = [
  {
    id: 'N001',
    title: '5 Cách Tăng Cường Hệ Miễn Dịch Mùa Lạnh',
    slug: 'tang-cuong-he-mien-dich-mua-lanh',
    excerpt: 'Khám phá những phương pháp hiệu quả để tăng cường sức đề kháng trong mùa đông...',
    content: 'Full article content here...',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600',
    category: 'Sức khỏe',
    author: 'BS. Nguyễn Văn A',
    publishDate: '2025-01-15',
    status: 'published',
    views: 1250,
    featured: true,
  },
  {
    id: 'N002',
    title: 'Vitamin D: Tầm Quan Trọng Với Sức Khỏe',
    slug: 'vitamin-d-tam-quan-trong',
    excerpt: 'Vai trò thiết yếu của vitamin D đối với xương khớp và hệ miễn dịch...',
    content: 'Full article content here...',
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600',
    category: 'Dinh dưỡng',
    author: 'DS. Trần Thị B',
    publishDate: '2025-01-14',
    status: 'published',
    views: 980,
    featured: false,
  },
]

const mockPromotions: Promotion[] = [
  {
    id: 'P001',
    code: 'NEWYEAR2025',
    title: 'Giảm giá Tết Nguyên Đán',
    description: 'Giảm 20% cho đơn hàng từ 500K',
    type: 'percentage',
    value: 20,
    minOrder: 500000,
    maxDiscount: 200000,
    startDate: '2025-01-20',
    endDate: '2025-02-10',
    usageLimit: 1000,
    usageCount: 342,
    status: 'active',
  },
  {
    id: 'P002',
    code: 'FREESHIP50',
    title: 'Miễn phí vận chuyển',
    description: 'Free ship cho đơn từ 300K',
    type: 'freeShip',
    value: 0,
    minOrder: 300000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageCount: 1580,
    status: 'active',
  },
]

export function ContentManagementPage() {
  const [banners, setBanners] = useState<Banner[]>(mockBanners)
  const [news, setNews] = useState<NewsArticle[]>(mockNews)
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions)

  const handleDelete = (type: string, id: string) => {
    if (type === 'banner') {
      setBanners(banners.filter((b) => b.id !== id))
    } else if (type === 'news') {
      setNews(news.filter((n) => n.id !== id))
    } else if (type === 'promotion') {
      setPromotions(promotions.filter((p) => p.id !== id))
    }
    toast.success('Đã xóa thành công')
  }

  // Map content-specific statuses to standard badge statuses
  const getStatusBadge = (status: string) => {
    if (status === 'active') return getBadge('published')
    if (status === 'published') return getBadge('published')
    if (status === 'inactive') return getBadge('draft')
    if (status === 'draft') return getBadge('draft')
    // For custom statuses like "scheduled" or "expired", use custom badges
    if (status === 'scheduled') return <Badge className='bg-blue-100 text-blue-800 border-blue-200'>Đã lên lịch</Badge>
    if (status === 'expired') return <Badge className='bg-red-100 text-red-800 border-red-200'>Hết hạn</Badge>
    return <Badge variant='outline'>{status}</Badge>
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <h1
          className='text-3xl font-bold bg-clip-text text-transparent'
          style={{
            backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
          }}
        >
          Quản lý nội dung
        </h1>
        <p className='text-gray-600 mt-1'>Quản lý banner, tin tức và chương trình khuyến mãi</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Image className='w-5 h-5 text-blue-600' />
              <span className='text-sm text-blue-800'>Banners</span>
            </div>
            <p className='text-2xl text-blue-900'>{banners.length}</p>
            <p className='text-xs text-blue-600 mt-1'>
              {banners.filter((b) => b.status === 'active').length} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <FileText className='w-5 h-5 text-green-600' />
              <span className='text-sm text-green-800'>Tin tức</span>
            </div>
            <p className='text-2xl text-green-900'>{news.length}</p>
            <p className='text-xs text-green-600 mt-1'>
              {news.filter((n) => n.status === 'published').length} đã xuất bản
            </p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Tag className='w-5 h-5 text-[#0066CC]' />
              <span className='text-sm text-[#0066CC]'>Khuyến mãi</span>
            </div>
            <p className='text-2xl text-[#0066CC]'>{promotions.length}</p>
            <p className='text-xs text-[#4A90E2] mt-1'>
              {promotions.filter((p) => p.status === 'active').length} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <TrendingUp className='w-5 h-5 text-orange-600' />
              <span className='text-sm text-orange-800'>Lượt xem</span>
            </div>
            <p className='text-2xl text-orange-900'>
              {banners.reduce((sum, b) => sum + b.views, 0) + news.reduce((sum, n) => sum + n.views, 0)}
            </p>
            <p className='text-xs text-orange-600 mt-1'>Tổng lượt xem</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='banners' className='space-y-4'>
        <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
          <TabsList className='grid w-full grid-cols-3 !bg-blue-50 p-1.5 rounded-lg h-auto'>
            <TabsTrigger value='banners' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Banners
            </TabsTrigger>
            <TabsTrigger value='news' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Tin tức
            </TabsTrigger>
            <TabsTrigger value='promotions' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Khuyến mãi
            </TabsTrigger>
          </TabsList>

          {/* Banners Tab */}
          <TabsContent value='banners' className='space-y-4 mt-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-blue-900'>Quản lý banners</h3>
              <Button
                onClick={() => {
                  // TODO: Implement banner creation dialog
                }}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              >
                <Plus className='w-4 h-4 mr-2' />
                Thêm banner
              </Button>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              {banners.map((banner) => (
                <Card
                  key={banner.id}
                  className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'
                >
                  <CardContent className='p-4'>
                    <div className='aspect-video mb-3 rounded-lg overflow-hidden bg-gray-100'>
                      <img src={banner.imageUrl} alt={banner.title} className='w-full h-full object-cover' />
                    </div>
                    <div className='flex items-start justify-between mb-2'>
                      <h4 className='text-blue-900 flex-1'>{banner.title}</h4>
                      {getStatusBadge(banner.status)}
                    </div>
                    <div className='space-y-1 text-sm text-gray-600 mb-3'>
                      <p>
                        Vị trí: <span className='text-blue-600'>{banner.position}</span>
                      </p>
                      <p>
                        Lượt xem: <strong>{banner.views.toLocaleString()}</strong>
                      </p>
                      <p>
                        Clicks: <strong>{banner.clicks.toLocaleString()}</strong>
                      </p>
                      <p>
                        CTR: <strong>{((banner.clicks / banner.views) * 100).toFixed(2)}%</strong>
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex-1 border-2 border-blue-200 hover:border-blue-500'
                        onClick={() => {
                          // TODO: Implement banner edit dialog
                        }}
                      >
                        <Edit className='w-4 h-4 mr-1' />
                        Sửa
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-2 border-red-200 hover:border-red-500 text-red-600'
                        onClick={() => handleDelete('banner', banner.id)}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value='news' className='space-y-4 mt-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-blue-900'>Quản lý tin tức</h3>
              <Button
                onClick={() => {
                  // TODO: Implement news article creation dialog
                }}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              >
                <Plus className='w-4 h-4 mr-2' />
                Thêm bài viết
              </Button>
            </div>

            <div className='space-y-3'>
              {news.map((article) => (
                <Card
                  key={article.id}
                  className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'
                >
                  <CardContent className='p-4'>
                    <div className='flex gap-4'>
                      <div className='w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                        <img src={article.imageUrl} alt={article.title} className='w-full h-full object-cover' />
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <h4 className='text-blue-900 mb-1'>{article.title}</h4>
                            <p className='text-sm text-gray-600 line-clamp-2'>{article.excerpt}</p>
                          </div>
                          {getStatusBadge(article.status)}
                        </div>
                        <div className='flex items-center gap-4 text-xs text-gray-500 mb-2'>
                          <span className='flex items-center gap-1'>
                            <Tag className='w-3 h-3' />
                            {article.category}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            {new Date(article.publishDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Eye className='w-3 h-3' />
                            {article.views} lượt xem
                          </span>
                          {article.featured && (
                            <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>Nổi bật</Badge>
                          )}
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='border-2 border-blue-200 hover:border-blue-500'
                            onClick={() => {
                              // TODO: Implement news article edit dialog
                            }}
                          >
                            <Edit className='w-4 h-4 mr-1' />
                            Sửa
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='border-2 border-red-200 hover:border-red-500 text-red-600'
                            onClick={() => handleDelete('news', article.id)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value='promotions' className='space-y-4 mt-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-blue-900'>Quản lý khuyến mãi</h3>
              <Button
                onClick={() => {
                  // TODO: Implement promotion creation dialog
                }}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              >
                <Plus className='w-4 h-4 mr-2' />
                Tạo khuyến mãi
              </Button>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              {promotions.map((promo) => (
                <Card
                  key={promo.id}
                  className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Megaphone className='w-5 h-5 text-blue-600' />
                          <h4 className='text-blue-900'>{promo.title}</h4>
                        </div>
                        <Badge className='bg-blue-500 text-white'>{promo.code}</Badge>
                      </div>
                      {getStatusBadge(promo.status)}
                    </div>
                    <p className='text-sm text-gray-600 mb-3'>{promo.description}</p>
                    <div className='space-y-2 text-sm mb-3'>
                      <div className='flex items-center justify-between p-2 bg-blue-50 rounded'>
                        <span className='text-gray-600'>Giảm giá:</span>
                        <span className='text-blue-900'>
                          {promo.type === 'percentage'
                            ? `${promo.value}%`
                            : promo.type === 'fixed'
                              ? `${promo.value.toLocaleString()}₫`
                              : 'Miễn phí ship'}
                        </span>
                      </div>
                      {promo.usageLimit && (
                        <div className='flex items-center justify-between p-2 bg-green-50 rounded'>
                          <span className='text-gray-600'>Đã dùng:</span>
                          <span className='text-green-900'>
                            {promo.usageCount} / {promo.usageLimit}
                          </span>
                        </div>
                      )}
                      <div className='flex items-center justify-between p-2 bg-blue-50 rounded'>
                        <span className='text-gray-600'>Thời hạn:</span>
                        <span className='text-[#0066CC]'>
                          {new Date(promo.startDate).toLocaleDateString('vi-VN')} -{' '}
                          {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex-1 border-2 border-blue-200 hover:border-blue-500'
                        onClick={() => {
                          // TODO: Implement promotion edit dialog
                        }}
                      >
                        <Edit className='w-4 h-4 mr-1' />
                        Sửa
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-2 border-red-200 hover:border-red-500 text-red-600'
                        onClick={() => handleDelete('promotion', promo.id)}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
