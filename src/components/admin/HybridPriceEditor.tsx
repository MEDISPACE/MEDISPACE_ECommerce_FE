import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

// Available unit options
const UNIT_OPTIONS = [
  'Viên',
  'Vỉ',
  'Hộp',
  'Tuýp',
  'Chai',
  'Lọ',
  'Gói',
  'Ống',
  'Miếng',
  'Túi',
  'Bình',
  'Thỏi',
  'Que',
  'Cuộn',
  'Khác',
]

export interface PriceVariant {
  unit: string
  price: number
  originalPrice?: number
  costPrice?: number
  isDefault: boolean
  quantityPerUnit?: number // Số lượng đơn vị nhỏ nhất trong 1 đơn vị này
}

interface HybridPriceEditorProps {
  variants: PriceVariant[]
  onChange: (variants: PriceVariant[]) => void
  disabled?: boolean
}

interface EditingVariant extends PriceVariant {
  index?: number
}

export function HybridPriceEditor({ variants = [], onChange, disabled = false }: HybridPriceEditorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingVariant, setEditingVariant] = useState<EditingVariant | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
  }

  // Validate variant
  const validateVariant = (): boolean => {
    if (!editingVariant) return false

    const newErrors: Record<string, string> = {}

    if (!editingVariant.unit) {
      newErrors.unit = 'Vui lòng chọn đơn vị'
    } else if (editingVariant.index === undefined && variants.some((v) => v.unit === editingVariant.unit)) {
      newErrors.unit = 'Đơn vị này đã tồn tại'
    }

    if (!editingVariant.price || editingVariant.price <= 0) {
      newErrors.price = 'Giá bán phải lớn hơn 0'
    }

    if (editingVariant.originalPrice && editingVariant.originalPrice < editingVariant.price) {
      newErrors.originalPrice = 'Giá gốc phải >= giá bán'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Open add dialog
  const handleAdd = () => {
    setEditingVariant({
      unit: '',
      price: 0,
      originalPrice: undefined,
      costPrice: undefined,
      isDefault: variants.length === 0, // First variant is default
    })
    setErrors({})
    setShowDialog(true)
  }

  // Open edit dialog
  const handleEdit = (index: number) => {
    setEditingVariant({
      ...variants[index],
      index,
    })
    setErrors({})
    setShowDialog(true)
  }

  // Delete variant
  const handleDelete = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index)

    // If deleted was default, set first as default
    if (variants[index].isDefault && newVariants.length > 0) {
      newVariants[0].isDefault = true
    }

    onChange(newVariants)
  }

  // Save variant
  const handleSave = () => {
    if (!validateVariant() || !editingVariant) return

    let newVariants = [...variants]

    // If setting as default, remove default from others
    if (editingVariant.isDefault) {
      newVariants = newVariants.map((v) => ({ ...v, isDefault: false }))
    }

    const variantToSave: PriceVariant = {
      unit: editingVariant.unit,
      price: editingVariant.price,
      originalPrice: editingVariant.originalPrice || undefined,
      costPrice: editingVariant.costPrice || undefined,
      isDefault: editingVariant.isDefault,
      quantityPerUnit: editingVariant.quantityPerUnit || undefined,
    }

    if (editingVariant.index !== undefined) {
      // Update existing
      newVariants[editingVariant.index] = variantToSave
    } else {
      // Add new
      newVariants.push(variantToSave)
    }

    // Ensure at least one default
    if (!newVariants.some((v) => v.isDefault) && newVariants.length > 0) {
      newVariants[0].isDefault = true
    }

    onChange(newVariants)
    setShowDialog(false)
    setEditingVariant(null)
  }

  // Toggle default
  const handleSetDefault = (index: number) => {
    const newVariants = variants.map((v, i) => ({
      ...v,
      isDefault: i === index,
    }))
    onChange(newVariants)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>Đơn vị & Giá</Label>
        <Button type='button' variant='outline' size='sm' onClick={handleAdd} disabled={disabled} className='gap-1'>
          <Plus className='w-4 h-4' />
          Thêm đơn vị
        </Button>
      </div>

      {/* Validation warning */}
      {variants.length === 0 && (
        <div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm'>
          <AlertCircle className='w-4 h-4 flex-shrink-0' />
          <span>Cần ít nhất 1 đơn vị và giá</span>
        </div>
      )}

      {/* Variants table */}
      {variants.length > 0 && (
        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow className='bg-[#F0F6FF]/50'>
                  <TableHead className='w-[120px]'>Đơn vị</TableHead>
                  <TableHead className='text-right'>Giá bán</TableHead>
                  <TableHead className='text-right'>Giá gốc</TableHead>
                  <TableHead className='text-center'>Quy đổi</TableHead>
                  <TableHead className='w-[80px] text-center'>Mặc định</TableHead>
                  <TableHead className='w-[100px] text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={index} className={variant.isDefault ? 'bg-[#F0F6FF]/30' : ''}>
                    <TableCell className='font-medium'>
                      {variant.unit}
                      {variant.isDefault && (
                        <Badge variant='secondary' className='ml-2 text-xs'>
                          Mặc định
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right font-semibold text-[#1E40AF]'>
                      {formatCurrency(variant.price)}
                    </TableCell>
                    <TableCell className='text-right text-gray-500'>
                      {variant.originalPrice ? (
                        <span className='line-through'>{formatCurrency(variant.originalPrice)}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className='text-center text-sm text-gray-600'>
                      {variant.quantityPerUnit ? <span>= {variant.quantityPerUnit} đvnn</span> : '-'}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Switch
                        checked={variant.isDefault}
                        onCheckedChange={() => handleSetDefault(index)}
                        disabled={disabled || variant.isDefault}
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(index)}
                          disabled={disabled}
                        >
                          <Edit2 className='w-4 h-4' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(index)}
                          disabled={disabled || variants.length === 1}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editingVariant?.index !== undefined ? 'Sửa đơn vị' : 'Thêm đơn vị'}</DialogTitle>
            <DialogDescription>Nhập thông tin đơn vị và giá cho sản phẩm</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Unit select */}
            <div className='space-y-2'>
              <Label>Đơn vị *</Label>
              <Select
                value={editingVariant?.unit}
                onValueChange={(value) => setEditingVariant((prev) => (prev ? { ...prev, unit: value } : null))}
                disabled={editingVariant?.index !== undefined}
              >
                <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                  <SelectValue placeholder='Chọn đơn vị' />
                </SelectTrigger>
                <SelectContent className='max-h-[300px] overflow-y-auto'>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem
                      key={unit}
                      value={unit}
                      disabled={editingVariant?.index === undefined && variants.some((v) => v.unit === unit)}
                    >
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && <p className='text-sm text-red-500'>{errors.unit}</p>}
            </div>

            {/* Price input */}
            <div className='space-y-2'>
              <Label>Giá bán (VNĐ) *</Label>
              <Input
                type='number'
                min={0}
                value={editingVariant?.price || ''}
                onChange={(e) =>
                  setEditingVariant((prev) => (prev ? { ...prev, price: Number(e.target.value) } : null))
                }
                placeholder='Nhập giá bán'
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className='text-sm text-red-500'>{errors.price}</p>}
            </div>

            {/* Original price input */}
            <div className='space-y-2'>
              <Label>Giá gốc (trước giảm giá)</Label>
              <Input
                type='number'
                min={0}
                value={editingVariant?.originalPrice || ''}
                onChange={(e) =>
                  setEditingVariant((prev) =>
                    prev ? { ...prev, originalPrice: Number(e.target.value) || undefined } : null,
                  )
                }
                placeholder='Nhập giá gốc (nếu có)'
                className={errors.originalPrice ? 'border-red-500' : ''}
              />
              {errors.originalPrice && <p className='text-sm text-red-500'>{errors.originalPrice}</p>}
            </div>

            {/* Cost price input */}
            <div className='space-y-2'>
              <Label>Giá vốn</Label>
              <Input
                type='number'
                min={0}
                value={editingVariant?.costPrice || ''}
                onChange={(e) =>
                  setEditingVariant((prev) =>
                    prev ? { ...prev, costPrice: Number(e.target.value) || undefined } : null,
                  )
                }
                placeholder='Nhập giá vốn (nếu có)'
              />
            </div>

            {/* Quantity per unit input */}
            <div className='space-y-2'>
              <Label>Số lượng đơn vị nhỏ nhất</Label>
              <Input
                type='number'
                min={1}
                value={editingVariant?.quantityPerUnit || ''}
                onChange={(e) =>
                  setEditingVariant((prev) =>
                    prev ? { ...prev, quantityPerUnit: Number(e.target.value) || undefined } : null,
                  )
                }
                placeholder='VD: 1 Hộp = 100 Viên'
              />
              <p className='text-xs text-gray-500'>Dùng để quy đổi tồn kho. VD: Hộp chứa 100 viên thì nhập 100</p>
            </div>

            {/* Is default toggle */}
            <div className='flex items-center justify-between'>
              <Label>Đơn vị mặc định</Label>
              <Switch
                checked={editingVariant?.isDefault || false}
                onCheckedChange={(checked) =>
                  setEditingVariant((prev) => (prev ? { ...prev, isDefault: checked } : null))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setShowDialog(false)}>
              <X className='w-4 h-4 mr-1' />
              Hủy
            </Button>
            <Button type='button' onClick={handleSave} className='bg-[#0A2463] hover:bg-[#071A49]'>
              <Check className='w-4 h-4 mr-1' />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
