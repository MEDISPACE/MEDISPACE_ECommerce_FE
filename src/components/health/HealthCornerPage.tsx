import { Search, Heart, Brain, Stethoscope, Eye, Bone, Clock, User, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useState } from 'react'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

const healthCategories = [
  {
    id: 'tim-mach',
    name: 'Tim mạch',
    icon: Heart,
    color: 'text-red-500 bg-red-50',
    articleCount: 45,
    description: 'Bệnh tim, huyết áp, mạch máu',
  },
  {
    id: 'than-kinh',
    name: 'Thần kinh',
    icon: Brain,
    color: 'text-purple-500 bg-purple-50',
    articleCount: 32,
    description: 'Đau đầu, mất ngủ, căng thẳng',
  },
  {
    id: 'ho-hap',
    name: 'Hô hấp',
    icon: Stethoscope,
    color: 'text-blue-500 bg-blue-50',
    articleCount: 38,
    description: 'Cảm cúm, ho, hen suyễn',
  },
  {
    id: 'mat',
    name: 'Mắt',
    icon: Eye,
    color: 'text-green-500 bg-green-50',
    articleCount: 24,
    description: 'Cận thị, khô mắt, đau mắt',
  },
  {
    id: 'xuong-khop',
    name: 'Xương khớp',
    icon: Bone,
    color: 'text-orange-500 bg-orange-50',
    articleCount: 29,
    description: 'Viêm khớp, đau lưng, gout',
  },
]

const featuredArticles = [
  {
    id: '1',
    title: '10 dấu hiệu cảnh báo bệnh tim bạn không nên bỏ qua',
    excerpt: 'Nhận biết sớm các triệu chứng bệnh tim để có biện pháp điều trị kịp thời và hiệu quả nhất.',
    category: 'Tim mạch',
    author: 'BS. Nguyễn Văn An',
    publishDate: '2024-01-15',
    readTime: '5 phút đọc',
    image: '/images/heart-health.jpg',
    isPopular: true,
  },
  {
    id: '2',
    title: 'Cách phòng ngừa cảm cúm mùa đông hiệu quả',
    excerpt: 'Hướng dẫn chi tiết các biện pháp phòng ngừa cảm cúm trong mùa lạnh để bảo vệ sức khỏe gia đình.',
    category: 'Hô hấp',
    author: 'BS. Trần Thị Lan',
    publishDate: '2024-01-12',
    readTime: '4 phút đọc',
    image: '/images/flu-prevention.jpg',
    isPopular: false,
  },
  {
    id: '3',
    title: 'Tập thể dục đúng cách để giảm đau lưng',
    excerpt: 'Những bài tập đơn giản giúp giảm đau lưng và tăng cường sức khỏe cột sống hiệu quả.',
    category: 'Xương khớp',
    author: 'ThS. Lê Minh Tuấn',
    publishDate: '2024-01-10',
    readTime: '6 phút đọc',
    image: '/images/back-pain-exercise.jpg',
    isPopular: true,
  },
]

const healthTips = [
  {
    id: '1',
    title: 'Uống đủ nước mỗi ngày',
    description: '2-2.5 lít nước giúp cơ thể hoạt động tốt',
  },
  {
    id: '2',
    title: 'Ngủ đủ 7-8 tiếng mỗi đêm',
    description: 'Giấc ngủ chất lượng giúp phục hồi sức khỏe',
  },
  {
    id: '3',
    title: 'Vận động 30 phút mỗi ngày',
    description: 'Tập thể dục đều đặn tăng cường miễn dịch',
  },
  {
    id: '4',
    title: 'Ăn nhiều rau xanh và trái cây',
    description: 'Cung cấp vitamin và chất xơ cần thiết',
  },
]

