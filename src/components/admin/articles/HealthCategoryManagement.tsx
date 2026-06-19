import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { toast } from 'sonner'
import articleService from '~/services/articleService'
import type { HealthCategory } from '~/types/article'

export function HealthCategoryManagement() {
  const [categories, setCategories] = useState<HealthCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Partial<HealthCategory>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await articleService.getHealthCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setIsEditing(false)
    setCurrentCategory({ isActive: true })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (category: HealthCategory) => {
    setIsEditing(true)
    setCurrentCategory({ ...category })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

    try {
      await articleService.deleteHealthCategory(id)
      setCategories((prev) => prev.filter((c) => c._id !== id))
      toast.success('Đã xóa danh mục')
    } catch (error) {
      toast.error('Không thể xóa danh mục')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCategory.name) {
      toast.error('Vui lòng nhập tên danh mục')
      return
    }

    setSaving(true)
    try {
      if (isEditing && currentCategory._id) {
        const updated = await articleService.updateHealthCategory(currentCategory._id, currentCategory)
        setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
        toast.success('Cập nhật thành công')
      } else {
        const created = await articleService.createHealthCategory(currentCategory)
        setCategories((prev) => [...prev, created])
        toast.success('Tạo danh mục thành công')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Có lỗi xảy ra', { description: 'Không thể lưu danh mục' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin text-[#1E40AF]' />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-blue-900 font-medium'>Danh mục sức khỏe</h3>
        <Button
          onClick={handleOpenCreate}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
        >
          <Plus className='w-4 h-4 mr-2' />
          Thêm danh mục
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {categories.map((category) => (
          <Card key={category._id} className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-start mb-2'>
                <div className='flex items-center gap-2'>
                  <Tag className='w-4 h-4 text-[#1E40AF]' />
                  <h4 className='font-semibold text-gray-900'>{category.name}</h4>
                </div>
                <Badge
                  variant={category.isActive ? 'default' : 'secondary'}
                  className={category.isActive ? 'bg-green-100 text-green-800' : ''}
                >
                  {category.isActive ? 'Hoạt động' : 'Ẩn'}
                </Badge>
              </div>
              <p className='text-sm text-gray-600 mb-3 line-clamp-2 h-10'>{category.description || 'Chưa có mô tả'}</p>
              <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
                <span>Slug: {category.slug}</span>
                <span>{category.articleCount || 0} bài viết</span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 border-[#BFDBFE] hover:bg-[#F0F6FF] text-[#1E40AF]'
                  onClick={() => handleOpenEdit(category)}
                >
                  <Edit className='w-3 h-3 mr-1' />
                  Sửa
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-red-200 hover:bg-red-50 text-red-600'
                  onClick={() => handleDelete(category._id)}
                >
                  <Trash2 className='w-3 h-3' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
            <DialogDescription>Nhập thông tin danh mục bài viết sức khỏe</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên danh mục *</Label>
              <Input
                id='name'
                value={currentCategory.name || ''}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                placeholder='Ví dụ: Bệnh tim mạch'
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Mô tả</Label>
              <Textarea
                id='description'
                value={currentCategory.description || ''}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                placeholder='Mô tả ngắn về danh mục...'
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='icon'>Icon (Lucide name)</Label>
              <Input
                id='icon'
                value={currentCategory.icon || ''}
                onChange={(e) => setCurrentCategory({ ...currentCategory, icon: e.target.value })}
                placeholder='VD: Heart, Brain, Stethoscope'
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Switch
                id='isActive'
                checked={currentCategory.isActive}
                onCheckedChange={(checked) => setCurrentCategory({ ...currentCategory, isActive: checked })}
              />
              <Label htmlFor='isActive'>Hiển thị danh mục</Label>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type='submit' disabled={saving}>
                {saving && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {isEditing ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
