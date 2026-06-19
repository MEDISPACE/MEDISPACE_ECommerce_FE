import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, CheckCircle, FileText, Clock, Star, BarChart3, Bot, MessageCircle, ShoppingBag, Bookmark, Bell, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import apiClient from '~/services/apiClient'
import type { Article, HealthCategory } from '@/types/article'
import { useAuth } from '~/contexts/AuthContext'
import { UserRole } from '~/types/user'

interface AdminArticlesListProps {
  basePath?: string
}

interface ArticleInsights {
  period: { days: number; since: string }
  overview: {
    totalArticles: number
    published: number
    pending: number
    draft: number
    archived: number
    totalEvents: number
    savedArticles: number
    followedTopics: number
  }
  riskLevels: Record<string, number>
  funnel: Record<string, { count: number; uniqueSessions: number }>
  topEngagedArticles: Array<{
    articleId: string
    title?: string
    slug?: string
    riskLevel?: string
    viewCount?: number
    totalEvents: number
    aiAsks: number
    ctaEvents: number
  }>
  categoryPerformance: Array<{
    categoryId: string
    categoryName: string
    totalEvents: number
    aiAsks: number
    ctaEvents: number
  }>
  editorialWarnings: Array<{
    _id: string
    title: string
    slug: string
    riskLevel?: string
    reviewedBy?: string
    referencesCount?: number
    lastMedicallyReviewedAt?: string
    viewCount?: number
  }>
}