export function HealthCornerPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const breadcrumbItems = [{ label: 'Bệnh & Góc sức khỏe' }]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Handle search logic here
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        {/* Hero Section */}
        <div className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-16'>
          <div className='max-w-7xl mx-auto px-4'>
            <div className='text-center mb-8'>
              <h1 className='text-4xl md:text-5xl font-bold mb-4'>Bệnh & Góc sức khỏe</h1>
              <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
                Kiến thức y khoa uy tín, lời khuyên sức khỏe từ các chuyên gia hàng đầu
              </p>
            </div>

            {/* Search Bar */}
            <div className='max-w-2xl mx-auto'>
              <form onSubmit={handleSearch} className='relative'>
                <Input
                  type='text'
                  placeholder='Tìm kiếm thông tin sức khỏe...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-12 pr-4 py-4 text-lg text-gray-900 placeholder:text-gray-500 bg-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-blue-500 focus:bg-white shadow-lg rounded-2xl'
                />
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Button
                  type='submit'
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-[16px] px-[16px] py-[8px] mt-[0px] mr-[-8px] mb-[0px] ml-[0px]'
                >
                  Tìm kiếm
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 py-12'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Main Content */}
            <div className='lg:col-span-3'>
              {/* Health Categories */}
              <section className='mb-12'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>Chuyên mục sức khỏe</h2>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                  {healthCategories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <Card key={category.id} className='hover:shadow-lg transition-all cursor-pointer group'>
                        <CardContent className='p-4 text-center'>
                          <div
                            className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                          >
                            <IconComponent className='w-6 h-6' />
                          </div>
                          <h3 className='font-medium text-gray-900 mb-1'>{category.name}</h3>
                          <p className='text-xs text-gray-500 mb-2'>{category.description}</p>
                          <Badge variant='secondary' className='text-xs'>
                            {category.articleCount} bài viết
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>

              {/* Featured Articles */}
              <section className='mb-12'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-gray-900'>Bài viết nổi bật</h2>
                  <Button variant='outline' className='text-blue-600 border-blue-200 hover:bg-blue-50'>
                    Xem tất cả
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {featuredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className='overflow-hidden hover:shadow-xl transition-all cursor-pointer group'
                    >
                      <div className='relative'>
                        <ImageWithFallback
                          src={article.image}
                          alt={article.title}
                          className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                        />
                        {article.isPopular && (
                          <Badge className='absolute top-3 left-3 bg-red-500 hover:bg-red-600'>Phổ biến</Badge>
                        )}
                        <Badge variant='secondary' className='absolute top-3 right-3'>
                          {article.category}
                        </Badge>
                      </div>
                      <CardContent className='p-6'>
                        <h3 className='font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors'>
                          {article.title}
                        </h3>
                        <p className='text-gray-600 text-sm mb-4 line-clamp-3'>{article.excerpt}</p>
                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <div className='flex items-center'>
                            <User className='w-3 h-3 mr-1' />
                            {article.author}
                          </div>
                          <div className='flex items-center'>
                            <Clock className='w-3 h-3 mr-1' />
                            {article.readTime}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className='lg:col-span-1'>
              {/* Health Tips */}
              <Card className='mb-8'>
                <CardHeader>
                  <CardTitle className='text-lg text-blue-600'>Mẹo sức khỏe hàng ngày</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {healthTips.map((tip) => (
                    <div key={tip.id} className='p-3 bg-blue-50 rounded-lg'>
                      <h4 className='font-medium text-gray-900 mb-1'>{tip.title}</h4>
                      <p className='text-sm text-gray-600'>{tip.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg text-blue-600'>Dịch vụ nhanh</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button variant='outline' className='w-full justify-start text-left' asChild>
                    <a href='/contact'>
                      <Stethoscope className='w-4 h-4 mr-2' />
                      Tư vấn dược sĩ
                    </a>
                  </Button>
                  <Button variant='outline' className='w-full justify-start text-left' asChild>
                    <a href='/prescription/upload'>
                      <Search className='w-4 h-4 mr-2' />
                      Gửi đơn thuốc
                    </a>
                  </Button>
                  <Button variant='outline' className='w-full justify-start text-left' asChild>
                    <a href='/products'>
                      <Heart className='w-4 h-4 mr-2' />
                      Mua thuốc online
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
