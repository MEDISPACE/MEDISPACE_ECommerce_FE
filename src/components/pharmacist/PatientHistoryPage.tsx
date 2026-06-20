import { useState, useEffect } from 'react'
import { Search, User, FileText, Pill, ShoppingCart, AlertTriangle, TrendingUp, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { dashboardService, patientService } from '~/services/pharmacist'
import type { PatientSearchResult, MedicalInfo, PatientNote } from '~/services/pharmacist/types'

// Removed mockPatients - using real API data
const removedMockPatients = [
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null)
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // Search patients by phone
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }

    try {
      setSearching(true)
      const results = await dashboardService.searchPatient(searchQuery)
      setSearchResults(results)

      if (results.length === 0) {
        toast.info('Không tìm thấy bệnh nhân')
      }
    } catch (error) {
      toast.error('Lỗi tìm kiếm bệnh nhân')
    } finally {
      setSearching(false)
    }
  }

  // Load patient details when selected
  const handleSelectPatient = async (patient: PatientSearchResult) => {
    try {
      setLoading(true)
      setSelectedPatient(patient)

      // Load medical info and notes in parallel
      const [medicalData, notesData] = await Promise.all([
        patientService.getMedicalInfo(patient.customerId),
        patientService.getNotes(patient.customerId),
      ])

      setMedicalInfo(medicalData as unknown as MedicalInfo)
      setPatientNotes(notesData)
    } catch (error) {
      toast.error('Lỗi tải thông tin bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

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
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <h1 className='bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] bg-clip-text text-transparent'>
          Lịch sử bệnh nhân
        </h1>
        <p className='text-gray-600 mt-1'>Xem lịch sử điều trị và đơn thuốc của bệnh nhân</p>
      </div>

      {/* Search */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4'>
        <div className='flex gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder='Nhập số điện thoại bệnh nhân...'
              className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} className='bg-[#0A2463] hover:bg-[#071A49]'>
            {searching ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang tìm...
              </>
            ) : (
              <>
                <Search className='w-4 h-4 mr-2' />
                Tìm kiếm
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4'>
          <h3 className='font-semibold mb-3'>Kết quả tìm kiếm ({searchResults.length})</h3>
          <div className='space-y-2'>
            {searchResults.map((patient) => (
              <Card
                key={patient.customerId}
                className='cursor-pointer hover:shadow-md transition-shadow'
                onClick={() => handleSelectPatient(patient)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>{patient.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{patient.fullName}</p>
                        <p className='text-sm text-gray-600'>{patient.phoneNumber}</p>
                      </div>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <Eye className='w-4 h-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Old mock patient list removed - search results now show above */}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Hồ sơ bệnh nhân: {selectedPatient.fullName}</DialogTitle>
              <DialogDescription>Xem đầy đủ lịch sử điều trị và thông tin y tế</DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-[#1E40AF]' />
              </div>
            ) : (
              <Tabs defaultValue='info' className='space-y-4'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='info'>Thông tin</TabsTrigger>
                  <TabsTrigger value='medical'>Y tế</TabsTrigger>
                  <TabsTrigger value='notes'>Ghi chú</TabsTrigger>
                </TabsList>

                <TabsContent value='info' className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm text-gray-600'>Họ và tên</label>
                      <p className='text-gray-900'>{selectedPatient.fullName}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Số điện thoại</label>
                      <p className='text-gray-900'>{selectedPatient.phoneNumber}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Email</label>
                      <p className='text-gray-900'>{selectedPatient.email || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className='text-sm text-gray-600'>Mã khách hàng</label>
                      <p className='text-gray-900'>{selectedPatient.customerId}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='medical' className='space-y-4'>
                  {medicalInfo ? (
                    <>
                      {/* Allergies */}
                      {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
                        <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                          <div className='flex items-center gap-2 mb-3'>
                            <AlertTriangle className='w-5 h-5 text-red-600' />
                            <h4 className='font-semibold text-red-800'>Dị ứng</h4>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {medicalInfo.allergies.map((allergy, idx) => (
                              <Badge key={idx} className='bg-red-100 text-red-800 border-red-200'>
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Medications */}
                      {medicalInfo.currentMedications && medicalInfo.currentMedications.length > 0 && (
                        <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg'>
                          <div className='flex items-center gap-2 mb-3'>
                            <Pill className='w-5 h-5 text-[#1E40AF]' />
                            <h4 className='font-semibold text-blue-800'>Thuốc đang dùng</h4>
                          </div>
                          <ul className='space-y-2'>
                            {medicalInfo.currentMedications.map((med, idx) => (
                              <li key={idx} className='text-sm text-gray-700'>
                                • {med}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Medical Conditions */}
                      {medicalInfo.medicalConditions && medicalInfo.medicalConditions.length > 0 && (
                        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                          <div className='flex items-center gap-2 mb-3'>
                            <AlertTriangle className='w-5 h-5 text-yellow-600' />
                            <h4 className='font-semibold text-yellow-800'>Tình trạng y tế</h4>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {medicalInfo.medicalConditions.map((condition, idx) => (
                              <Badge key={idx} className='bg-yellow-100 text-yellow-800 border-yellow-200'>
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className='text-gray-500 text-center py-8'>Chưa có thông tin y tế</p>
                  )}
                </TabsContent>

                <TabsContent value='notes' className='space-y-4'>
                  {patientNotes.length > 0 ? (
                    patientNotes.map((note) => (
                      <Card key={note._id} className='border border-[#BFDBFE]'>
                        <CardContent className='p-4'>
                          <div className='flex justify-between items-start mb-2'>
                            <p className='font-medium text-sm text-gray-600'>
                              {new Date(note.createdAt).toLocaleString('vi-VN')}
                            </p>
                            <Badge variant='outline'>{note.pharmacistId}</Badge>
                          </div>
                          <p className='text-gray-900'>{note.note}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className='text-gray-500 text-center py-8'>Chưa có ghi chú</p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
