import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, User, Eye, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import articleService from '@/services/articleService'
import type { Article, HealthCategory } from '@/types/article'

export function CategoryArticlesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<HealthCategory | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (slug) {
      loadCategoryData(slug)
    }
  }, [slug, page])

  const loadCategoryData = async (categorySlug: string) => {
    setLoading(true)
    try {
      const [categoryData, articlesData] = await Promise.all([
        articleService.getHealthCategory(categorySlug),
        articleService.getArticles({
          categoryId: categorySlug,
          isPublished: true,
          status: 'published',
          page,
          limit: 12,
          sortBy: 'publishedAt',
          sortOrder: 'desc',
        }),
      ])

      if (categoryData) {
        setCategory(categoryData)
      }
      setArticles(articlesData.articles)
      setTotalPages(articlesData.pagination.totalPages)
    } catch (error) {
      console.error('Error loading category data:', error)
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

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className='container mx-auto px-4 py-16 text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Không tìm thấy danh mục</h1>
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
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-gradient-to-r from-primary/10 to-accent/10 py-8 border-b'>
        <div className='container mx-auto px-4'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Góc sức khỏe', href: '/health' },
              { label: category.name },
            ]}
          />
          <h1 className='text-3xl font-bold text-gray-900 mt-4'>{category.name}</h1>
          <p className='text-gray-600 mt-2'>{category.description}</p>
          <p className='text-sm text-primary font-medium mt-2'>{category.articleCount} bài viết</p>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Back Button */}
        <Link to='/health' className='inline-block mb-6'>
          <Button variant='ghost' className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Quay lại
          </Button>
        </Link>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
              {articles.map((article) => (
                <Link key={article._id} to={`/health/article/${article.slug}`}>
                  <Card className='overflow-hidden hover:shadow-lg transition-shadow h-full'>
                    <div className='aspect-video relative overflow-hidden bg-gray-200'>
                      {article.featuredImage && (
                        <ImageWithFallback
                          src={article.featuredImage}
                          alt={article.title}
                          className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                        />
                      )}
                      {article.isFeatured && <Badge className='absolute top-2 right-2 bg-red-500'>Nổi bật</Badge>}
                    </div>
                    <CardContent className='p-6'>
                      <div className='flex items-center gap-2 text-sm text-gray-500 mb-2'>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          <span>{article.readTime} phút đọc</span>
                        </div>
                        <span>•</span>
                        <div className='flex items-center gap-1'>
                          <Eye className='h-3 w-3' />
                          <span>{article.viewCount}</span>
                        </div>
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2'>{article.title}</h3>
                      <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{article.excerpt}</p>
                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <div className='flex items-center gap-1'>
                          <User className='h-3 w-3' />
                          <span>{article.authorName}</span>
                        </div>
                        <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center gap-2'>
                <Button variant='outline' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Trang trước
                </Button>
                <div className='flex items-center gap-2 px-4'>
                  <span className='text-sm text-gray-600'>
                    Trang {page} / {totalPages}
                  </span>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-16'>
            <p className='text-gray-600'>Chưa có bài viết nào trong danh mục này</p>
          </div>
        )}
      </div>
    </div>
  )
}
