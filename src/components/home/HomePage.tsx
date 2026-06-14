import React, { useState } from 'react'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { ScrollReveal } from '../shared/ScrollReveal'
import { Button } from '../ui/button'
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Bone,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplets,
  HeartPulse,
  Leaf,
  MessageCircle,
  Pill,
  RefreshCw,
  Search,
  Shield,
  Star,
  Stethoscope,
  Thermometer,
  Truck,
  Upload,
  User,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useCategories } from '../../hooks/product'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { useTrending, useForYou } from '../../hooks/product/useRecommendations'
import { useAuth } from '../../contexts/AuthContext'

const heroImage =
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=82'

const categoryIcons = {
  thuoc: Pill,
  'thuc-pham-chuc-nang': Leaf,
  'cham-soc-ca-nhan': User,
  'thiet-bi-y-te': Stethoscope,
  'duoc-my-pham': Droplets,
}

const popularSearches = ['Paracetamol', 'Vitamin C', 'Omega 3', 'Cảm cúm']

const healthNeeds = [
  { label: 'Cảm cúm', slug: 'cam-cum', icon: Thermometer, count: '420+' },
  { label: 'Đau đầu', slug: 'dau-dau', icon: Activity, count: '180+' },
  { label: 'Tiểu đường', slug: 'tieu-duong', icon: HeartPulse, count: '260+' },
  { label: 'Huyết áp', slug: 'huyet-ap', icon: HeartPulse, count: '310+' },
  { label: 'Tim mạch', slug: 'tim-mach', icon: HeartPulse, count: '240+' },
  { label: 'Xương khớp', slug: 'xuong-khop', icon: Bone, count: '390+' },
  { label: 'Vitamin', slug: 'vitamin', icon: Leaf, count: '520+' },
  { label: 'Phụ nữ', slug: 'phu-nu', icon: User, count: '210+' },
]

const pharmacists = [
  {
    name: 'DS. Minh Anh',
    role: 'Dược sĩ tư vấn',
    experience: '8 năm kinh nghiệm',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'DS. Lan Hương',
    role: 'Kiểm tra đơn thuốc',
    experience: '6 năm kinh nghiệm',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'DS. Tuấn Minh',
    role: 'Dược lâm sàng',
    experience: '10 năm kinh nghiệm',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=320&q=80',
  },
]