export function AdminArticlesList({ basePath = '/admin/articles' }: AdminArticlesListProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.Admin

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<HealthCategory[]>([])
  const [insights, setInsights] = useState<ArticleInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsDays, setInsightsDays] = useState('30')
  const [filter, setFilter] = useState({
    status: 'all',
    categoryId: 'all',
  })

  useEffect(() => {
    loadData()
  }, [filter])

  useEffect(() => {
    if (isAdmin) {
      loadInsights()
    }
  }, [isAdmin, insightsDays])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filter.status !== 'all') params.status = filter.status
      if (filter.categoryId !== 'all') params.categoryId = filter.categoryId

      const [articlesRes, categoriesRes] = await Promise.all([
        apiClient.get('/articles', { params }),
        apiClient.get('/health-categories'),
      ])

      setArticles((articlesRes.data as any).result.articles || [])
      setCategories((categoriesRes.data as any).result.categories || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInsights = async () => {
    setInsightsLoading(true)
    try {
      const response = await apiClient.get('/articles/admin/insights', {
        params: { days: insightsDays },
      })
      setInsights((response.data as any).result || null)
    } catch (error) {
      console.error('Error loading article insights:', error)
      toast.error('Không thể tải insights bài viết')
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return

    try {
      await apiClient.delete(`/articles/${id}`)
      toast.success('Đã xóa bài viết thành công')
      loadData()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Không thể xóa bài viết')
    }
  }

  const handlePublish = async (id: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền xuất bản bài viết')
      return
    }

    try {
      await apiClient.patch(`/articles/${id}/publish`)
      toast.success('Đã xuất bản bài viết')
      loadData()
    } catch (error) {
      console.error('Error publishing article:', error)
      toast.error('Không thể publish bài viết')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Nháp' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Chờ duyệt' },
      published: { color: 'bg-green-100 text-green-700', label: 'Đã xuất bản' },
      archived: { color: 'bg-red-100 text-red-700', label: 'Lưu trữ' },
    }
    const variant = variants[status] || variants.draft
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  const formatNumber = (value?: number) => (value || 0).toLocaleString('vi-VN')

  const eventLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    article_ai_ask: { label: 'Hỏi AI', icon: Bot, color: 'text-[#1E40AF] bg-[#F0F6FF] border-[#E8EDF5]' },
    cta_chat: { label: 'Hỏi dược sĩ', icon: MessageCircle, color: 'text-[#0A2463] bg-[#F0F6FF] border-[#E8EDF5]' },
    cta_prescription_upload: { label: 'Gửi đơn thuốc', icon: FileText, color: 'text-amber-700 bg-amber-50 border-amber-100' },
    cta_product_search: { label: 'Tìm sản phẩm', icon: ShoppingBag, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    related_product_click: { label: 'Click sản phẩm', icon: ShoppingBag, color: 'text-green-700 bg-green-50 border-green-100' },
    article_save: { label: 'Lưu bài', icon: Bookmark, color: 'text-[#1E40AF] bg-[#F0F6FF] border-[#E8EDF5]' },
    topic_follow: { label: 'Follow chủ đề', icon: Bell, color: 'text-[#1E40AF] bg-[#F0F6FF] border-[#E8EDF5]' },
    article_share: { label: 'Chia sẻ', icon: BarChart3, color: 'text-slate-700 bg-slate-50 border-slate-100' },
  }

  const getEditorialReasons = (article: ArticleInsights['editorialWarnings'][number]) => {
    const reasons: string[] = []
    if (!article.reviewedBy) reasons.push('Thiếu reviewer')
    if (!article.referencesCount) reasons.push('Thiếu nguồn')
    if (article.riskLevel === 'emergency-sensitive') reasons.push('Nội dung nhạy cảm')
    if (article.lastMedicallyReviewedAt) {
      const reviewedAt = new Date(article.lastMedicallyReviewedAt).getTime()
      if (Date.now() - reviewedAt > 180 * 24 * 60 * 60 * 1000) reasons.push('Review quá 180 ngày')
    } else {
      reasons.push('Chưa có ngày review')
    }
    return reasons
  }

  const renderInsights = () => {
    if (insightsLoading || !insights) {
      return (
        <Card className='bg-white border-[#E8EDF5]'>
          <CardContent className='p-8 text-center text-gray-500'>Đang tải insights...</CardContent>
        </Card>
      )
    }

    const funnelItems = Object.entries(eventLabels).map(([eventType, config]) => ({
      eventType,
      ...config,
      count: insights.funnel[eventType]?.count || 0,
      uniqueSessions: insights.funnel[eventType]?.uniqueSessions || 0,
    }))

    return (
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Insights bài viết</h2>
            <p className='text-sm text-gray-500 mt-1'>Đo event sau khi đọc trong {insights.period.days} ngày gần nhất và trạng thái editorial hiện tại.</p>
          </div>
          <Select value={insightsDays} onValueChange={setInsightsDays}>
            <SelectTrigger className='w-40 bg-white border-2 border-[#BFDBFE]'>
              <SelectValue placeholder='Khoảng thời gian' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>7 ngày</SelectItem>
              <SelectItem value='30'>30 ngày</SelectItem>
              <SelectItem value='90'>90 ngày</SelectItem>
              <SelectItem value='180'>180 ngày</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {[
            { label: 'Tổng engagement', value: insights.overview.totalEvents, icon: BarChart3, color: 'bg-[#E8EDF5] text-[#0A2463]' },
            { label: 'Hỏi AI', value: insights.funnel.article_ai_ask?.count || 0, icon: Bot, color: 'bg-[#E8EDF5] text-[#1E40AF]' },
            { label: 'CTA tư vấn/mua', value: (insights.funnel.cta_chat?.count || 0) + (insights.funnel.cta_prescription_upload?.count || 0) + (insights.funnel.cta_product_search?.count || 0) + (insights.funnel.related_product_click?.count || 0), icon: MessageCircle, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Đang lưu/follow', value: insights.overview.savedArticles + insights.overview.followedTopics, icon: Bookmark, color: 'bg-[#E8EDF5] text-[#1E40AF]' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className='bg-white border-[#E8EDF5]'>
                <CardContent className='p-6 flex items-center gap-4'>
                  <div className={`p-3 rounded-full ${item.color}`}>
                    <Icon className='h-6 w-6' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-500'>{item.label}</p>
                    <h3 className='text-2xl font-bold text-gray-900'>{formatNumber(item.value)}</h3>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className='bg-white border-[#E8EDF5]'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <BarChart3 className='h-5 w-5 text-[#1E40AF]' />
              <h3 className='text-lg font-semibold text-gray-900'>Funnel hành động sau khi đọc</h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3'>
              {funnelItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.eventType} className={`rounded-lg border p-4 ${item.color}`}>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4' />
                        <span className='text-sm font-medium'>{item.label}</span>
                      </div>
                      <span className='text-xl font-bold'>{formatNumber(item.count)}</span>
                    </div>
                    <p className='text-xs mt-2 opacity-80'>{formatNumber(item.uniqueSessions)} phiên duy nhất</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <Card className='bg-white border-[#E8EDF5]'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Top bài theo engagement</h3>
              <div className='space-y-3'>
                {insights.topEngagedArticles.length === 0 ? (
                  <p className='text-sm text-gray-500'>Chưa có dữ liệu engagement trong khoảng thời gian này.</p>
                ) : (
                  insights.topEngagedArticles.map((article, index) => (
                    <div key={article.articleId} className='flex items-start justify-between gap-4 rounded-lg border border-blue-50 p-4'>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-semibold text-[#1E40AF]'>#{index + 1}</span>
                          {article.riskLevel && <Badge variant='outline'>{article.riskLevel}</Badge>}
                        </div>
                        {article.slug ? (
                          <Link to={`/health/article/${article.slug}`} target='_blank' className='mt-1 block font-medium text-gray-900 hover:text-[#1E40AF] line-clamp-2'>
                            {article.title || 'Bài viết đã xoá'}
                          </Link>
                        ) : (
                          <p className='mt-1 font-medium text-gray-500 line-clamp-2'>Bài viết đã xoá</p>
                        )}
                        <p className='text-xs text-gray-500 mt-1'>{formatNumber(article.viewCount)} views · {formatNumber(article.aiAsks)} AI · {formatNumber(article.ctaEvents)} CTA</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xl font-bold text-gray-900'>{formatNumber(article.totalEvents)}</p>
                        <p className='text-xs text-gray-500'>events</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white border-[#E8EDF5]'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Hiệu quả theo danh mục</h3>
              <div className='space-y-3'>
                {insights.categoryPerformance.length === 0 ? (
                  <p className='text-sm text-gray-500'>Chưa có dữ liệu danh mục trong khoảng thời gian này.</p>
                ) : (
                  insights.categoryPerformance.map((category) => (
                    <div key={category.categoryId || category.categoryName} className='rounded-lg border border-blue-50 p-4'>
                      <div className='flex items-center justify-between gap-4'>
                        <p className='font-medium text-gray-900'>{category.categoryName}</p>
                        <p className='font-bold text-[#1E40AF]'>{formatNumber(category.totalEvents)} events</p>
                      </div>
                      <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600'>
                        <span>{formatNumber(category.aiAsks)} lượt hỏi AI</span>
                        <span>{formatNumber(category.ctaEvents)} CTA</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='bg-white border-amber-100'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <ShieldCheck className='h-5 w-5 text-amber-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Cảnh báo editorial cần rà soát</h3>
            </div>
            <div className='rounded-md border border-amber-100 overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-amber-50 hover:bg-amber-50'>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Rủi ro</TableHead>
                    <TableHead>Vấn đề</TableHead>
                    <TableHead className='text-right'>Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.editorialWarnings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center py-6 text-gray-500'>
                        Không có cảnh báo editorial đáng chú ý.
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights.editorialWarnings.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className='max-w-[360px]'>
                          <Link to={`${basePath}/${article._id}/edit`} className='font-medium text-gray-900 hover:text-[#1E40AF] line-clamp-2'>
                            {article.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className={article.riskLevel === 'emergency-sensitive' ? 'border-red-200 text-red-700 bg-red-50' : ''}>
                            {article.riskLevel || 'general'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-1'>
                            {getEditorialReasons(article).map((reason) => (
                              <Badge key={reason} variant='outline' className='border-amber-200 text-amber-700 bg-amber-50'>
                                <AlertTriangle className='h-3 w-3 mr-1' />
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>{formatNumber(article.viewCount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stats calculation
  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pending: articles.filter((a) => a.status === 'pending').length,
    featured: articles.filter((a) => a.isFeatured).length,
  }

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-blue-50'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
            }}
          >
            Quản lý bài viết
          </h1>
          <p className='text-gray-500 mt-1'>Quản lý, chỉnh sửa và xuất bản các bài viết sức khỏe</p>
        </div>
        <Link to={`${basePath}/new`}>
          <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white shadow-md transition-all duration-200 hover:shadow-lg'>
            <Plus className='mr-2 h-4 w-4' /> Viết bài mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-[#E8EDF5] rounded-full'>
              <FileText className='h-6 w-6 text-[#1E40AF]' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Tổng bài viết</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-green-100 rounded-full'>
              <CheckCircle className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Đã xuất bản</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.published}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-yellow-100 rounded-full'>
              <Clock className='h-6 w-6 text-yellow-600' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Chờ duyệt / Nháp</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.pending + stats.draft}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-[#E8EDF5] rounded-full'>
              <Star className='h-6 w-6 text-[#1E40AF]' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Nổi bật</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.featured}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='list' className='space-y-6'>
        {isAdmin && (
          <TabsList className='grid w-full max-w-md grid-cols-2 bg-[#F0F6FF] p-1.5 rounded-lg h-auto'>
            <TabsTrigger value='list'>Danh sách</TabsTrigger>
            <TabsTrigger value='insights'>Insights</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value='list' className='mt-0'>
          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-6'>
          <div className='flex gap-4 mb-6'>
            <div className='w-48'>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className='bg-white border-2 border-[#BFDBFE]'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='published'>Đã xuất bản</SelectItem>
                  <SelectItem value='draft'>Bản nháp</SelectItem>
                  <SelectItem value='pending'>Chờ duyệt</SelectItem>
                  <SelectItem value='archived'>Lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='w-48'>
              <Select value={filter.categoryId} onValueChange={(value) => setFilter({ ...filter, categoryId: value })}>
                <SelectTrigger className='bg-white border-2 border-[#BFDBFE]'>
                  <SelectValue placeholder='Danh mục' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border-2 border-[#E8EDF5] bg-white overflow-hidden'>
            <Table className='px-4'>
              <TableHeader>
                <TableRow className='text-bold !bg-[#F0F6FF] hover:!bg-[#F0F6FF] !border-b-2 !border-[#BFDBFE]'>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right !pr-6'>Thao tác </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-8 text-gray-500'>
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-8 text-gray-500'>
                      Không có bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow
                      key={article._id}
                      className='border-b border-[#BFDBFE] hover:bg-[#F0F6FF]/50 transition-colors'
                    >
                      <TableCell className='font-medium max-w-[300px]'>
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900 line-clamp-1' title={article.title}>
                              {article.title}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            {article.isFeatured && (
                              <Badge
                                variant='outline'
                                className='text-[10px] bg-[#F0F6FF] text-[#1E40AF] border-[#BFDBFE]'
                              >
                                Nổi bật
                              </Badge>
                            )}
                            {article.isPinned && (
                              <Badge variant='outline' className='text-[10px] bg-[#F0F6FF] text-[#0A2463] border-[#BFDBFE]'>
                                Ghim
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary' className='bg-gray-100 text-gray-700 hover:bg-gray-200'>
                          {article.category?.name || 'Chưa phân loại'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-gray-600'>{article.authorName}</TableCell>
                      <TableCell>{getStatusBadge(article.status)}</TableCell>
                      <TableCell>
                        <div className='flex justify-end gap-2'>
                          <Link to={`/health/article/${article.slug}`} target='_blank'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:text-[#1E40AF] hover:bg-[#F0F6FF]'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Link to={`${basePath}/${article._id}/edit`}>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:text-[#1E40AF] hover:bg-[#F0F6FF]'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                          </Link>
                          {isAdmin && article.status !== 'published' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handlePublish(article._id!)}
                              title='Xuất bản'
                              className='h-8 w-8 hover:text-green-600 hover:bg-green-50'
                            >
                              <CheckCircle className='h-4 w-4' />
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleDelete(article._id!)}
                            className='h-8 w-8 hover:text-red-600 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && <TabsContent value='insights' className='mt-0'>{renderInsights()}</TabsContent>}
      </Tabs>
    </div>
  )
}
