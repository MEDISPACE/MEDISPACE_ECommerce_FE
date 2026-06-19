import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock,
  User,
  Eye,
  Calendar,
  ArrowLeft,
  Share2,
  MessageCircle,
  FileText,
  ShoppingBag,
  ShieldCheck,
  BookOpen,
	  Bot,
	  Send,
	  AlertTriangle,
	  Loader2,
	  Bookmark,
	  Bell,
	} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import articleService from '@/services/articleService'
import type { Article } from '@/types/article'
import type { Product } from '@/types/product'
import { useAuth } from '~/contexts/AuthContext'

export function ArticleDetailPage() {
	  const { slug } = useParams<{ slug: string }>()
	  const { isAuthenticated } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
	  const [aiEscalated, setAiEscalated] = useState(false)
	  const [aiLoading, setAiLoading] = useState(false)
	  const [isSaved, setIsSaved] = useState(false)
	  const [isFollowingTopic, setIsFollowingTopic] = useState(false)
	  const [loading, setLoading] = useState(true)
	  const viewCountedRef = useRef<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadArticle(slug)
    }
  }, [slug])

  // Separate effect for incrementing view count to avoid double counting
	  useEffect(() => {
	    if (article && slug && viewCountedRef.current !== slug) {
      viewCountedRef.current = slug
      articleService.incrementViewCount(slug)
	    }
	  }, [article, slug])

	  useEffect(() => {
	    if (!article) return
	    const syncPreferences = async () => {
	      const topic = article.category?.slug || article.categoryId
	      if (isAuthenticated) {
	        const preferences = await articleService.getArticlePreferences()
	        if (preferences) {
	          setIsSaved(preferences.savedArticleIds.some((id) => id.toString() === article._id.toString()))
	          setIsFollowingTopic(Boolean(topic && preferences.followedHealthTopics.includes(topic)))
	          return
	        }
	      }
	      const savedArticles = JSON.parse(localStorage.getItem('medispace_saved_articles') || '[]') as string[]
	      const followedTopics = JSON.parse(localStorage.getItem('medispace_followed_health_topics') || '[]') as string[]
	      setIsSaved(savedArticles.includes(article._id))
	      setIsFollowingTopic(Boolean(topic && followedTopics.includes(topic)))
	    }
	    syncPreferences()
	  }, [article, isAuthenticated])

  const loadArticle = async (articleSlug: string) => {
    setLoading(true)
    try {
      const [articleData, related, products] = await Promise.all([
        articleService.getArticle(articleSlug),
        articleService.getRelatedArticles(articleSlug, 3),
        articleService.getRelatedProducts(articleSlug, 4),
      ])

      if (articleData) {
        setArticle(articleData)
        setRelatedArticles(related)
        setRelatedProducts(products)
        // View count increment moved to separate useEffect
      }
    } catch (error) {
      console.error('Error loading article:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getReadTime = (item: Article) => item.readTime || Math.max(1, Math.ceil(item.content.split(/\s+/).length / 200))

  const getProductPrice = (product: Product) => {
    const variant = product.priceVariants?.find((item) => item.isDefault) || product.priceVariants?.[0]
    return variant?.salePrice || variant?.price || product.salePrice || product.price || 0
  }

  const getProductUnit = (product: Product) => {
    const variant = product.priceVariants?.find((item) => item.isDefault) || product.priceVariants?.[0]
    return variant?.unit || product.unit || 'Sản phẩm'
  }

  const getProductBrand = (product: Product) => product.brand?.name || 'Medispace'

  const handleShare = async () => {
    if (!article) return

    articleService.trackJourneyEvent(article.slug, {
      eventType: 'article_share',
      targetType: 'article',
      targetId: article._id,
    })

    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      })
      return
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép link bài viết!')
    }
  }

	  const trackArticleCta = (
	    eventType: 'cta_chat' | 'cta_prescription_upload' | 'cta_product_search' | 'article_save' | 'topic_follow',
	    targetType: 'chat' | 'prescription' | 'search' | 'article',
	    targetUrl: string,
	  ) => {
    if (!article) return
    articleService.trackJourneyEvent(article.slug, {
      eventType,
      targetType,
      targetUrl,
      metadata: {
        category: article.category?.name,
        tags: article.tags,
      },
	    })
	  }

	  const toggleSavedArticle = async () => {
	    if (!article) return
	    const nextSaved = !isSaved
	    if (isAuthenticated) {
	      const saved = await articleService.setSavedArticle(article.slug, nextSaved)
	      setIsSaved(saved)
	    } else {
	      const key = 'medispace_saved_articles'
	      const savedArticles = JSON.parse(localStorage.getItem(key) || '[]') as string[]
	      const next = nextSaved ? [...savedArticles, article._id] : savedArticles.filter((id) => id !== article._id)
	      localStorage.setItem(key, JSON.stringify(Array.from(new Set(next))))
	      setIsSaved(nextSaved)
	    }
	    articleService.trackJourneyEvent(article.slug, {
	      eventType: 'article_save',
	      targetType: 'article',
	      targetId: article._id,
	      metadata: { saved: nextSaved, persisted: isAuthenticated },
	    })
	  }

	  const toggleFollowTopic = async () => {
	    if (!article) return
	    const topic = article.category?.slug || article.categoryId
	    if (!topic) return
	    const nextFollowing = !isFollowingTopic
	    if (isAuthenticated) {
	      const following = await articleService.setFollowedHealthTopic(topic, nextFollowing)
	      setIsFollowingTopic(following)
	    } else {
	      const key = 'medispace_followed_health_topics'
	      const followedTopics = JSON.parse(localStorage.getItem(key) || '[]') as string[]
	      const next = nextFollowing ? [...followedTopics, topic] : followedTopics.filter((id) => id !== topic)
	      localStorage.setItem(key, JSON.stringify(Array.from(new Set(next))))
	      setIsFollowingTopic(nextFollowing)
	    }
	    articleService.trackJourneyEvent(article.slug, {
	      eventType: 'topic_follow',
	      targetType: 'article',
	      targetId: article._id,
	      metadata: { topic, following: nextFollowing, persisted: isAuthenticated },
	    })
	  }

  const askArticleAssistant = async (question?: string) => {
    if (!article || aiLoading) return
    const finalQuestion = (question || aiQuestion).trim()
    if (!finalQuestion) return

    setAiLoading(true)
    setAiQuestion(finalQuestion)
    try {
      const result = await articleService.askArticleAssistant(article.slug, finalQuestion)
      if (result) {
        setAiAnswer(result.answer)
        setAiSuggestions(result.suggested_questions || [])
        setAiEscalated(result.is_escalated)
        articleService.trackJourneyEvent(article.slug, {
          eventType: 'article_ai_ask',
          targetType: 'ai',
          metadata: {
            question: finalQuestion,
            escalated: result.is_escalated,
          },
        })
      }
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải bài viết...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-16 text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Không tìm thấy bài viết</h1>
        <Link to='/health'>
          <Button variant='outline' className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Quay lại Góc sức khỏe
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Bệnh & Góc sức khỏe', href: '/health' },
              { label: article.category?.name || 'Bài viết', href: `/health/category/${article.category?.slug}` },
              { label: article.title },
            ]}
          />
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Back Button */}
          <Link to='/health' className='inline-block mb-6'>
            <Button variant='ghost' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Quay lại
            </Button>
          </Link>

          {/* Article Header */}
          <article className='bg-white rounded-lg shadow-sm p-8 mb-8'>
            {/* Category and Tags */}
            <div className='flex flex-wrap items-center gap-2 mb-4'>
              {article.category && (
                <Link to={`/health/category/${article.category.slug}`}>
                  <Badge variant='outline' className='cursor-pointer hover:bg-primary hover:text-white'>
                    {article.category.name}
                  </Badge>
                </Link>
              )}
              {article.tags?.map((tag: string) => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
              {article.isFeatured && <Badge className='bg-red-500 text-white hover:bg-red-600'>Nổi bật</Badge>}
            </div>

            {/* Title */}
            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>{article.title}</h1>

            {/* Excerpt */}
            <p className='text-lg text-gray-600 mb-6'>{article.excerpt}</p>

            {/* Meta Info */}
            <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b'>
              <div className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                <span className='font-medium'>{article.authorName}</span>
                {article.authorTitle && <span className='text-xs'>({article.authorTitle})</span>}
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                <span>{getReadTime(article)} phút đọc</span>
              </div>
              <div className='flex items-center gap-2'>
                <Eye className='h-4 w-4' />
                <span>{article.viewCount} lượt xem</span>
              </div>
	              <Button variant='outline' size='sm' className='ml-auto gap-2' onClick={handleShare}>
	                <Share2 className='h-4 w-4' />
	                Chia sẻ
	              </Button>
	            </div>

	            <div className='mt-4 flex flex-wrap gap-3'>
	              <Button type='button' variant='outline' size='sm' className='gap-2' onClick={toggleSavedArticle}>
	                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#1E40AF] text-[#1E40AF]' : ''}`} />
	                {isSaved ? 'Đã lưu' : 'Lưu bài'}
	              </Button>
	              <Button type='button' variant='outline' size='sm' className='gap-2' onClick={toggleFollowTopic}>
	                <Bell className={`h-4 w-4 ${isFollowingTopic ? 'fill-[#1E40AF] text-[#1E40AF]' : ''}`} />
	                {isFollowingTopic ? 'Đang theo dõi chủ đề' : 'Theo dõi chủ đề'}
	              </Button>
	            </div>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className='my-8 rounded-lg overflow-hidden'>
                <ImageWithFallback src={article.featuredImage} alt={article.title} className='w-full h-auto' />
              </div>
            )}

            {(article.reviewedBy || article.lastMedicallyReviewedAt || article.references?.length) && (
              <div className='mb-8 rounded-lg border border-emerald-100 bg-emerald-50/70 p-5'>
                <div className='flex items-start gap-3'>
                  <div className='mt-1 rounded-full bg-emerald-100 p-2 text-emerald-700'>
                    <ShieldCheck className='h-5 w-5' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-lg font-semibold text-emerald-950'>Thông tin kiểm duyệt y khoa</h2>
                    {article.reviewedBy && (
                      <p className='text-sm text-emerald-900'>
                        Được kiểm duyệt bởi <span className='font-semibold'>{article.reviewedBy}</span>
                        {article.reviewedByTitle ? `, ${article.reviewedByTitle}` : ''}.
                      </p>
                    )}
                    <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-emerald-800'>
                      {article.reviewedAt && <span>Ngày kiểm duyệt: {formatDate(article.reviewedAt)}</span>}
                      {article.lastMedicallyReviewedAt && (
                        <span>Cập nhật chuyên môn: {formatDate(article.lastMedicallyReviewedAt)}</span>
                      )}
                      {article.references?.length ? <span>{article.references.length} nguồn tham khảo</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div
              className='prose prose-lg max-w-none overflow-hidden prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-2'
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className='mt-8 rounded-lg border border-[#E8EDF5] bg-[#F0F6FF]/80 p-5'>
              <div className='flex items-start gap-3 mb-4'>
                <div className='mt-1 rounded-full bg-[#E8EDF5] p-2 text-[#1E40AF]'>
                  <Bot className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-[#0A2463]'>Trợ lý AI theo bài viết</h2>
                  <p className='text-sm text-[#0A2463] mt-1'>
                    Hỏi nhanh về nội dung bài này. Câu trả lời AI chỉ để tham khảo và nên được dược sĩ xác nhận khi dùng thuốc.
                  </p>
                </div>
              </div>

	              <div className='flex flex-wrap gap-2 mb-4'>
	                {[
	                  'Tóm tắt ngắn bài này trong 3 ý',
	                  'Giải thích bài này thật dễ hiểu',
	                  'Tóm tắt chuyên sâu kèm điểm cần thận trọng',
	                  'Tôi nên lưu ý điều gì?',
	                  'Khi nào cần hỏi dược sĩ?',
	                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    type='button'
                    variant='outline'
                    size='sm'
                    className='border-[#BFDBFE] text-[#0A2463] hover:bg-white'
                    onClick={() => askArticleAssistant(suggestion)}
                    disabled={aiLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>

              <form
                className='flex flex-col sm:flex-row gap-3'
                onSubmit={(event) => {
                  event.preventDefault()
                  askArticleAssistant()
                }}
              >
                <input
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder='Nhập câu hỏi về bài viết'
                  className='h-11 flex-1 rounded-md border border-[#BFDBFE] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0A2463]'
                />
                <Button type='submit' className='h-11 bg-[#0A2463] hover:bg-[#071A49] text-white' disabled={aiLoading}>
                  {aiLoading ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Send className='h-4 w-4 mr-2' />}
                  Hỏi AI
                </Button>
              </form>

              {aiAnswer && (
                <div className='mt-4 rounded-lg bg-white border border-[#E8EDF5] p-4'>
                  {aiEscalated && (
                    <div className='mb-3 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800'>
                      <AlertTriangle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                      <span>Nội dung này có dấu hiệu cần dược sĩ hoặc bác sĩ tư vấn trực tiếp.</span>
                    </div>
                  )}
                  <p className='text-sm leading-6 text-gray-800 whitespace-pre-line'>{aiAnswer}</p>
                  {aiSuggestions.length > 0 && (
                    <div className='mt-4 flex flex-wrap gap-2'>
                      {aiSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-[#0A2463] hover:bg-[#F0F6FF]'
                          onClick={() => askArticleAssistant(suggestion)}
                          disabled={aiLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='mt-8 rounded-lg border border-[#E8EDF5] bg-[#F0F6FF]/70 p-5'>
              <div className='mb-4'>
                <h2 className='text-lg font-semibold text-blue-950'>Cần hỗ trợ sau khi đọc?</h2>
                <p className='text-sm text-blue-800 mt-1'>
                  Dược sĩ Medispace có thể giúp bạn kiểm tra thông tin thuốc, đơn thuốc và sản phẩm phù hợp.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Button asChild className='bg-[#0A2463] hover:bg-[#071A49] text-white'>
                  <Link
                    to='/community'
                    onClick={() => trackArticleCta('cta_chat', 'chat', '/community')}
                  >
                    <MessageCircle className='h-4 w-4 mr-2' />
                    Hỏi dược sĩ
                  </Link>
                </Button>
                <Button asChild variant='outline' className='border-[#BFDBFE] text-[#0A2463] hover:bg-white'>
                  <Link
                    to='/upload-prescription'
                    onClick={() => trackArticleCta('cta_prescription_upload', 'prescription', '/upload-prescription')}
                  >
                    <FileText className='h-4 w-4 mr-2' />
                    Gửi đơn thuốc
                  </Link>
                </Button>
                <Button asChild variant='outline' className='border-[#BFDBFE] text-[#0A2463] hover:bg-white'>
                  <Link
                    to={`/search?q=${encodeURIComponent(article.tags?.[0] || article.category?.name || article.title)}`}
                    onClick={() => trackArticleCta('cta_product_search', 'search', '/search')}
                  >
                    <ShoppingBag className='h-4 w-4 mr-2' />
                    Tìm sản phẩm liên quan
                  </Link>
                </Button>
              </div>
            </div>

            {/* Tags Footer */}
            {article.tags && article.tags.length > 0 && (
              <div className='mt-8 pt-6 border-t'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>Từ khóa:</h3>
                <div className='flex flex-wrap gap-2'>
                  {article.tags.map((tag: string) => (
                    <Badge key={tag} variant='secondary'>
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {article.references && article.references.length > 0 && (
              <div className='mt-8 pt-6 border-t'>
                <div className='flex items-center gap-2 mb-3'>
                  <BookOpen className='h-4 w-4 text-[#1E40AF]' />
                  <h3 className='text-sm font-semibold text-gray-700'>Nguồn tham khảo:</h3>
                </div>
                <ol className='list-decimal pl-5 space-y-2 text-sm text-gray-600'>
                  {article.references.map((reference, index) => (
                    <li key={`${reference.title}-${index}`}>
                      {reference.url ? (
                        <a
                          href={reference.url}
                          target='_blank'
                          rel='noreferrer'
                          onClick={() =>
                            articleService.trackJourneyEvent(article.slug, {
                              eventType: 'source_click',
                              targetType: 'source',
                              targetUrl: reference.url,
                              metadata: { title: reference.title },
                            })
                          }
                          className='text-[#1E40AF] hover:text-[#0A2463] hover:underline'
                        >
                          {reference.title}
                        </a>
                      ) : (
                        reference.title
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </article>

          {relatedProducts.length > 0 && (
            <section className='mb-12'>
              <div className='flex items-center justify-between gap-4 mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>Sản phẩm liên quan</h2>
                  <p className='text-sm text-gray-600 mt-1'>Gợi ý dựa trên chủ đề bài viết và dữ liệu sản phẩm hiện có.</p>
                </div>
                <Button asChild variant='outline' className='hidden sm:inline-flex'>
                  <Link
                    to={`/search?q=${encodeURIComponent(article.tags?.[0] || article.category?.name || article.title)}`}
                    onClick={() => trackArticleCta('cta_product_search', 'search', '/search')}
                  >
                    Xem thêm
                  </Link>
                </Button>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {relatedProducts.map((product) => {
                  const price = getProductPrice(product)
                  return (
                    <Card key={product._id} className='overflow-hidden hover:shadow-lg transition-shadow h-full bg-white'>
                      <CardContent className='p-4 flex flex-col h-full'>
                        <Link
                          to={`/products/${product.slug}`}
                          className='block'
                          onClick={() =>
                            articleService.trackJourneyEvent(article.slug, {
                              eventType: 'related_product_click',
                              targetType: 'product',
                              targetId: product._id,
                              targetUrl: `/products/${product.slug}`,
                              metadata: { productName: product.name, requiresPrescription: product.requiresPrescription },
                            })
                          }
                        >
                          <div className='aspect-square rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4'>
                            <ImageWithFallback
                              src={product.featuredImage || product.image || '/placeholder-product.jpg'}
                              alt={product.name}
                              className='w-full h-full object-contain'
                            />
                          </div>
                          <div className='flex items-center gap-2 mb-2'>
                            {product.requiresPrescription && (
                              <Badge variant='outline' className='text-orange-600 border-orange-200 bg-orange-50'>
                                Kê đơn
                              </Badge>
                            )}
                            {!product.requiresPrescription && (
                              <Badge variant='outline' className='text-emerald-600 border-emerald-200 bg-emerald-50'>
                                OTC
                              </Badge>
                            )}
                          </div>
                          <h3 className='font-semibold text-gray-900 line-clamp-2 min-h-12'>{product.name}</h3>
                          <p className='text-xs text-gray-500 mt-1 line-clamp-1'>{getProductBrand(product)}</p>
                        </Link>
                        <div className='mt-auto pt-4'>
                          {product.requiresPrescription ? (
                            <p className='text-sm text-gray-500 mb-3'>Cần dược sĩ tư vấn trước khi mua</p>
                          ) : (
                            <p className='font-semibold text-[#1E40AF] mb-3'>
                              {price.toLocaleString('vi-VN')}đ / {getProductUnit(product)}
                            </p>
                          )}
                          <Button asChild className='w-full bg-[#0A2463] hover:bg-[#071A49] text-white'>
                            <Link
                              to={`/products/${product.slug}`}
                              onClick={() =>
                                articleService.trackJourneyEvent(article.slug, {
                                  eventType: 'related_product_click',
                                  targetType: 'product',
                                  targetId: product._id,
                                  targetUrl: `/products/${product.slug}`,
                                  metadata: {
                                    productName: product.name,
                                    requiresPrescription: product.requiresPrescription,
                                    source: 'product_cta',
                                  },
                                })
                              }
                            >
                              Xem chi tiết
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className='mb-12'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>Bài viết liên quan</h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {relatedArticles.map((related) => (
                  <Link key={related._id} to={`/health/article/${related.slug}`}>
                    <Card className='overflow-hidden hover:shadow-lg transition-shadow h-full'>
                      {related.featuredImage && (
                        <div className='aspect-video relative overflow-hidden bg-gray-200'>
                          <ImageWithFallback
                            src={related.featuredImage}
                            alt={related.title}
                            className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                          />
                        </div>
                      )}
                      <CardContent className='p-4'>
                        <Badge variant='outline' className='mb-2'>
                          {related.category?.name}
                        </Badge>
                        <h3 className='text-sm font-semibold text-gray-900 mb-2 line-clamp-2'>{related.title}</h3>
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                          <Clock className='h-3 w-3' />
                          <span>{getReadTime(related)} phút</span>
                          <span>•</span>
                          <span>{related.viewCount} lượt xem</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
