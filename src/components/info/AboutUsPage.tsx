import { Building2, Users, Award, Heart, Target, TrendingUp, Shield, Sparkles } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

export function AboutUsPage() {
  const breadcrumbItems = [{ label: 'Trang chủ', href: '/' }, { label: 'Về chúng tôi' }]

  const stats = [
    {
      icon: Users,
      label: 'Khách hàng',
      value: '500K+',
      color: 'from-[#0A2463] to-[#1E40AF]',
    },
    {
      icon: Award,
      label: 'Năm kinh nghiệm',
      value: '15+',
      color: 'from-[#0A2463] to-[#1E40AF]',
    },
    {
      icon: Heart,
      label: 'Sản phẩm',
      value: '10K+',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Building2,
      label: 'Chi nhánh',
      value: '50+',
      color: 'from-orange-500 to-red-500',
    },
  ]

  const values = [
    {
      icon: Shield,
      title: 'Uy tín & Chất lượng',
      description: 'Cam kết 100% sản phẩm chính hãng, nguồn gốc rõ ràng, được kiểm định nghiêm ngặt',
    },
    {
      icon: Heart,
      title: 'Chăm sóc tận tâm',
      description: 'Đội ngũ dược sĩ chuyên nghiệp, tư vấn 24/7, đồng hành cùng sức khỏe của bạn',
    },
    {
      icon: Sparkles,
      title: 'Đổi mới công nghệ',
      description: 'Ứng dụng công nghệ hiện đại, mua sắm online tiện lợi, giao hàng nhanh chóng',
    },
    {
      icon: Target,
      title: 'Giá cả hợp lý',
      description: 'Chính sách giá tốt nhất thị trường, nhiều chương trình khuyến mãi hấp dẫn',
    },
  ]

  const milestones = [
    {
      year: '2010',
      event: 'Thành lập MEDISPACE với cửa hàng đầu tiên tại TP.HCM',
    },
    {
      year: '2015',
      event: 'Mở rộng mạng lưới 20 chi nhánh trên toàn quốc',
    },
    {
      year: '2018',
      event: 'Ra mắt nền tảng thương mại điện tử MEDISPACE Online',
    },
    {
      year: '2020',
      event: 'Đạt 500,000 khách hàng tin dùng, top 3 chuỗi nhà thuốc uy tín',
    },
    {
      year: '2023',
      event: 'Triển khai hệ thống tư vấn dược sĩ trực tuyến 24/7',
    },
    {
      year: '2025',
      event: 'Khai trương 50+ chi nhánh, phủ sóng 63 tỉnh thành',
    },
  ]

  return (
    <div className='max-w-7xl mx-auto px-4 py-12 space-y-16'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Hero Section */}
      <div className='text-center space-y-6 animate-slide-in-up'>
        <h1 className='bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] bg-clip-text text-transparent'>
          Đồng hành cùng sức khỏe Việt
        </h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
          MEDISPACE là chuỗi nhà thuốc uy tín hàng đầu Việt Nam, với sứ mệnh mang đến giải pháp chăm sóc sức khỏe toàn
          diện, chất lượng cao và giá cả hợp lý cho mọi gia đình Việt.
        </p>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        {stats.map((stat, index) => (
          <Card
            key={index}
            className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] hover:shadow-xl transition-all animate-slide-in-up'
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className='p-6 text-center'>
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
              >
                <stat.icon className='w-8 h-8 text-white' />
              </div>
              <p className='text-3xl mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
                {stat.value}
              </p>
              <p className='text-sm text-gray-600'>{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* About Image & Story */}
      <div className='grid md:grid-cols-2 gap-12 items-center'>
        <div className='space-y-6 animate-slide-in-left'>
          <h2 className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent'>
            Câu chuyện của chúng tôi
          </h2>
          <p className='text-gray-700 leading-relaxed'>
            Được thành lập từ năm 2010, MEDISPACE bắt đầu từ một cửa hàng nhỏ tại TP. Hồ Chí Minh với khát vọng mang đến
            dịch vụ chăm sóc sức khỏe chất lượng cao cho người Việt.
          </p>
          <p className='text-gray-700 leading-relaxed'>
            Trải qua 15 năm phát triển, chúng tôi đã trở thành một trong những chuỗi nhà thuốc uy tín hàng đầu với hơn
            50 chi nhánh trên khắp cả nước, phục vụ hơn 500,000 khách hàng tin tưởng.
          </p>
          <p className='text-gray-700 leading-relaxed'>
            Không chỉ dừng lại ở việc cung cấp thuốc và sản phẩm chăm sóc sức khỏe, MEDISPACE còn tiên phong ứng dụng
            công nghệ với nền tảng thương mại điện tử và dịch vụ tư vấn dược sĩ trực tuyến 24/7, giúp khách hàng tiếp
            cận dịch vụ y tế dễ dàng và tiện lợi hơn.
          </p>
        </div>
        <div className='relative animate-slide-in-right'>
          <div className='absolute inset-0 bg-gradient-to-br from-[#BFDBFE] to-[#1E40AF] rounded-2xl blur-2xl opacity-20'></div>
          <ImageWithFallback
            src='https://images.unsplash.com/photo-1652295372392-3171ab2c0e01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
            alt='MEDISPACE Team'
            className='relative rounded-2xl shadow-2xl w-full h-96 object-cover'
          />
        </div>
      </div>

      {/* Core Values */}
      <div className='space-y-8'>
        <div className='text-center'>
          <h2 className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent mb-4'>
            Giá trị cốt lõi
          </h2>
          <p className='text-gray-600 max-w-2xl mx-auto'>Những giá trị mà chúng tôi cam kết mang đến cho khách hàng</p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {values.map((value, index) => (
            <Card
              key={index}
              className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] hover:border-[#BFDBFE] hover:shadow-xl transition-all group animate-slide-in-up'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className='p-6 text-center space-y-4'>
                <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#F0F6FF] to-[#E8EDF5] flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <value.icon className='w-8 h-8 text-[#1E40AF]' />
                </div>
                <h3 className='text-blue-900'>{value.title}</h3>
                <p className='text-sm text-gray-600 leading-relaxed'>{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className='space-y-8'>
        <div className='text-center'>
          <h2 className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent mb-4'>
            Hành trình phát triển
          </h2>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Những cột mốc quan trọng trong quá trình phát triển của MEDISPACE
          </p>
        </div>

        <div className='relative'>
          {/* Timeline line */}
          <div className='absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-200 via-[#BFDBFE] to-blue-200 hidden md:block'></div>

          <div className='space-y-8'>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} animate-slide-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] hover:shadow-xl transition-all'>
                    <CardContent className='p-6'>
                      <div className='flex items-center gap-3 mb-2'>
                        <Badge className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'>
                          {milestone.year}
                        </Badge>
                        <TrendingUp className='w-4 h-4 text-[#1E40AF]' />
                      </div>
                      <p className='text-gray-700'>{milestone.event}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline dot */}
                <div className='hidden md:block'>
                  <div className='w-4 h-4 rounded-full bg-gradient-to-br from-[#0A2463] to-[#1E40AF] shadow-lg'></div>
                </div>

                <div className='flex-1 hidden md:block'></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] rounded-2xl p-12 text-center space-y-6'>
        <h2 className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent'>
          Đội ngũ chuyên nghiệp
        </h2>
        <p className='text-gray-700 max-w-3xl mx-auto leading-relaxed'>
          MEDISPACE tự hào sở hữu đội ngũ dược sĩ, bác sĩ và chuyên viên y tế có trình độ chuyên môn cao, nhiều năm kinh
          nghiệm, luôn tận tâm chăm sóc và tư vấn cho khách hàng.
        </p>
        <div className='relative max-w-4xl mx-auto mt-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-[#BFDBFE] to-[#1E40AF] rounded-2xl blur-2xl opacity-20'></div>
          <ImageWithFallback
            src='https://images.unsplash.com/photo-1758519290233-a03c1d17ecc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
            alt='MEDISPACE Professional Team'
            className='relative rounded-2xl shadow-2xl w-full h-80 object-cover'
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className='text-center space-y-6 bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] rounded-2xl p-12 text-white'>
        <h2 className='text-white'>Hãy để MEDISPACE chăm sóc sức khỏe của bạn</h2>
        <p className='text-xl text-blue-50 max-w-2xl mx-auto'>
          Tham gia cộng đồng hơn 500,000 khách hàng đang tin tưởng sử dụng dịch vụ của chúng tôi
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center mt-8'>
          <a
            href='/products'
            className='inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#1E40AF] rounded-lg hover:bg-[#F0F6FF] transition-colors shadow-lg'
          >
            Khám phá sản phẩm
          </a>
          <a
            href='/contact'
            className='inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#071A49] text-white rounded-lg hover:bg-blue-800 transition-colors border-2 border-white/20'
          >
            Tư vấn miễn phí
          </a>
        </div>
      </div>
    </div>
  )
}
