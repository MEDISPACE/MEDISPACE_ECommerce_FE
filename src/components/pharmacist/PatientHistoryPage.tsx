import { useState } from 'react'
import { Search, User, FileText, Pill, ShoppingCart, AlertTriangle, TrendingUp, Eye } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

interface Patient {
  id: string
  name: string
  phone: string
  email: string
  avatar?: string
  dateOfBirth: string
  gender: string
  address: string
  allergies: string[]
  chronicDiseases: string[]
  prescriptions: PatientPrescription[]
  orders: PatientOrder[]
  consultations: number
  lastVisit: string
}

interface PatientPrescription {
  id: string
  date: string
  doctorName: string
  diagnosis: string
  medications: { name: string; dosage: string; duration: string }[]
  status: string
}

interface PatientOrder {
  id: string
  date: string
  total: number
  status: string
  items: number
}

const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    dateOfBirth: '1985-05-15',
    gender: 'Nam',
    address: '123 Nguyễn Văn Linh, Q7, TP.HCM',
    allergies: ['Penicillin', 'Aspirin'],
    chronicDiseases: ['Tăng huyết áp', 'Đái tháo đường type 2'],
    prescriptions: [
      {
        id: 'RX001',
        date: '2025-01-15',
        doctorName: 'BS. Nguyễn Thị B',
        diagnosis: 'Viêm họng cấp',
        medications: [
          { name: 'Augmentin 500mg', dosage: '2 viên/ngày', duration: '7 ngày' },
          { name: 'Paracetamol 500mg', dosage: '3 viên/ngày', duration: '5 ngày' },
        ],
        status: 'Đã duyệt',
      },
      {
        id: 'RX002',
        date: '2025-01-10',
        doctorName: 'BS. Lê Văn C',
        diagnosis: 'Kiểm tra định kỳ đái tháo đường',
        medications: [
          { name: 'Metformin 500mg', dosage: '2 viên/ngày', duration: '30 ngày' },
          { name: 'Glimepiride 2mg', dosage: '1 viên/ngày', duration: '30 ngày' },
        ],
        status: 'Hoàn thành',
      },
    ],
    orders: [
      { id: 'DH001', date: '2025-01-15', total: 450000, status: 'Đang giao', items: 3 },
      { id: 'DH002', date: '2025-01-10', total: 680000, status: 'Hoàn thành', items: 4 },
    ],
    consultations: 8,
    lastVisit: '2025-01-15',
  },
  {
    id: 'P002',
    name: 'Trần Thị D',
    phone: '0987654321',
    email: 'tranthid@email.com',
    dateOfBirth: '1990-08-20',
    gender: 'Nữ',
    address: '456 Lê Lợi, Q1, TP.HCM',
    allergies: [],
    chronicDiseases: ['Dạ dày'],
    prescriptions: [
      {
        id: 'RX003',
        date: '2025-01-14',
        doctorName: 'BS. Phạm Văn E',
        diagnosis: 'Đau dạ dày',
        medications: [{ name: 'Omeprazole 20mg', dosage: '1 viên/ngày', duration: '14 ngày' }],
        status: 'Đã duyệt',
      },
    ],
    orders: [{ id: 'DH003', date: '2025-01-14', total: 320000, status: 'Hoàn thành', items: 2 }],
    consultations: 3,
    lastVisit: '2025-01-14',
  },
]

