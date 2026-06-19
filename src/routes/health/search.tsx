import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import articleService from '~/services/articleService'
import type { Article } from '~/types/article'
import { Link } from 'react-router-dom'
import { User, Clock, Search } from 'lucide-react'

export default function HealthSearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query) {
      handleSearch()
    }
  }, [query])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const results = await articleService.searchArticles(query)
      setArticles(results)
    } catch (error) {
      console.error('Search error:', error)
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

  return (
    <div className='min-h-screen bg-white'>
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Bệnh & Góc sức khỏe', href: '/health' },
              { label: `Tìm kiếm: ${query}` },
            ]}
          />
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Kết quả tìm kiếm cho "{query}"</h1>
          <p className='text-gray-600 mt-2'>Tìm thấy {articles.length} bài viết</p>
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          </div>
        ) : articles.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {articles.map((article) => (
              <Link key={article._id} to={`/health/article/${article.slug}`}>
                <Card className='overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col'>
                  {article.featuredImage && (
                    <div className='aspect-video relative overflow-hidden bg-gray-200'>
                      <ImageWithFallback
                        src={article.featuredImage}
                        alt={article.title}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                  )}
                  <CardContent className='p-4 flex-1 flex flex-col'>
                    <div className='mb-2'>
                      {article.category && (
                        <Badge variant='outline' className='mr-2'>
                          {article.category.name}
                        </Badge>
                      )}
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2'>{article.title}</h3>
                    <p className='text-sm text-gray-600 mb-4 line-clamp-3'>{article.excerpt}</p>
                    <div className='mt-auto flex items-center justify-between text-xs text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <User className='h-3 w-3' />
                        <span>{article.authorName}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className='text-center py-12 bg-white rounded-lg border border-dashed border-gray-300'>
            <Search className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900'>Không tìm thấy kết quả</h3>
            <p className='text-gray-500'>Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function meta() {
  return [{ title: 'Tìm kiếm bài viết | MEDISPACE' }]
}
