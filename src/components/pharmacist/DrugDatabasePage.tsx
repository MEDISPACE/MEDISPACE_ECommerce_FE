import { useState } from 'react'
import { Search, Pill, AlertTriangle, Info, BookOpen, Tag, ChevronRight } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Separator } from '../ui/separator'

interface Drug {
  id: string
  name: string
  genericName: string
  category: string
  type: 'Rx' | 'OTC'
  manufacturer: string
  activeIngredient: string
  strength: string
  form: string
  indication: string[]
  dosage: string
  sideEffects: string[]
  contraindications: string[]
  interactions: string[]
  pregnancy: string
  storage: string
  price: number
}

const mockDrugs: Drug[] = [
  {
    id: 'D001',
    name: 'Augmentin 500mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'Kháng sinh',
    type: 'Rx',
    manufacturer: 'GlaxoSmithKline',
    activeIngredient: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    strength: '500mg/125mg',
    form: 'Viên nén bao phim',
    indication: ['Nhiễm khuẩn đường hô hấp', 'Nhiễm khuẩn đường tiết niệu', 'Nhiễm khuẩn da và mô mềm'],
    dosage: 'Người lớn: 1 viên x 2-3 lần/ngày, uống sau ăn',
    sideEffects: ['Tiêu chảy', 'Buồn nôn', 'Nôn', 'Phát ban da'],
    contraindications: ['Dị ứng Penicillin', 'Suy gan nặng'],
    interactions: ['Warfarin', 'Methotrexate', 'Allopurinol'],
    pregnancy: 'B - An toàn cho thai nhi',
    storage: 'Nhiệt độ dưới 30°C, tránh ánh sáng trực tiếp',
    price: 12000,
  },
  {
    id: 'D002',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    category: 'Giảm đau, hạ sốt',
    type: 'OTC',
    manufacturer: 'Pymepharco',
    activeIngredient: 'Paracetamol 500mg',
    strength: '500mg',
    form: 'Viên nén',
    indication: ['Giảm đau nhẹ đến trung bình', 'Hạ sốt'],
    dosage: 'Người lớn: 1-2 viên x 3-4 lần/ngày, cách 4-6 giờ',
    sideEffects: ['Hiếm gặp: Phát ban', 'Quá liều: Tổn thương gan'],
    contraindications: ['Suy gan', 'Suy thận nặng', 'Nghiện rượu'],
    interactions: ['Warfarin', 'Isoniazid', 'Carbamazepine'],
    pregnancy: 'A - An toàn',
    storage: 'Nhiệt độ dưới 30°C, nơi khô ráo',
    price: 2000,
  },
  {
    id: 'D003',
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Thuốc đái tháo đường',
    type: 'Rx',
    manufacturer: 'Sanofi',
    activeIngredient: 'Metformin HCl 500mg',
    strength: '500mg',
    form: 'Viên nén bao phim',
    indication: ['Đái tháo đường type 2'],
    dosage: 'Liều khởi đầu: 500mg x 2 lần/ngày, uống cùng bữa ăn',
    sideEffects: ['Tiêu chảy', 'Buồn nôn', 'Đầy hơi', 'Đau bụng'],
    contraindications: ['Suy thận', 'Suy tim', 'Nhiễm toan lactic'],
    interactions: ['Cimetidine', 'Furosemide', 'Nifedipine'],
    pregnancy: 'B - Cân nhắc lợi ích/nguy cơ',
    storage: 'Nhiệt độ 15-30°C, tránh ẩm',
    price: 1500,
  },
  {
    id: 'D004',
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    category: 'Thuốc tim mạch',
    type: 'Rx',
    manufacturer: 'Pfizer',
    activeIngredient: 'Amlodipine Besylate 5mg',
    strength: '5mg',
    form: 'Viên nén',
    indication: ['Tăng huyết áp', 'Đau thắt ngực ổn định'],
    dosage: '5mg x 1 lần/ngày, có thể tăng lên 10mg',
    sideEffects: ['Phù mắt cá chân', 'Đau đầu', 'Mệt mỏi', 'Đỏ mặt'],
    contraindications: ['Sốc tim', 'Hẹp động mạch chủ nặng'],
    interactions: ['Simvastatin', 'Diltiazem', 'Ketoconazole'],
    pregnancy: 'C - Chỉ dùng khi thật cần thiết',
    storage: 'Nhiệt độ 15-30°C',
    price: 3000,
  },
  {
    id: 'D005',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Thuốc tiêu hóa',
    type: 'Rx',
    manufacturer: 'AstraZeneca',
    activeIngredient: 'Omeprazole 20mg',
    strength: '20mg',
    form: 'Viên nang',
    indication: ['Loét dạ dày - tá tràng', 'Trào ngược dạ dày thực quản', 'Hội chứng Zollinger-Ellison'],
    dosage: '20mg x 1 lần/ngày buổi sáng, uống trước ăn 30 phút',
    sideEffects: ['Đau đầu', 'Tiêu chảy', 'Đau bụng', 'Buồn nôn'],
    contraindications: ['Dị ứng với omeprazole'],
    interactions: ['Clopidogrel', 'Warfarin', 'Diazepam'],
    pregnancy: 'C - Cân nhắc lợi ích/nguy cơ',
    storage: 'Nhiệt độ dưới 25°C, tránh ẩm',
    price: 4500,
  },
]

