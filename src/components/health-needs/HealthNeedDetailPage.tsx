import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, Bone, Droplets, HeartPulse, Leaf, MessageCircle, Search, Shield, ShoppingBag, Thermometer, User } from 'lucide-react'
import { getHealthNeedBySlug, healthNeeds } from '../../data/healthNeeds'
import { searchService } from '../../services/searchService'
import articleService from '../../services/articleService'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import { ProductCard } from '../products/ProductCard'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import type { Product, PriceVariant } from '../../types/product'
import {
  getBrandName,
  getDiscountPercentage,
  getProductId,
  getProductImage,
  getProductOriginalPrice,
  getProductRating,
  getProductReviewCount,
  getProductSalePrice,
  getProductUnit,
  isProductInStock,
  isProductOnSale,
  isProductPrescription,
} from '../../utils/productHelpers'

const iconMap = {
  activity: Activity,
  bone: Bone,
  droplets: Droplets,
  heartPulse: HeartPulse,
  leaf: Leaf,
  shield: Shield,
  thermometer: Thermometer,
  user: User,
}

const fallbackImage = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80'

const mapSearchHitToProduct = (hit: { document: Record<string, unknown> }): Product => {
  const doc = hit.document
  let priceVariants: PriceVariant[] = []
  if (typeof doc.priceVariantsJson === 'string') {
    try {
      priceVariants = JSON.parse(doc.priceVariantsJson) as PriceVariant[]
    } catch {
      priceVariants = []
    }
  }

  return {
    ...doc,
    id: doc.mongoId,
    _id: doc.mongoId,
    brand: doc.brandName || 'MediSpace',
    category: { name: doc.categoryName || '' },
    priceVariants,
    image: doc.featuredImage,
    isPrescription: doc.requiresPrescription,
  } as unknown as Product
}

