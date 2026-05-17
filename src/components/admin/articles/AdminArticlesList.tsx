import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, CheckCircle, FileText, Clock, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import apiClient from '~/services/apiClient'
import type { Article, HealthCategory } from '@/types/article'
import { useAuth } from '~/contexts/AuthContext'

interface AdminArticlesListProps {
  basePath?: string
}

export function AdminArticlesList({ basePath = '/admin/articles' }: AdminArticlesListProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 0 // 0 is Admin, 1 is Pharmacist

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<HealthCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'all',
    categoryId: 'all',
  })

  useEffect(() => {
    loadData()
  }, [filter])

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
              backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
            }}
          >
            Quản lý bài viết
          </h1>
          <p className='text-gray-500 mt-1'>Quản lý, chỉnh sửa và xuất bản các bài viết sức khỏe</p>
        </div>
        <Link to={`${basePath}/new`}>
          <Button className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white shadow-md transition-all duration-200 hover:shadow-lg'>
            <Plus className='mr-2 h-4 w-4' /> Viết bài mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <FileText className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Tổng bài viết</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='p-3 bg-purple-100 rounded-full'>
              <Star className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Nổi bật</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.featured}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardContent className='p-6'>
          <div className='flex gap-4 mb-6'>
            <div className='w-48'>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className='bg-white border-2 border-blue-200'>
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
                <SelectTrigger className='bg-white border-2 border-blue-200'>
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

          <div className='rounded-md border-2 border-blue-100 bg-white overflow-hidden'>
            <Table className='px-4'>
              <TableHeader>
                <TableRow className='text-bold !bg-blue-50 hover:!bg-blue-50 !border-b-2 !border-blue-300'>
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
                      className='border-b border-blue-200 hover:bg-blue-50/50 transition-colors'
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
                                className='text-[10px] bg-purple-50 text-purple-700 border-purple-200'
                              >
                                Nổi bật
                              </Badge>
                            )}
                            {article.isPinned && (
                              <Badge variant='outline' className='text-[10px] bg-blue-50 text-blue-700 border-blue-200'>
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
                              className='h-8 w-8 hover:text-blue-600 hover:bg-blue-50'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Link to={`${basePath}/${article._id}/edit`}>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:text-blue-600 hover:bg-blue-50'
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
    </div>
  )
}