export function DrugDatabasePage() {
  const [drugs] = useState<Drug[]>(mockDrugs)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)

  // Filter drugs
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter
    const matchesType = typeFilter === 'all' || drug.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  // Get unique categories
  const categories = Array.from(new Set(drugs.map((d) => d.category)))

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
            Cơ sở dữ liệu thuốc
          </h1>
          <p className='text-gray-600 mt-1'>Tra cứu thông tin chi tiết về thuốc, tương tác và chỉ định</p>
        </div>

        {/* Search & Filters */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Tìm theo tên thuốc, hoạt chất, nhà sản xuất...'
                  className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-48 border-2 border-blue-200 focus:border-blue-500'>
                <SelectValue placeholder='Danh mục' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-32 border-2 border-blue-200 focus:border-blue-500'>
                <SelectValue placeholder='Loại' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='Rx'>Rx - Kê đơn</SelectItem>
                <SelectItem value='OTC'>OTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Drug List */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredDrugs.length === 0 ? (
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 md:col-span-2 lg:col-span-3'>
              <CardContent className='p-12 text-center'>
                <Pill className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy thuốc</h3>
                <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </CardContent>
            </Card>
          ) : (
            filteredDrugs.map((drug) => (
              <Card
                key={drug.id}
                className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all'
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='text-blue-900 mb-1'>{drug.name}</h3>
                      <p className='text-sm text-gray-600'>{drug.genericName}</p>
                    </div>
                    <Badge className={drug.type === 'Rx' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                      {drug.type}
                    </Badge>
                  </div>

                  <Separator className='my-3' />

                  <div className='space-y-2 text-sm mb-4'>
                    <div className='flex items-center gap-2'>
                      <Tag className='w-4 h-4 text-blue-600' />
                      <span className='text-gray-600'>Danh mục:</span>
                      <span className='text-gray-900'>{drug.category}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Pill className='w-4 h-4 text-green-600' />
                      <span className='text-gray-600'>Hàm lượng:</span>
                      <span className='text-gray-900'>{drug.strength}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <BookOpen className='w-4 h-4 text-purple-600' />
                      <span className='text-gray-600'>Dạng bào chế:</span>
                      <span className='text-gray-900'>{drug.form}</span>
                    </div>
                  </div>

                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
                    <p className='text-xs text-blue-800 mb-1'>Giá tham khảo:</p>
                    <p className='text-blue-900'>
                      {drug.price.toLocaleString()}₫ / {drug.form.includes('viên') ? 'viên' : 'đơn vị'}
                    </p>
                  </div>

                  <Button
                    onClick={() => setSelectedDrug(drug)}
                    className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                  >
                    <Info className='w-4 h-4 mr-2' />
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Drug Detail Modal */}
        {selectedDrug && (
          <Dialog open={!!selectedDrug} onOpenChange={() => setSelectedDrug(null)}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-3'>
                  <span>{selectedDrug.name}</span>
                  <Badge className={selectedDrug.type === 'Rx' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                    {selectedDrug.type}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedDrug.genericName}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue='info' className='space-y-4'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='info'>Thông tin</TabsTrigger>
                  <TabsTrigger value='usage'>Cách dùng</TabsTrigger>
                  <TabsTrigger value='warnings'>Cảnh báo</TabsTrigger>
                  <TabsTrigger value='interactions'>Tương tác</TabsTrigger>
                </TabsList>

                <TabsContent value='info' className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm text-gray-600'>Hoạt chất</label>
                      <p className='text-gray-900'>{selectedDrug.activeIngredient}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Hàm lượng</label>
                      <p className='text-gray-900'>{selectedDrug.strength}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Dạng bào chế</label>
                      <p className='text-gray-900'>{selectedDrug.form}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Nhà sản xuất</label>
                      <p className='text-gray-900'>{selectedDrug.manufacturer}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Danh mục</label>
                      <p className='text-gray-900'>{selectedDrug.category}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Giá</label>
                      <p className='text-green-600'>{selectedDrug.price.toLocaleString()}₫</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className='text-sm text-gray-600 mb-2 block'>Chỉ định</label>
                    <ul className='space-y-1'>
                      {selectedDrug.indication.map((ind, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <ChevronRight className='w-4 h-4 text-blue-600 mt-0.5' />
                          <span className='text-gray-900'>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <label className='text-sm text-blue-800 mb-2 block'>Bảo quản</label>
                    <p className='text-gray-900'>{selectedDrug.storage}</p>
                  </div>
                </TabsContent>

                <TabsContent value='usage' className='space-y-4'>
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <label className='text-sm text-green-800 mb-2 block flex items-center gap-2'>
                      <Pill className='w-4 h-4' />
                      Liều dùng
                    </label>
                    <p className='text-gray-900'>{selectedDrug.dosage}</p>
                  </div>

                  <div className='p-4 bg-purple-50 border border-purple-200 rounded-lg'>
                    <label className='text-sm text-purple-800 mb-2 block'>Thai kỳ</label>
                    <p className='text-gray-900'>{selectedDrug.pregnancy}</p>
                  </div>
                </TabsContent>

                <TabsContent value='warnings' className='space-y-4'>
                  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <label className='text-sm text-yellow-800 mb-3 block flex items-center gap-2'>
                      <AlertTriangle className='w-4 h-4' />
                      Tác dụng phụ
                    </label>
                    <ul className='space-y-1'>
                      {selectedDrug.sideEffects.map((effect, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <ChevronRight className='w-4 h-4 text-yellow-600 mt-0.5' />
                          <span className='text-gray-900'>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <label className='text-sm text-red-800 mb-3 block flex items-center gap-2'>
                      <AlertTriangle className='w-4 h-4' />
                      Chống chỉ định
                    </label>
                    <ul className='space-y-1'>
                      {selectedDrug.contraindications.map((contra, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <ChevronRight className='w-4 h-4 text-red-600 mt-0.5' />
                          <span className='text-gray-900'>{contra}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value='interactions' className='space-y-4'>
                  <div className='p-4 bg-orange-50 border border-orange-200 rounded-lg'>
                    <label className='text-sm text-orange-800 mb-3 block flex items-center gap-2'>
                      <AlertTriangle className='w-4 h-4' />
                      Tương tác thuốc
                    </label>
                    <p className='text-sm text-gray-700 mb-3'>
                      Các thuốc sau có thể tương tác với {selectedDrug.name}:
                    </p>
                    <ul className='space-y-2'>
                      {selectedDrug.interactions.map((inter, idx) => (
                        <li key={idx} className='flex items-start gap-2 p-2 bg-white border border-orange-200 rounded'>
                          <AlertTriangle className='w-4 h-4 text-orange-600 mt-0.5' />
                          <span className='text-gray-900'>{inter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    
  )
}
