import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { RichTextEditor } from '~/components/ui/rich-text-editor'
import apiClient from '~/services/apiClient'
import type { HealthCategory } from '@/types/article'
import { useAuth } from '~/contexts/AuthContext'

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
}

interface AdminArticleFormProps {
    basePath?: string
}

export function AdminArticleForm({ basePath = '/admin/articles' }: AdminArticleFormProps) {
    const { user } = useAuth()
    const isAdmin = user?.role === 0

    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
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
        metaKeywords: ''
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
                metaKeywords: article.metaKeywords?.join(', ') || ''
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

    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title)
        })
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
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
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
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(basePath)} className="hover:bg-blue-50 hover:text-blue-600">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div>
                    <h1
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{
                            backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
                        }}
                    >
                        {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {isEdit ? 'Cập nhật thông tin và nội dung bài viết' : 'Tạo bài viết mới để chia sẻ kiến thức'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl text-blue-800">Thông tin cơ bản</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-medium">Tiêu đề *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                required
                                placeholder="Nhập tiêu đề bài viết"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug" className="text-base font-medium">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="bai-viet-slug"
                                className="h-11 bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-base font-medium">Tóm tắt *</Label>
                            <Textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                required
                                rows={3}
                                placeholder="Tóm tắt ngắn gọn về bài viết (10-500 ký tự)"
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-base font-medium">Nội dung *</Label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Nội dung chi tiết của bài viết (tối thiểu 50 ký tự)"
                                height={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ký tự: {formData.content.length}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="categoryId" className="text-base font-medium">Danh mục *</Label>
                                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Chọn danh mục" />
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

                            <div className="space-y-2">
                                <Label htmlFor="featuredImage" className="text-base font-medium">Ảnh đại diện (URL)</Label>
                                <Input
                                    id="featuredImage"
                                    value={formData.featuredImage}
                                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-base font-medium">Tags (ngăn cách bởi dấu phẩy)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="sức khỏe, dinh dưỡng, vitamin"
                                className="h-11"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* SEO & Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl text-blue-800">SEO & Cài đặt</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="metaTitle" className="text-base font-medium">Meta Title</Label>
                            <Input
                                id="metaTitle"
                                value={formData.metaTitle}
                                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                                placeholder="Tiêu đề hiển thị trên Google"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="metaDescription" className="text-base font-medium">Meta Description</Label>
                            <Textarea
                                id="metaDescription"
                                value={formData.metaDescription}
                                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                                rows={2}
                                placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm"
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="metaKeywords" className="text-base font-medium">Meta Keywords (ngăn cách bởi dấu phẩy)</Label>
                            <Input
                                id="metaKeywords"
                                value={formData.metaKeywords}
                                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                                placeholder="keyword1, keyword2, keyword3"
                                className="h-11"
                            />
                        </div>

                        <div className="flex items-start justify-between gap-6 pt-4 border-t">
                            <div className="w-1/3 space-y-2">
                                <Label htmlFor="status" className="text-base font-medium">Trạng thái bài viết</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger className="h-11 bg-white">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Bản nháp</SelectItem>
                                        <SelectItem value="pending">Gửi duyệt (Chờ duyệt)</SelectItem>
                                        {isAdmin && (
                                            <>
                                                <SelectItem value="published">Đã xuất bản</SelectItem>
                                                <SelectItem value="archived">Lưu trữ</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-gray-500">
                                    {!isAdmin ? 'Dược sĩ chỉ có thể lưu nháp hoặc gửi bài chờ duyệt.' : 'Admin có toàn quyền quyết định trạng thái bài viết.'}
                                </p>
                            </div>

                            <div className="flex items-center gap-8 pt-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isFeatured"
                                        checked={formData.isFeatured}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                                    />
                                    <Label htmlFor="isFeatured" className="cursor-pointer">Nổi bật</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isPinned"
                                        checked={formData.isPinned}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                                    />
                                    <Label htmlFor="isPinned" className="cursor-pointer">Ghim bài viết</Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(basePath)}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật bài viết' : 'Xuất bản bài mới')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