export function PatientHistoryPage() {
  const [patients] = useState<Patient[]>(mockPatients)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Filter patients
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate age
  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
            Lịch sử bệnh nhân
          </h1>
          <p className='text-gray-600 mt-1'>Xem lịch sử điều trị và đơn thuốc của bệnh nhân</p>
        </div>

        {/* Search */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Tìm bệnh nhân theo tên, SĐT, email...'
              className='pl-10 border-2 border-blue-200 focus:border-blue-500'
            />
          </div>
        </div>

        {/* Patient List */}
        <div className='grid md:grid-cols-2 gap-6'>
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all'
            >
              <CardContent className='p-6'>
                <div className='flex items-start gap-4 mb-4'>
                  <Avatar className='w-16 h-16'>
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <h3 className='text-blue-900 mb-1'>{patient.name}</h3>
                    <div className='space-y-1 text-sm text-gray-600'>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        {calculateAge(patient.dateOfBirth)} tuổi • {patient.gender}
                      </div>
                      <div className='flex items-center gap-2'>
                        <FileText className='w-4 h-4' />
                        {patient.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className='my-4' />

                <div className='grid grid-cols-3 gap-4 mb-4'>
                  <div className='text-center p-3 bg-blue-50 rounded-lg'>
                    <FileText className='w-5 h-5 mx-auto text-blue-600 mb-1' />
                    <p className='text-xs text-gray-600'>Đơn thuốc</p>
                    <p className='text-blue-900'>{patient.prescriptions.length}</p>
                  </div>
                  <div className='text-center p-3 bg-green-50 rounded-lg'>
                    <ShoppingCart className='w-5 h-5 mx-auto text-green-600 mb-1' />
                    <p className='text-xs text-gray-600'>Đơn hàng</p>
                    <p className='text-green-900'>{patient.orders.length}</p>
                  </div>
                  <div className='text-center p-3 bg-purple-50 rounded-lg'>
                    <TrendingUp className='w-5 h-5 mx-auto text-purple-600 mb-1' />
                    <p className='text-xs text-gray-600'>Tư vấn</p>
                    <p className='text-purple-900'>{patient.consultations}</p>
                  </div>
                </div>

                {patient.allergies.length > 0 && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertTriangle className='w-4 h-4 text-red-600' />
                      <span className='text-sm text-red-800'>Dị ứng:</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {patient.allergies.map((allergy, idx) => (
                        <Badge key={idx} className='bg-red-100 text-red-800 border-red-200'>
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {patient.chronicDiseases.length > 0 && (
                  <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertTriangle className='w-4 h-4 text-yellow-600' />
                      <span className='text-sm text-yellow-800'>Bệnh mạn tính:</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {patient.chronicDiseases.map((disease, idx) => (
                        <Badge key={idx} className='bg-yellow-100 text-yellow-800 border-yellow-200'>
                          {disease}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setSelectedPatient(patient)}
                  className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Eye className='w-4 h-4 mr-2' />
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Hồ sơ bệnh nhân: {selectedPatient.name}</DialogTitle>
                <DialogDescription>Xem đầy đủ lịch sử điều trị, đơn thuốc và đơn hàng</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue='info' className='space-y-4'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='info'>Thông tin</TabsTrigger>
                  <TabsTrigger value='prescriptions'>Đơn thuốc</TabsTrigger>
                  <TabsTrigger value='orders'>Đơn hàng</TabsTrigger>
                  <TabsTrigger value='medical'>Y tế</TabsTrigger>
                </TabsList>

                <TabsContent value='info' className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm text-gray-600'>Ngày sinh</label>
                      <p className='text-gray-900'>
                        {new Date(selectedPatient.dateOfBirth).toLocaleDateString('vi-VN')} (
                        {calculateAge(selectedPatient.dateOfBirth)} tuổi)
                      </p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Giới tính</label>
                      <p className='text-gray-900'>{selectedPatient.gender}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Số điện thoại</label>
                      <p className='text-gray-900'>{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Email</label>
                      <p className='text-gray-900'>{selectedPatient.email}</p>
                    </div>
                    <div className='md:col-span-2'>
                      <label className='text-sm text-gray-600'>Địa chỉ</label>
                      <p className='text-gray-900'>{selectedPatient.address}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='prescriptions' className='space-y-4'>
                  {selectedPatient.prescriptions.map((rx) => (
                    <Card key={rx.id} className='border border-blue-200'>
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between mb-3'>
                          <div>
                            <h4 className='text-blue-900'>#{rx.id}</h4>
                            <p className='text-sm text-gray-600'>{new Date(rx.date).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <Badge
                            className={
                              rx.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {rx.status}
                          </Badge>
                        </div>
                        <div className='space-y-2 text-sm'>
                          <p>
                            <strong>Bác sĩ:</strong> {rx.doctorName}
                          </p>
                          <p>
                            <strong>Chẩn đoán:</strong> {rx.diagnosis}
                          </p>
                          <div>
                            <strong>Thuốc kê đơn:</strong>
                            <ul className='mt-2 space-y-1'>
                              {rx.medications.map((med, idx) => (
                                <li key={idx} className='flex items-start gap-2 p-2 bg-blue-50 rounded'>
                                  <Pill className='w-4 h-4 text-blue-600 mt-0.5' />
                                  <div>
                                    <p className='font-medium'>{med.name}</p>
                                    <p className='text-xs text-gray-600'>
                                      {med.dosage} - {med.duration}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value='orders' className='space-y-4'>
                  {selectedPatient.orders.map((order) => (
                    <Card key={order.id} className='border border-green-200'>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h4 className='text-green-900'>#{order.id}</h4>
                            <p className='text-sm text-gray-600'>{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className='text-right'>
                            <p className='text-green-900'>{order.total.toLocaleString()}₫</p>
                            <Badge
                              className={
                                order.status === 'Hoàn thành'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value='medical' className='space-y-4'>
                  {selectedPatient.allergies.length > 0 && (
                    <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                      <h4 className='text-red-900 mb-3 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Dị ứng thuốc
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedPatient.allergies.map((allergy, idx) => (
                          <Badge key={idx} className='bg-red-500 text-white'>
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.chronicDiseases.length > 0 && (
                    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <h4 className='text-yellow-900 mb-3 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Bệnh mạn tính
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedPatient.chronicDiseases.map((disease, idx) => (
                          <Badge key={idx} className='bg-yellow-500 text-white'>
                            {disease}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h4 className='text-blue-900 mb-3'>Thống kê</h4>
                    <div className='space-y-2 text-sm'>
                      <p>
                        <strong>Tổng số đơn thuốc:</strong> {selectedPatient.prescriptions.length}
                      </p>
                      <p>
                        <strong>Tổng số đơn hàng:</strong> {selectedPatient.orders.length}
                      </p>
                      <p>
                        <strong>Số lần tư vấn:</strong> {selectedPatient.consultations}
                      </p>
                      <p>
                        <strong>Lần khám gần nhất:</strong>{' '}
                        {new Date(selectedPatient.lastVisit).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    
  )
}
