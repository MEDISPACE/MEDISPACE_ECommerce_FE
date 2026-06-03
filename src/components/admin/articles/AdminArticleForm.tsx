import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Wand2, Loader2, FileCheck, ListTree, HelpCircle, SearchCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { RichTextEditor } from '~/components/ui/rich-text-editor'
import apiClient from '~/services/apiClient'
import articleService, { type ArticleAiAssistResult } from '~/services/articleService'
import type { HealthCategory } from '@/types/article'
import { useAuth } from '~/contexts/AuthContext'
import { UserRole } from '~/types/user'

interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  categoryId: string
  featuredImage: string
  tags: string
  status: 'draft' | 'pending' | 'published' | 'archived'
  isFeatured: boolean
  isPinned: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  reviewedBy: string
  reviewedByTitle: string
  reviewedAt: string
  lastMedicallyReviewedAt: string
  references: string
  contentVersion: string
  riskLevel: 'general' | 'medication' | 'disease' | 'emergency-sensitive'
  targetAudiences: string
  symptoms: string
  activeIngredients: string
  healthTopics: string
}

interface AdminArticleFormProps {
  basePath?: string
}

export function AdminArticleForm({ basePath = '/admin/articles' }: AdminArticleFormProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.Admin

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [aiLoadingAction, setAiLoadingAction] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<ArticleAiAssistResult | null>(null)
  const [categories, setCategories] = useState<HealthCategory[]>([])
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    featuredImage: '',
    tags: '',
    status: 'draft',
    isFeatured: false,
    isPinned: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    reviewedBy: '',
    reviewedByTitle: '',
    reviewedAt: '',
    lastMedicallyReviewedAt: '',
    references: '',
    contentVersion: '1',
    riskLevel: 'general',
    targetAudiences: '',
    symptoms: '',
    activeIngredients: '',
    healthTopics: '',
  })

  useEffect(() => {
    loadCategories()
    if (isEdit) {
      loadArticle()
    }
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/health-categories')
      setCategories((res.data as any).result.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadArticle = async () => {
    try {
      const res = await apiClient.get(`/articles/${id}`)
      const article = (res.data as any).result
      setFormData({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        categoryId: article.categoryId,
        featuredImage: article.featuredImage || '',
        tags: article.tags?.join(', ') || '',
        status: article.status,
        isFeatured: article.isFeatured,
        isPinned: article.isPinned,
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
        metaKeywords: article.metaKeywords?.join(', ') || '',
        reviewedBy: article.reviewedBy || '',
        reviewedByTitle: article.reviewedByTitle || '',
        reviewedAt: formatDateInput(article.reviewedAt),
        lastMedicallyReviewedAt: formatDateInput(article.lastMedicallyReviewedAt),
        references: formatReferences(article.references),
        contentVersion: String(article.contentVersion || 1),
        riskLevel: article.riskLevel || 'general',
        targetAudiences: article.targetAudiences?.join(', ') || '',
        symptoms: article.symptoms?.join(', ') || '',
        activeIngredients: article.activeIngredients?.join(', ') || '',
        healthTopics: article.healthTopics?.join(', ') || '',
      })
    } catch (error) {
      console.error('Error loading article:', error)
      toast.error('Không thể tải bài viết')
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const formatDateInput = (date?: string) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 10)
  }

  const formatReferences = (references?: Array<{ title: string; url?: string }>) => {
    if (!references?.length) return ''
    return references.map((reference) => [reference.title, reference.url].filter(Boolean).join(' | ')).join('\n')
  }

  const parseReferences = (value: string) => {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, url] = line.split('|').map((part) => part.trim())
        return { title, url: url || undefined }
      })
      .filter((reference) => reference.title)
  }

  const parseCommaList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    })
  }

  const selectedCategoryName = categories.find((category) => category._id === formData.categoryId)?.name

  const appendHtmlToContent = (html: string) => {
    setFormData((prev) => ({
      ...prev,
      content: `${prev.content || ''}${prev.content ? '<p><br></p>' : ''}${html}`,
    }))
  }

  const runAiAssist = async (action: 'outline' | 'seo' | 'excerpt' | 'faq' | 'quality_check' | 'sources') => {
    if (!formData.title.trim()) {
      toast.error('Nhập tiêu đề trước khi dùng AI')
      return
    }

    setAiLoadingAction(action)
    try {
      const result = await articleService.generateAiAssistance({
        action,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        categoryName: selectedCategoryName,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      })

      if (!result) {
        toast.error('Không thể tạo gợi ý AI')
        return
      }

      setAiResult(result)
      if (action === 'seo') {
        setFormData((prev) => ({
          ...prev,
          metaTitle: result.result.metaTitle || prev.metaTitle,
          metaDescription: result.result.metaDescription || prev.metaDescription,
          metaKeywords: result.result.keywords?.join(', ') || prev.metaKeywords,
        }))
        toast.success('Đã áp dụng gợi ý SEO')
      }
      if (action === 'excerpt' && result.result.excerpt) {
        setFormData((prev) => ({ ...prev, excerpt: result.result.excerpt || prev.excerpt }))
        toast.success('Đã áp dụng tóm tắt AI')
      }
    } finally {
      setAiLoadingAction(null)
    }
  }

  const insertAiResult = () => {
    if (!aiResult) return
    const { result, action } = aiResult

    if (action === 'outline' && result.outline?.length) {
      appendHtmlToContent(
        `<h2>Dàn ý đề xuất</h2><ul>${result.outline.map((item) => `<li>${item}</li>`).join('')}</ul>`,
      )
      toast.success('Đã chèn dàn ý vào nội dung')
      return
    }

    if (action === 'faq' && result.faq?.length) {
      appendHtmlToContent(
        `<h2>Câu hỏi thường gặp</h2>${result.faq
          .map((item) => `<h3>${item.question}</h3><p>${item.answer}</p>`)
          .join('')}`,
      )
      toast.success('Đã chèn FAQ vào nội dung')
      return
    }

    if (action === 'sources' && result.sourceTopics?.length) {
      setFormData((prev) => ({
        ...prev,
        references: `${prev.references ? `${prev.references}\n` : ''}${result.sourceTopics
          ?.map((item) => `${item} | `)
          .join('\n')}`,
      }))
      toast.success('Đã chèn gợi ý nguồn vào danh sách nguồn')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Client-side validation
    if (formData.content.length < 50) {
      toast.error('Nội dung bài viết quá ngắn (tối thiểu 50 ký tự)')
      setLoading(false)
      return
    }

    if (formData.excerpt.length < 10) {
      toast.error('Tóm tắt bài viết quá ngắn (tối thiểu 10 ký tự)')
      setLoading(false)
      return
    }

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        categoryId: formData.categoryId,
        featuredImage: formData.featuredImage || undefined,
        tags: parseCommaList(formData.tags),
        status: formData.status,
        isFeatured: isAdmin ? formData.isFeatured : undefined,
        isPinned: isAdmin ? formData.isPinned : undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        metaKeywords: parseCommaList(formData.metaKeywords),
        reviewedBy: formData.reviewedBy || undefined,
        reviewedByTitle: formData.reviewedByTitle || undefined,
        references: parseReferences(formData.references),
        reviewedAt: formData.reviewedAt || undefined,
        lastMedicallyReviewedAt: formData.lastMedicallyReviewedAt || undefined,
        contentVersion: Number(formData.contentVersion || 1),
        riskLevel: formData.riskLevel,
        targetAudiences: parseCommaList(formData.targetAudiences),
        symptoms: parseCommaList(formData.symptoms),
        activeIngredients: parseCommaList(formData.activeIngredients),
        healthTopics: parseCommaList(formData.healthTopics),
      }

      if (isEdit) {
        await apiClient.patch(`/articles/${id}`, payload)
        toast.success('Cập nhật bài viết thành công!')
      } else {
        await apiClient.post('/articles', payload)
        toast.success('Tạo bài viết thành công!')
      }

      navigate(basePath)
    } catch (error: any) {
      console.error('Error saving article:', error)
      const backendErrors = error.response?.data?.errors

      if (backendErrors) {
        // Show first validation error
        const firstErrorKey = Object.keys(backendErrors)[0]
        const firstErrorMsg = backendErrors[firstErrorKey]?.msg || 'Lỗi không xác định'
        toast.error(`Lỗi validation: ${firstErrorMsg}`)
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' onClick={() => navigate(basePath)} className='hover:bg-blue-50 hover:text-blue-600'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Quay lại
        </Button>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
            }}
          >
            {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
          </h1>
          <p className='text-gray-600 text-sm mt-1'>
            {isEdit ? 'Cập nhật thông tin và nội dung bài viết' : 'Tạo bài viết mới để chia sẻ kiến thức'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Basic Information */}
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardHeader>
            <CardTitle className='text-xl text-blue-800'>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title' className='text-base font-medium'>
                Tiêu đề *
              </Label>
              <Input
                id='title'
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder='Nhập tiêu đề bài viết'
                className='h-11 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='slug' className='text-base font-medium'>
                Slug (URL)
              </Label>
              <Input
                id='slug'
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder='bai-viet-slug'
                className='h-11 bg-gray-50 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='excerpt' className='text-base font-medium'>
                Tóm tắt *
              </Label>
              <Textarea
                id='excerpt'
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                rows={3}
                placeholder='Tóm tắt ngắn gọn về bài viết (10-500 ký tự)'
                className='resize-none border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='content' className='text-base font-medium'>
                Nội dung *
              </Label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder='Nội dung chi tiết của bài viết (tối thiểu 50 ký tự)'
                height={500}
              />
              <p className='text-xs text-gray-500 mt-1'>Ký tự: {formData.content.length}</p>
            </div>

            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='categoryId' className='text-base font-medium'>
                  Danh mục *
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger className='h-11 border-2 border-blue-200'>
                    <SelectValue placeholder='Chọn danh mục' />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='featuredImage' className='text-base font-medium'>
                  Ảnh đại diện (URL)
                </Label>
                <Input
                  id='featuredImage'
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder='https://example.com/image.jpg'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='tags' className='text-base font-medium'>
                Tags (ngăn cách bởi dấu phẩy)
              </Label>
              <Input
                id='tags'
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder='sức khỏe, dinh dưỡng, vitamin'
                className='h-11 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t'>
              <div className='space-y-2'>
                <Label htmlFor='healthTopics' className='text-base font-medium'>
                  Chủ đề Health A-Z
                </Label>
                <Input
                  id='healthTopics'
                  value={formData.healthTopics}
                  onChange={(e) => setFormData({ ...formData, healthTopics: e.target.value })}
                  placeholder='cảm cúm, dị ứng, huyết áp'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='targetAudiences' className='text-base font-medium'>
                  Nhóm người đọc
                </Label>
                <Input
                  id='targetAudiences'
                  value={formData.targetAudiences}
                  onChange={(e) => setFormData({ ...formData, targetAudiences: e.target.value })}
                  placeholder='trẻ em, người cao tuổi, phụ nữ mang thai'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='symptoms' className='text-base font-medium'>
                  Triệu chứng liên quan
                </Label>
                <Input
                  id='symptoms'
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder='ho, sốt, đau họng'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='activeIngredients' className='text-base font-medium'>
                  Hoạt chất/thuốc
                </Label>
                <Input
                  id='activeIngredients'
                  value={formData.activeIngredients}
                  onChange={(e) => setFormData({ ...formData, activeIngredients: e.target.value })}
                  placeholder='paracetamol, ibuprofen, vitamin c'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Author Assistant */}
        <Card className='bg-white backdrop-blur-lg border-cyan-100'>
          <CardHeader>
            <CardTitle className='text-xl text-cyan-800 flex items-center gap-2'>
              <Wand2 className='h-5 w-5' />
              AI hỗ trợ tác giả
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
              {[
                { action: 'outline' as const, label: 'Dàn ý', icon: ListTree },
                { action: 'seo' as const, label: 'SEO', icon: SearchCheck },
                { action: 'excerpt' as const, label: 'Tóm tắt', icon: FileCheck },
                { action: 'faq' as const, label: 'FAQ', icon: HelpCircle },
                { action: 'quality_check' as const, label: 'Kiểm tra', icon: Wand2 },
              ].map((item) => {
                const Icon = item.icon
                const isLoading = aiLoadingAction === item.action
                return (
                  <Button
                    key={item.action}
                    type='button'
                    variant='outline'
                    onClick={() => runAiAssist(item.action)}
                    disabled={!!aiLoadingAction}
                    className='border-cyan-200 text-cyan-700 hover:bg-cyan-50'
                  >
                    {isLoading ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Icon className='h-4 w-4 mr-2' />}
                    {item.label}
                  </Button>
                )
              })}
            </div>

            <Button
              type='button'
              variant='ghost'
              onClick={() => runAiAssist('sources')}
              disabled={!!aiLoadingAction}
              className='text-cyan-700 hover:bg-cyan-50'
            >
              {aiLoadingAction === 'sources' ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <SearchCheck className='h-4 w-4 mr-2' />
              )}
              Gợi ý nhóm nguồn tham khảo cần tra cứu
            </Button>

            {aiResult && (
              <div className='rounded-lg border border-cyan-100 bg-cyan-50/60 p-4 space-y-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='font-semibold text-cyan-950'>Kết quả AI: {aiResult.action}</h3>
                    <p className='text-sm text-cyan-800 mt-1'>Kiểm tra lại nội dung trước khi đăng, đặc biệt với khuyến nghị y tế.</p>
                  </div>
                  {['outline', 'faq', 'sources'].includes(aiResult.action) && (
                    <Button type='button' size='sm' onClick={insertAiResult} className='bg-cyan-700 hover:bg-cyan-800 text-white'>
                      Chèn vào bài
                    </Button>
                  )}
                </div>

                {aiResult.result.suggestions?.length ? (
                  <div>
                    <p className='text-sm font-medium text-gray-700 mb-2'>Gợi ý:</p>
                    <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
                      {aiResult.result.suggestions.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiResult.result.outline?.length ? (
                  <div>
                    <p className='text-sm font-medium text-gray-700 mb-2'>Dàn ý:</p>
                    <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
                      {aiResult.result.outline.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiResult.result.faq?.length ? (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-gray-700'>FAQ:</p>
                    {aiResult.result.faq.map((item, index) => (
                      <div key={`${item.question}-${index}`} className='text-sm text-gray-700'>
                        <p className='font-medium'>{item.question}</p>
                        <p>{item.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {aiResult.result.warnings?.length ? (
                  <div>
                    <p className='text-sm font-medium text-red-700 mb-2'>Cảnh báo cần rà soát:</p>
                    <ul className='list-disc pl-5 text-sm text-red-700 space-y-1'>
                      {aiResult.result.warnings.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiResult.result.sourceTopics?.length ? (
                  <div>
                    <p className='text-sm font-medium text-gray-700 mb-2'>Nguồn nên tra cứu:</p>
                    <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
                      {aiResult.result.sourceTopics.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO & Settings */}
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardHeader>
            <CardTitle className='text-xl text-blue-800'>SEO & Cài đặt</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='metaTitle' className='text-base font-medium'>
                Meta Title
              </Label>
              <Input
                id='metaTitle'
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder='Tiêu đề hiển thị trên Google'
                className='h-11 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='metaDescription' className='text-base font-medium'>
                Meta Description
              </Label>
              <Textarea
                id='metaDescription'
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                rows={2}
                placeholder='Mô tả ngắn hiển thị trên kết quả tìm kiếm'
                className='resize-none border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='metaKeywords' className='text-base font-medium'>
                Meta Keywords (ngăn cách bởi dấu phẩy)
              </Label>
              <Input
                id='metaKeywords'
                value={formData.metaKeywords}
                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                placeholder='keyword1, keyword2, keyword3'
                className='h-11 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t'>
              <div className='space-y-2'>
                <Label htmlFor='riskLevel' className='text-base font-medium'>
                  Mức rủi ro nội dung
                </Label>
                <Select
                  value={formData.riskLevel}
                  onValueChange={(value: ArticleFormData['riskLevel']) => setFormData({ ...formData, riskLevel: value })}
                >
                  <SelectTrigger className='h-11 bg-white border-2 border-blue-200'>
                    <SelectValue placeholder='Chọn mức rủi ro' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='general'>Kiến thức chung</SelectItem>
                    <SelectItem value='medication'>Liên quan thuốc</SelectItem>
                    <SelectItem value='disease'>Liên quan bệnh</SelectItem>
                    <SelectItem value='emergency-sensitive'>Nhạy cảm cấp cứu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='contentVersion' className='text-base font-medium'>
                  Phiên bản nội dung
                </Label>
                <Input
                  id='contentVersion'
                  type='number'
                  min='1'
                  value={formData.contentVersion}
                  onChange={(e) => setFormData({ ...formData, contentVersion: e.target.value })}
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reviewedBy' className='text-base font-medium'>
                  Người kiểm duyệt chuyên môn
                </Label>
                <Input
                  id='reviewedBy'
                  value={formData.reviewedBy}
                  onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                  placeholder='VD: DS. Nguyễn Văn A'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reviewedByTitle' className='text-base font-medium'>
                  Chức danh người kiểm duyệt
                </Label>
                <Input
                  id='reviewedByTitle'
                  value={formData.reviewedByTitle}
                  onChange={(e) => setFormData({ ...formData, reviewedByTitle: e.target.value })}
                  placeholder='VD: Dược sĩ lâm sàng'
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reviewedAt' className='text-base font-medium'>
                  Ngày kiểm duyệt
                </Label>
                <Input
                  id='reviewedAt'
                  type='date'
                  value={formData.reviewedAt}
                  onChange={(e) => setFormData({ ...formData, reviewedAt: e.target.value })}
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastMedicallyReviewedAt' className='text-base font-medium'>
                  Cập nhật chuyên môn gần nhất
                </Label>
                <Input
                  id='lastMedicallyReviewedAt'
                  type='date'
                  value={formData.lastMedicallyReviewedAt}
                  onChange={(e) => setFormData({ ...formData, lastMedicallyReviewedAt: e.target.value })}
                  className='h-11 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='references' className='text-base font-medium'>
                Nguồn tham khảo
              </Label>
              <Textarea
                id='references'
                value={formData.references}
                onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                rows={4}
                placeholder={'Mỗi dòng một nguồn, định dạng: Tiêu đề nguồn | https://example.com'}
                className='resize-none border-2 border-blue-200 focus:border-blue-500'
              />
              <p className='text-xs text-gray-500'>Nguồn rõ ràng giúp bài viết sức khỏe đáng tin cậy hơn.</p>
            </div>

            <div className='flex items-start justify-between gap-6 pt-4 border-t'>
              <div className='w-1/3 space-y-2'>
                <Label htmlFor='status' className='text-base font-medium'>
                  Trạng thái bài viết
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className='h-11 bg-white border-2 border-blue-200'>
                    <SelectValue placeholder='Chọn trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draft'>Bản nháp</SelectItem>
                    <SelectItem value='pending'>Gửi duyệt (Chờ duyệt)</SelectItem>
                    {isAdmin && (
                      <>
                        <SelectItem value='published'>Đã xuất bản</SelectItem>
                        <SelectItem value='archived'>Lưu trữ</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className='text-sm text-gray-500'>
                  {!isAdmin
                    ? 'Dược sĩ chỉ có thể lưu nháp hoặc gửi bài chờ duyệt.'
                    : 'Admin có toàn quyền quyết định trạng thái bài viết.'}
                </p>
              </div>

              {isAdmin && (
                <div className='flex items-center gap-8 pt-6'>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='isFeatured'
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    />
                    <Label htmlFor='isFeatured' className='cursor-pointer'>
                      Nổi bật
                    </Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='isPinned'
                      checked={formData.isPinned}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                    />
                    <Label htmlFor='isPinned' className='cursor-pointer'>
                      Ghim bài viết
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-end gap-4'>
          <Button type='button' variant='outline' onClick={() => navigate(basePath)}>
            Hủy
          </Button>
          <Button
            type='submit'
            disabled={loading}
            className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white'
          >
            <Save className='h-4 w-4 mr-2' />
            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật bài viết' : 'Lưu bài viết'}
          </Button>
        </div>
      </form>
    </div>
  )
}