export function HealthNeedDetailPage() {
  const { slug } = useParams()
  const need = getHealthNeedBySlug(slug)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const relatedNeeds = useMemo(() => healthNeeds.filter((item) => item.slug !== slug).slice(0, 4), [slug])

  const productsQuery = useQuery({
    queryKey: ['health-need-products', need?.slug],
    enabled: Boolean(need),
    queryFn: async () => {
      const result = await searchService.searchProducts({ q: need?.searchQuery || '*', limit: 8, sortBy: 'relevance' })
      return (result.hits || []).map(mapSearchHitToProduct)
    },
    staleTime: 5 * 60 * 1000,
  })

  const articlesQuery = useQuery({
    queryKey: ['health-need-articles', need?.slug],
    enabled: Boolean(need),
    queryFn: () => articleService.searchArticles(need?.keywords.join(' ') || '', 3),
    staleTime: 5 * 60 * 1000,
  })

  if (!need) {
    return (
      <main className='mx-auto max-w-4xl px-4 py-12'>
        <UniversalBreadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Nhu cầu sức khỏe', href: '/health-needs' },
            { label: 'Không tìm thấy' },
          ]}
        />
        <Card className='mt-8 border-[#E8EDF5]'>
          <CardContent className='p-8 text-center'>
            <h1 className='font-display text-2xl font-bold text-[#0A2463]'>Không tìm thấy nhu cầu sức khỏe</h1>
            <p className='mt-3 text-[#4B5E7A]'>Chủ đề này chưa có trong danh sách gợi ý của MediSpace.</p>
            <Button asChild className='mt-6 bg-[#0A2463] text-white hover:bg-[#1E40AF]'>
              <Link to='/health-needs'>Xem tất cả nhu cầu</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const Icon = iconMap[need.icon]
  const products = productsQuery.data || []
  const articles = articlesQuery.data || []

  return (
    <div className='min-h-screen bg-[#F8FAFB]'>
      <div className='border-b border-[#E8EDF5] bg-white'>
        <div className='mx-auto max-w-7xl px-4 py-5'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Nhu cầu sức khỏe', href: '/health-needs' },
              { label: need.label },
            ]}
          />
        </div>
      </div>

      <main className='mx-auto max-w-7xl px-4 py-8'>
        <Button asChild variant='ghost' className='mb-6 text-[#0A2463] hover:bg-[#F0F6FF]'>
          <Link to='/health-needs'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Tất cả nhu cầu
          </Link>
        </Button>

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='rounded-2xl border border-[#E8EDF5] bg-white p-6 md:p-8'>
            <div className='flex flex-col gap-5 md:flex-row md:items-start'>
              <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F0F6FF] text-[#0A2463]'>
                <Icon className='h-8 w-8' />
              </div>
              <div>
                <Badge className='mb-3 bg-[#E0F2FE] text-[#0A2463] hover:bg-[#E0F2FE]'>Nhu cầu sức khỏe</Badge>
                <h1 className='font-display text-4xl font-bold text-[#0A2463] md:text-5xl'>{need.label}</h1>
                <p className='mt-4 text-lg leading-8 text-[#4B5E7A]'>{need.description}</p>
                <div className='mt-5 flex flex-wrap gap-2'>
                  {need.keywords.map((keyword) => (
                    <Link key={keyword} to={`/search?q=${encodeURIComponent(keyword)}`} className='rounded-full bg-[#F8FAFB] px-3 py-1 text-sm font-medium text-[#4B5E7A] hover:bg-[#F0F6FF] hover:text-[#0A2463]'>
                      {keyword}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Card className='border-amber-200 bg-amber-50'>
            <CardContent className='p-6'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='mt-1 h-5 w-5 shrink-0 text-amber-700' />
                <div>
                  <h2 className='font-semibold text-amber-950'>Cần lưu ý trước khi mua</h2>
                  <p className='mt-2 text-sm leading-6 text-amber-900'>{need.caution}</p>
                </div>
              </div>
              <ul className='mt-4 space-y-2 text-sm text-amber-950'>
                {need.whenToAsk.map((item) => (
                  <li key={item} className='flex gap-2'>
                    <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className='mt-5 w-full bg-[#0A2463] text-white hover:bg-[#1E40AF]'>
                <Link to='/community'>
                  <MessageCircle className='mr-2 h-4 w-4' />
                  Hỏi dược sĩ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className='mt-8 rounded-2xl border border-[#E8EDF5] bg-white p-6'>
          <div className='mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end'>
            <div>
              <h2 className='font-display text-2xl font-bold text-[#0A2463]'>Nhóm sản phẩm nên xem</h2>
              <p className='mt-2 text-sm text-[#4B5E7A]'>Chọn nhóm phù hợp với triệu chứng hoặc mục tiêu chăm sóc của bạn.</p>
            </div>
            <Button asChild variant='outline' className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'>
              <Link to={`/search?q=${encodeURIComponent(need.searchQuery)}`}>
                <Search className='mr-2 h-4 w-4' />
                Tìm tất cả
              </Link>
            </Button>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {need.productGroups.map((group) => (
              <Link key={group.title} to={`/search?q=${encodeURIComponent(group.query)}`} className='group rounded-xl border border-[#E8EDF5] p-4 transition hover:border-[#BFDBFE] hover:bg-[#F8FAFB]'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F6FF] text-[#0A2463]'>
                    <ShoppingBag className='h-5 w-5' />
                  </div>
                  <ArrowRight className='h-4 w-4 text-[#8094AE] transition group-hover:translate-x-1 group-hover:text-[#0A2463]' />
                </div>
                <h3 className='mt-4 font-semibold text-[#1C2B4A] group-hover:text-[#0A2463]'>{group.title}</h3>
                <p className='mt-2 text-sm leading-6 text-[#4B5E7A]'>{group.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className='mt-8'>
          <div className='mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end'>
            <div>
              <h2 className='font-display text-2xl font-bold text-[#0A2463]'>Sản phẩm gợi ý</h2>
              <p className='mt-2 text-sm text-[#4B5E7A]'>Kết quả lấy từ search theo keyword của nhu cầu này và ưu tiên sản phẩm không kê đơn khi hệ thống hỗ trợ.</p>
            </div>
          </div>

          {productsQuery.isLoading ? (
            <div className='rounded-xl border border-[#E8EDF5] bg-white p-8 text-center text-[#4B5E7A]'>Đang tìm sản phẩm phù hợp...</div>
          ) : products.length > 0 ? (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
              {products.map((product) => (
                <ProductCard
                  key={getProductId(product)}
                  product={{
                    id: getProductId(product),
                    name: product.name,
                    slug: product.slug,
                    brand: getBrandName(product),
                    image: getProductImage(product),
                    originalPrice: getProductOriginalPrice(product),
                    salePrice: getProductSalePrice(product) || 0,
                    discountPercentage: getDiscountPercentage(product),
                    rating: getProductRating(product),
                    reviewCount: getProductReviewCount(product),
                    inStock: isProductInStock(product),
                    status: product.status,
                    isPrescription: isProductPrescription(product),
                    isOnSale: isProductOnSale(product),
                    unit: getProductUnit(product),
                    priceVariants: product.priceVariants,
                  }}
                  onAddToCart={(selectedUnit) => {
                    const variant = product.priceVariants?.find((item) => item.unit === selectedUnit)
                    const price = variant?.price || product.priceVariants?.[0]?.price
                    addToCart(product, 1, selectedUnit, price)
                  }}
                  onToggleWishlist={() => toggleWishlist(getProductId(product))}
                  isInWishlist={isInWishlist(getProductId(product))}
                />
              ))}
            </div>
          ) : (
            <div className='rounded-xl border border-[#E8EDF5] bg-white p-8 text-center'>
              <h3 className='font-semibold text-[#1C2B4A]'>Chưa có sản phẩm đủ khớp</h3>
              <p className='mt-2 text-sm text-[#4B5E7A]'>Bạn có thể thử tìm theo nhóm sản phẩm cụ thể hoặc hỏi dược sĩ để được hướng dẫn.</p>
            </div>
          )}
        </section>

        <section className='mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <Card className='border-[#E8EDF5] bg-white'>
            <CardContent className='p-6'>
              <h2 className='font-display text-2xl font-bold text-[#0A2463]'>Bài viết liên quan</h2>
              <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-3'>
                {articlesQuery.isLoading ? (
                  <p className='text-sm text-[#4B5E7A]'>Đang tìm bài viết...</p>
                ) : articles.length > 0 ? (
                  articles.map((article) => (
                    <Link key={article._id} to={`/health/article/${article.slug}`} className='group overflow-hidden rounded-xl border border-[#E8EDF5] bg-white transition hover:border-[#BFDBFE] hover:shadow-sm'>
                      <div className='aspect-video bg-[#F0F6FF]'>
                        <img src={article.featuredImage || fallbackImage} alt={article.title} className='h-full w-full object-cover' />
                      </div>
                      <div className='p-4'>
                        <h3 className='line-clamp-2 font-semibold text-[#1C2B4A] group-hover:text-[#0A2463]'>{article.title}</h3>
                        <p className='mt-2 line-clamp-2 text-sm text-[#4B5E7A]'>{article.excerpt}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className='text-sm text-[#4B5E7A]'>Chưa tìm thấy bài viết phù hợp.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-[#E8EDF5] bg-white'>
            <CardContent className='p-6'>
              <h2 className='font-display text-xl font-bold text-[#0A2463]'>Nhu cầu khác</h2>
              <div className='mt-4 space-y-3'>
                {relatedNeeds.map((item) => (
                  <Link key={item.slug} to={`/health-needs/${item.slug}`} className='flex items-center justify-between rounded-lg border border-[#E8EDF5] p-3 text-sm font-semibold text-[#1C2B4A] hover:border-[#BFDBFE] hover:bg-[#F8FAFB] hover:text-[#0A2463]'>
                    {item.label}
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