const healthArticles = [
  {
    title: 'Cách chọn thuốc cảm cúm an toàn khi tự chăm sóc tại nhà',
    category: 'Sức khỏe hô hấp',
    excerpt: 'Những dấu hiệu cần lưu ý, khi nào nên hỏi dược sĩ và khi nào cần đi khám.',
    date: '14/06/2026',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Vitamin D3, Canxi và những lưu ý khi dùng cho người lớn tuổi',
    category: 'Xương khớp',
    excerpt: 'Hướng dẫn đọc liều dùng, thời điểm uống và các tương tác thường gặp.',
    date: '12/06/2026',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Đơn thuốc online: quy trình dược sĩ kiểm tra trước khi giao',
    category: 'An toàn thuốc',
    excerpt: 'MediSpace xác minh đơn, đối chiếu tương tác và tư vấn trước khi hoàn tất.',
    date: '10/06/2026',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80',
  },
]

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [heroSearch, setHeroSearch] = useState('')
  const { products: forYouProducts, loading: forYouLoading, algorithm: forYouAlgorithm } = useForYou(8, isAuthenticated)
  const { products: trendingProducts, loading: trendingLoading, algorithm: trendingAlgorithm } = useTrending(8)
  const { categories: realCategories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories()

  const submitHeroSearch = (query = heroSearch) => {
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const openConsultation = () => {
    const chatBtn = document.querySelector('button[aria-label="Chat với dược sĩ"]') as HTMLButtonElement | null
    if (chatBtn) chatBtn.click()
    else navigate('/contact')
  }

  return (
    <EnhancedPageTransition variant='default' duration={0.35}>
      <section className='bg-[#F8FAFB]'>
        <div className='mx-auto grid max-w-7xl grid-cols-1 overflow-hidden lg:min-h-[520px] lg:grid-cols-[55%_45%]'>
          <div className='flex items-center px-4 py-12 md:px-8 lg:px-10 lg:py-16'>
            <div className='max-w-2xl'>
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white px-4 py-2 text-sm font-semibold text-[#0A2463]'>
                <Shield className='h-4 w-4 text-[#059669]' />
                Nhà thuốc trực tuyến có phép hoạt động
              </div>

              <h1 className='font-display text-4xl font-extrabold leading-[1.1] text-[#0A2463] md:text-5xl'>
                Nhà thuốc trực tuyến đáng tin cậy cho gia đình Việt
              </h1>

              <p className='mt-5 text-lg leading-8 text-[#4B5E7A]'>
                Hơn 10,000 sản phẩm chính hãng, dược sĩ tư vấn 24/7 và giao hàng trong 2 giờ tại khu vực hỗ trợ.
              </p>

              <form
                className='mt-8 rounded-xl border-2 border-[#BFDBFE] bg-white p-2 shadow-[0_8px_24px_rgba(10,36,99,0.08)] focus-within:border-[#0A2463]'
                onSubmit={(event) => {
                  event.preventDefault()
                  submitHeroSearch()
                }}
              >
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <div className='flex min-h-12 flex-1 items-center gap-3 px-3'>
                    <Search className='h-5 w-5 text-[#8094AE]' />
                    <input
                      value={heroSearch}
                      onChange={(event) => setHeroSearch(event.target.value)}
                      className='h-12 w-full bg-transparent text-base text-[#1C2B4A] outline-none placeholder:text-[#8094AE]'
                      placeholder='Tìm thuốc, bệnh lý, thương hiệu...'
                      aria-label='Tìm thuốc, bệnh lý, thương hiệu'
                    />
                  </div>
                  <Button type='submit' className='h-12 rounded-lg bg-[#0A2463] px-6 text-white hover:bg-[#1E40AF]'>
                    Tìm kiếm
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </form>

              <div className='mt-4 flex flex-wrap items-center gap-2 text-sm text-[#4B5E7A]'>
                <span>Tìm kiếm phổ biến:</span>
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type='button'
                    onClick={() => submitHeroSearch(term)}
                    className='rounded-full bg-white px-3 py-1 font-medium text-[#1E40AF] ring-1 ring-[#E8EDF5] transition hover:ring-[#BFDBFE]'
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className='mt-7 flex flex-col gap-3 sm:flex-row'>
                <Link to='/upload-prescription'>
                  <Button variant='outline' className='h-12 w-full rounded-lg border-[#BFDBFE] bg-white text-[#0A2463] hover:bg-[#F0F6FF] sm:w-auto'>
                    <Upload className='mr-2 h-4 w-4' />
                    Đặt theo đơn thuốc
                  </Button>
                </Link>
                <Button onClick={openConsultation} variant='outline' className='h-12 rounded-lg border-[#BFDBFE] bg-white text-[#0A2463] hover:bg-[#F0F6FF]'>
                  <MessageCircle className='mr-2 h-4 w-4' />
                  Tư vấn dược sĩ ngay
                </Button>
              </div>
            </div>
          </div>

          <div className='relative hidden min-h-[520px] lg:block'>
            <img src={heroImage} alt='Dược sĩ MediSpace tư vấn tại quầy thuốc' className='h-full w-full object-cover' />
            <div className='absolute bottom-8 left-8 max-w-xs rounded-2xl bg-white/95 p-5 shadow-[0_24px_48px_rgba(10,36,99,0.18)] backdrop-blur'>
              <div className='flex items-center gap-2 text-[#0A2463]'>
                <Star className='h-5 w-5 fill-[#F59E0B] text-[#F59E0B]' />
                <span className='font-display text-xl font-bold'>4.8/5</span>
                <span className='text-sm text-[#4B5E7A]'>(125,000 đánh giá)</span>
              </div>
              <p className='mt-2 text-sm leading-6 text-[#4B5E7A]'>Được tin dùng bởi 500,000+ khách hàng cần tư vấn và mua thuốc an toàn.</p>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-[#BFDBFE] bg-[#E8EDF5]' aria-label='Thông tin tin cậy nhà thuốc'>
        <div className='mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-4 py-4 md:grid-cols-5'>
          {[
            { icon: Shield, title: 'GPP Certified', text: 'GCN: GPP-MS-2026-001', mono: true },
            { icon: Users, title: '50+ Dược sĩ', text: 'Kiểm tra 24/7' },
            { icon: CheckCircle2, title: '100% Chính hãng', text: 'Nguồn gốc rõ ràng' },
            { icon: Truck, title: 'Giao 2H', text: 'Nội thành HCM' },
            { icon: Clock, title: 'Đổi trả 30 ngày', text: 'Theo chính sách' },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.title} className={`flex items-start gap-3 px-2 md:px-4 ${index > 0 ? 'md:border-l md:border-[#BFDBFE]' : ''}`}>
                <Icon className='mt-0.5 h-4 w-4 flex-shrink-0 text-[#0A2463]' />
                <div>
                  <div className='text-sm font-bold text-[#1C2B4A]'>{item.title}</div>
                  <div className={`text-xs text-[#4B5E7A] ${item.mono ? 'font-mono' : ''}`}>{item.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <ScrollReveal direction='up' delay={0.1}>
        <section className='bg-white py-8' aria-labelledby='categories-heading'>
          <div className='mx-auto max-w-7xl px-4'>
            <div className='mb-5 flex items-end justify-between gap-4'>
              <div>
                <h2 id='categories-heading' className='font-display text-2xl font-bold text-[#0A2463] md:text-3xl'>Danh mục sản phẩm</h2>
                <p className='mt-1 text-sm text-[#4B5E7A]'>Đi nhanh đến nhóm sản phẩm bạn cần.</p>
              </div>
              <Link to='/categories' className='hidden text-sm font-semibold text-[#1E40AF] hover:text-[#0A2463] sm:inline-flex'>Xem tất cả</Link>
            </div>

            {categoriesLoading ? (
              <div className='flex gap-4 overflow-hidden'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className='h-28 min-w-28 animate-pulse rounded-xl bg-[#F0F6FF]' />
                ))}
              </div>
            ) : categoriesError ? (
              <div className='rounded-xl border border-[#BFDBFE] bg-[#F0F6FF] p-6 text-center'>
                <p className='font-semibold text-[#0A2463]'>Không thể tải danh mục, vui lòng thử lại</p>
                <Button type='button' variant='outline' className='mt-4 border-[#BFDBFE] text-[#0A2463]' onClick={() => refetchCategories()}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Tải lại danh mục
                </Button>
              </div>
            ) : (
              <div className='flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {realCategories.map((category) => {
                  const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || Pill
                  return (
                    <Link key={category._id} to={`/categories/${category.slug}`} className='group min-w-28 text-center' aria-label={`Xem danh mục ${category.name}`}>
                      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#E8EDF5] bg-[#F0F6FF] text-[#0A2463] transition group-hover:border-[#0A2463] group-hover:bg-white'>
                        <Icon className='h-7 w-7' />
                      </div>
                      <div className='mt-2 line-clamp-2 text-sm font-semibold text-[#1C2B4A] group-hover:text-[#0A2463]'>{category.name}</div>
                      <div className='text-xs text-[#8094AE]'>{category.productCount?.toLocaleString() || '---'} sản phẩm</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      <section className='bg-[#F0F6FF] py-12' aria-labelledby='health-needs-heading'>
        <div className='mx-auto max-w-7xl px-4'>
          <div className='mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end'>
            <div>
              <h2 id='health-needs-heading' className='font-display text-3xl font-bold text-[#0A2463]'>Mua theo nhu cầu sức khỏe</h2>
              <p className='mt-2 text-[#4B5E7A]'>Tìm sản phẩm phù hợp với tình trạng của bạn mà không cần nhớ tên thuốc.</p>
            </div>
            <Link to='/products' className='inline-flex items-center text-sm font-semibold text-[#1E40AF] hover:text-[#0A2463]'>Xem tất cả nhu cầu <ArrowRight className='ml-1 h-4 w-4' /></Link>
          </div>

          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {healthNeeds.map((need) => {
              const Icon = need.icon
              return (
                <Link key={need.slug} to={`/products?condition=${need.slug}`} className='group rounded-xl border border-[#E8EDF5] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(10,36,99,0.12)]'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F6FF] text-[#0A2463]'>
                    <Icon className='h-6 w-6' />
                  </div>
                  <div className='mt-4 font-display text-lg font-semibold text-[#1C2B4A] group-hover:text-[#0A2463]'>{need.label}</div>
                  <div className='text-sm text-[#8094AE]'>{need.count} sản phẩm</div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div className='bg-white'>
        <RecommendationCarousel
          title={isAuthenticated ? 'Dành Cho Bạn' : 'Gợi Ý Hôm Nay'}
          subtitle={isAuthenticated ? 'Được cá nhân hoá dựa trên lịch sử của bạn' : 'Những sản phẩm được nhiều khách hàng yêu thích'}
          badge='for-you'
          products={forYouProducts}
          loading={forYouLoading}
          algorithm={forYouAlgorithm}
          viewAllLink='/products'
          itemsPerPage={4}
          layout='centered'
        />
      </div>

      <div className='bg-[#F8FAFB]'>
        <RecommendationCarousel
          title='Sản Phẩm Nổi Bật'
          subtitle='Những sản phẩm được quan tâm và đánh giá cao gần đây'
          badge='trending'
          products={trendingProducts}
          loading={trendingLoading}
          algorithm={trendingAlgorithm}
          viewAllLink='/products'
          itemsPerPage={4}
          layout='centered'
        />
      </div>

      <section className='bg-white py-12' aria-labelledby='pharmacists-heading'>
        <div className='mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[38%_62%] lg:items-center'>
          <div>
            <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#059669]'>
              <Award className='h-4 w-4' />
              Dược sĩ phụ trách chuyên môn
            </div>
            <h2 id='pharmacists-heading' className='font-display text-3xl font-bold leading-tight text-[#0A2463] md:text-4xl'>Mọi đơn hàng được dược sĩ kiểm tra trước khi giao</h2>
            <p className='mt-4 leading-7 text-[#4B5E7A]'>Đội ngũ MediSpace hỗ trợ đọc đơn, kiểm tra tương tác thuốc và tư vấn cách dùng phù hợp cho từng tình huống.</p>
            <Button onClick={openConsultation} className='mt-6 rounded-lg bg-[#0A2463] text-white hover:bg-[#1E40AF]'>
              <MessageCircle className='mr-2 h-4 w-4' />
              Chat với dược sĩ ngay
            </Button>
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            {pharmacists.map((pharmacist) => (
              <div key={pharmacist.name} className='rounded-xl border border-[#E8EDF5] bg-[#F8FAFB] p-5 text-center'>
                <img src={pharmacist.image} alt={pharmacist.name} className='mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white' />
                <div className='mt-4 font-display text-base font-bold text-[#1C2B4A]'>{pharmacist.name}</div>
                <div className='text-sm text-[#1E40AF]'>{pharmacist.role}</div>
                <div className='mt-1 text-sm text-[#8094AE]'>{pharmacist.experience}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-[#F8FAFB] py-12' aria-labelledby='health-corner-heading'>
        <div className='mx-auto max-w-7xl px-4'>
          <div className='mb-7 flex items-end justify-between gap-4'>
            <div>
              <h2 id='health-corner-heading' className='font-display text-3xl font-bold text-[#0A2463]'>Góc Sức Khỏe</h2>
              <p className='mt-2 text-[#4B5E7A]'>Kiến thức y tế được kiểm chứng bởi dược sĩ.</p>
            </div>
            <Link to='/health' className='hidden items-center text-sm font-semibold text-[#1E40AF] hover:text-[#0A2463] sm:inline-flex'>Xem tất cả <ArrowRight className='ml-1 h-4 w-4' /></Link>
          </div>

          <div className='grid gap-5 md:grid-cols-3'>
            {healthArticles.map((article) => (
              <Link key={article.title} to='/health' className='group overflow-hidden rounded-xl border border-[#E8EDF5] bg-white transition hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(10,36,99,0.12)]'>
                <div className='aspect-video overflow-hidden bg-[#F0F6FF]'>
                  <img src={article.image} alt={article.title} className='h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]' loading='lazy' />
                </div>
                <div className='p-5'>
                  <div className='inline-flex items-center gap-1 rounded-full bg-[#F0F6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]'>
                    <BookOpen className='h-3 w-3' />
                    {article.category}
                  </div>
                  <h3 className='mt-3 line-clamp-2 font-display text-lg font-semibold leading-7 text-[#1C2B4A] group-hover:text-[#0A2463]'>{article.title}</h3>
                  <p className='mt-2 line-clamp-2 text-sm leading-6 text-[#4B5E7A]'>{article.excerpt}</p>
                  <div className='mt-4 flex items-center gap-3 text-xs text-[#8094AE]'>
                    <span className='inline-flex items-center gap-1'><CalendarDays className='h-3.5 w-3.5' />{article.date}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-[#0A2463] py-12'>
        <div className='mx-auto max-w-4xl px-4 text-center'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white'>
            <MessageCircle className='h-4 w-4' />
            Tư vấn miễn phí 24/7
          </div>
          <h2 className='font-display text-3xl font-bold text-white md:text-4xl'>Không chắc nên mua gì?</h2>
          <p className='mx-auto mt-3 max-w-2xl text-lg leading-8 text-blue-100'>Hỏi dược sĩ MediSpace để được hướng dẫn chọn sản phẩm, đọc đơn thuốc và dùng thuốc đúng cách.</p>
          <Button onClick={openConsultation} className='mt-7 h-12 rounded-lg bg-white px-8 text-[#0A2463] hover:bg-[#F0F6FF]'>
            Hỏi dược sĩ ngay
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </section>
    </EnhancedPageTransition>
  )
}
