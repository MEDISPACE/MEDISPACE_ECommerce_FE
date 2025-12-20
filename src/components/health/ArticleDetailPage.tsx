import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, User, Eye, Calendar, ArrowLeft, Share2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import articleService from '@/services/articleService'
import type { Article } from '@/types/article'

export function ArticleDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [article, setArticle] = useState<Article | null>(null)
    const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (slug) {
            loadArticle(slug)
        }
    }, [slug])

    const loadArticle = async (articleSlug: string) => {
        setLoading(true)
        try {
            const [articleData, related] = await Promise.all([
                articleService.getArticle(articleSlug),
                articleService.getRelatedArticles(articleSlug, 3)
            ])

            if (articleData) {
                setArticle(articleData)
                setRelatedArticles(related)
                // Increment view count
                articleService.incrementViewCount(articleSlug)
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
            day: 'numeric'
        })
    }

    const handleShare = () => {
        if (navigator.share && article) {
            navigator.share({
                title: article.title,
                text: article.excerpt,
                url: window.location.href
            })
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href)
            alert('Đã sao chép link bài viết!')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải bài viết...</p>
                </div>
            </div>
        )
    }

    if (!article) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài viết</h1>
                <Link to="/health">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại Góc sức khỏe
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <UniversalBreadcrumb
                        items={[
                            { label: 'Trang chủ', href: '/' },
                            { label: 'Góc sức khỏe', href: '/health' },
                            { label: article.category?.name || 'Bài viết', href: `/health/category/${article.category?.slug}` },
                            { label: article.title }
                        ]}
                    />
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link to="/health" className="inline-block mb-6">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                    </Link>

                    {/* Article Header */}
                    <article className="bg-white rounded-lg shadow-sm p-8 mb-8">
                        {/* Category and Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {article.category && (
                                <Link to={`/health/category/${article.category.slug}`}>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
                                        {article.category.name}
                                    </Badge>
                                </Link>
                            )}
                            {article.tags?.map((tag: string) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                            {article.isFeatured && <Badge className="bg-red-500">Nổi bật</Badge>}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        <p className="text-lg text-gray-600 mb-6">{article.excerpt}</p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{article.authorName}</span>
                                {article.authorTitle && <span className="text-xs">({article.authorTitle})</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{article.readTime} phút đọc</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>{article.viewCount} lượt xem</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto gap-2"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4" />
                                Chia sẻ
                            </Button>
                        </div>

                        {/* Featured Image */}
                        {article.featuredImage && (
                            <div className="my-8 rounded-lg overflow-hidden">
                                <ImageWithFallback
                                    src={article.featuredImage}
                                    alt={article.title}
                                    className="w-full h-auto"
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        <div
                            className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-2"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Tags Footer */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Từ khóa:
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Bài viết liên quan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedArticles.map((related) => (
                                    <Link key={related._id} to={`/health/article/${related.slug}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                                            {related.featuredImage && (
                                                <div className="aspect-video relative overflow-hidden bg-gray-200">
                                                    <ImageWithFallback
                                                        src={related.featuredImage}
                                                        alt={related.title}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                            <CardContent className="p-4">
                                                <Badge variant="outline" className="mb-2">
                                                    {related.category?.name}
                                                </Badge>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {related.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{related.readTime} phút</span>
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
