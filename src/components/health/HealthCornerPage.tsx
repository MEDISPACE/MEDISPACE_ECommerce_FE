import { Heart, Brain, Stethoscope, Eye, Bone, Clock, User, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useState, useEffect } from 'react'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { Link } from 'react-router-dom'
import articleService from '@/services/articleService'
import type { Article, HealthCategory } from '@/types/article'

// Icon mapping for categories
const iconMap: Record<string, React.ElementType> = {
  Heart,
  Brain,
  Stethoscope,
  Eye,
  Bone
}

export function HealthCornerPage() {
  const [categories, setCategories] = useState<HealthCategory[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [latestArticles, setLatestArticles] = useState<Article[]>([])
  const [popularArticles, setPopularArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, featured, latest, popular] = await Promise.all([
        articleService.getHealthCategories({ isActive: true }),
        articleService.getFeaturedArticles(3),
        articleService.getLatestArticles(6),
        articleService.getPopularArticles(5)
      ])
      setCategories(cats)
      setFeaturedArticles(featured)
      setLatestArticles(latest)
      setPopularArticles(popular)
    } catch (error) {
      console.error('Error loading health corner data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getIconForCategory = (iconName?: string) => {
    if (!iconName) return Heart
    return iconMap[iconName] || Heart
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-100 to-cyan-50 py-8 border-b border-blue-200">
        <div className="container mx-auto px-4">
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Góc sức khỏe', href: '/health' }
            ]}
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mt-4">
            Góc sức khỏe
          </h1>
          <p className="text-gray-700 mt-2">
            Chia sẻ kiến thức y khoa và sống khỏe mỗi ngày
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Health Categories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-6">
            Danh mục sức khỏe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {categories.map((category) => {
              const IconComponent = getIconForCategory(category.icon)
              return (
                <Link key={category._id} to={`/health/category/${category.slug}`}>
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-blue-100 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${category.color || 'bg-blue-100'} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                      <p className="text-xs text-blue-600 font-medium">{category.articleCount} bài viết</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">
                Bài viết nổi bật
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Link key={article._id} to={`/health/article/${article.slug}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full border-blue-100 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                      {article.featuredImage && (
                        <ImageWithFallback
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {article.isFeatured && (
                        <Badge className="absolute top-2 right-2 bg-red-500">Nổi bật</Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Badge variant="outline" className="border-blue-300 text-blue-600">{article.category?.name}</Badge>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime} phút đọc</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{article.authorName}</span>
                        </div>
                        <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Articles and Quick Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Articles */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-6">
              Bài viết mới nhất
            </h2>
            <div className="space-y-6">
              {latestArticles.map((article) => (
                <Link key={article._id} to={`/health/article/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow border-blue-100 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {article.featuredImage && (
                          <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100">
                            <ImageWithFallback
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                              {article.category?.name}
                            </Badge>
                            <span>•</span>
                            <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{article.authorName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{article.readTime} phút</span>
                            </div>
                            <span>{article.viewCount} lượt xem</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Articles Sidebar */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-6">
              Bài viết phổ biến
            </h2>
            <div className="space-y-4">
              {popularArticles.map((article, index) => (
                <Link key={article._id} to={`/health/article/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow border-blue-100 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{article.viewCount} lượt xem</span>
                            <span>•</span>
                            <span>{article.readTime} phút</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Health Tips */}
            <Card className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Mẹo sức khỏe</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Uống đủ 2-2.5 lít nước mỗi ngày</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Ngủ đủ 7-8 tiếng mỗi đêm</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Tập thể dục 30 phút mỗi ngày</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Ăn nhiều rau xanh, hoa quả</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Giảm stress bằng thiền định</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
