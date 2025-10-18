import { useState } from 'react'
import { Save, User, Award, Bell, Clock, MessageSquare, Shield, Briefcase, Phone, Mail, MapPin } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { toast } from 'sonner'

export function PharmacistSettingsPage() {
  const [settings, setSettings] = useState({
    // Personal Info
    fullName: 'Dược sĩ Nguyễn Văn A',
    email: 'pharmacist@medispace.com',
    phone: '0123456789',
    avatar: '',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    address: '123 Đường ABC, Quận 1, TP.HCM',

    // Professional Info
    licenseNumber: 'DS-123456',
    licenseIssueDate: '2015-06-20',
    licenseExpiryDate: '2025-06-20',
    specialization: 'general',
    yearsOfExperience: '8',
    workplace: 'Nhà thuốc MEDISPACE - Chi nhánh Quận 1',

    // Working Hours
    mondayStart: '08:00',
    mondayEnd: '17:00',
    tuesdayStart: '08:00',
    tuesdayEnd: '17:00',
    wednesdayStart: '08:00',
    wednesdayEnd: '17:00',
    thursdayStart: '08:00',
    thursdayEnd: '17:00',
    fridayStart: '08:00',
    fridayEnd: '17:00',
    saturdayStart: '08:00',
    saturdayEnd: '12:00',
    sundayStart: '',
    sundayEnd: '',
    mondayEnabled: true,
    tuesdayEnabled: true,
    wednesdayEnabled: true,
    thursdayEnabled: true,
    fridayEnabled: true,
    saturdayEnabled: true,
    sundayEnabled: false,

    // Consultation Settings
    autoAcceptChats: false,
    maxConcurrentChats: '3',
    averageResponseTime: '5',
    consultationLanguages: ['vi', 'en'],

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    notifyNewPrescription: true,
    notifyNewChat: true,
    notifyOrderReady: true,
    notifyPatientQuestion: true,

    // Privacy & Security
    showProfilePublic: true,
    allowPatientReviews: true,
    twoFactorAuth: false,

    // Bio
    bio: 'Tôi là dược sĩ với hơn 8 năm kinh nghiệm trong lĩnh vực tư vấn và bán lẻ dược phẩm. Chuyên môn về thuốc tim mạch và tiểu đường.',
  })

  const handleSave = (category: string) => {
    toast.success(`Đã lưu cài đặt ${category}`, {
      description: 'Thay đổi của bạn đã được cập nhật thành công',
    })
  }

  const handleChange = (key: string, value: string | boolean) => {
    setSettings({ ...settings, [key]: value })
  }

  const workDays = [
    { key: 'monday', label: 'Thứ 2' },
    { key: 'tuesday', label: 'Thứ 3' },
    { key: 'wednesday', label: 'Thứ 4' },
    { key: 'thursday', label: 'Thứ 5' },
    { key: 'friday', label: 'Thứ 6' },
    { key: 'saturday', label: 'Thứ 7' },
    { key: 'sunday', label: 'Chủ nhật' },
  ]

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <div className='flex items-center gap-4'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'>
              <User className='w-8 h-8 text-white' />
            </div>
            <div className='flex-1'>
              <h1 className='bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                Cài đặt tài khoản
              </h1>
              <p className='text-gray-600 mt-1'>Quản lý thông tin cá nhân, chuyên môn và tùy chọn tư vấn</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue='personal' className='space-y-4'>
          <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
            <TabsList className='grid w-full grid-cols-5 bg-blue-50'>
              <TabsTrigger value='personal' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
                <User className='w-4 h-4 mr-2' />
                Cá nhân
              </TabsTrigger>
              <TabsTrigger
                value='professional'
                className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                <Award className='w-4 h-4 mr-2' />
                Chuyên môn
              </TabsTrigger>
              <TabsTrigger value='schedule' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
                <Clock className='w-4 h-4 mr-2' />
                Lịch làm việc
              </TabsTrigger>
              <TabsTrigger
                value='consultation'
                className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                <MessageSquare className='w-4 h-4 mr-2' />
                Tư vấn
              </TabsTrigger>
              <TabsTrigger
                value='notifications'
                className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                <Bell className='w-4 h-4 mr-2' />
                Thông báo
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value='personal' className='space-y-4 mt-4'>
              <Card className='border-blue-100'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <User className='w-5 h-5' />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-6'>
                  {/* Avatar */}
                  <div className='flex items-center gap-6'>
                    <Avatar className='w-24 h-24 border-4 border-blue-200'>
                      <AvatarImage src={settings.avatar} />
                      <AvatarFallback className='bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl'>
                        {settings.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <Label className='text-gray-700'>Ảnh đại diện</Label>
                      <div className='mt-2 flex gap-2'>
                        <Button variant='outline' size='sm' className='border-2 border-blue-200'>
                          Tải ảnh lên
                        </Button>
                        <Button variant='outline' size='sm' className='border-2 border-red-200 text-red-600'>
                          Xóa ảnh
                        </Button>
                      </div>
                      <p className='text-sm text-gray-500 mt-1'>JPG, PNG. Tối đa 2MB</p>
                    </div>
                  </div>

                  <Separator />

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='fullName' className='text-gray-700'>
                        Họ và tên *
                      </Label>
                      <Input
                        id='fullName'
                        value={settings.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='email' className='text-gray-700'>
                        Email *
                      </Label>
                      <div className='relative'>
                        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='email'
                          type='email'
                          value={settings.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='phone' className='text-gray-700'>
                        Số điện thoại *
                      </Label>
                      <div className='relative'>
                        <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='phone'
                          value={settings.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='dateOfBirth' className='text-gray-700'>
                        Ngày sinh
                      </Label>
                      <Input
                        id='dateOfBirth'
                        type='date'
                        value={settings.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='gender' className='text-gray-700'>
                        Giới tính
                      </Label>
                      <Select value={settings.gender} onValueChange={(value) => handleChange('gender', value)}>
                        <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='male'>Nam</SelectItem>
                          <SelectItem value='female'>Nữ</SelectItem>
                          <SelectItem value='other'>Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='address' className='text-gray-700'>
                      Địa chỉ
                    </Label>
                    <div className='relative'>
                      <MapPin className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                      <Textarea
                        id='address'
                        value={settings.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className='pl-10 border-2 border-blue-200 focus:border-blue-500 min-h-[80px]'
                        placeholder='Nhập địa chỉ đầy đủ'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bio' className='text-gray-700'>
                      Giới thiệu bản thân
                    </Label>
                    <Textarea
                      id='bio'
                      value={settings.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500 min-h-[100px]'
                      placeholder='Chia sẻ về kinh nghiệm và chuyên môn của bạn...'
                    />
                    <p className='text-sm text-gray-500'>{settings.bio.length}/500 ký tự</p>
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='outline' className='border-2 border-gray-200'>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => handleSave('thông tin cá nhân')}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Information */}
            <TabsContent value='professional' className='space-y-4 mt-4'>
              <Card className='border-blue-100'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <Award className='w-5 h-5' />
                    Thông tin chuyên môn
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-6'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='licenseNumber' className='text-gray-700'>
                        Số chứng chỉ hành nghề *
                      </Label>
                      <Input
                        id='licenseNumber'
                        value={settings.licenseNumber}
                        onChange={(e) => handleChange('licenseNumber', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                        placeholder='VD: DS-123456'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='specialization' className='text-gray-700'>
                        Chuyên môn
                      </Label>
                      <Select
                        value={settings.specialization}
                        onValueChange={(value) => handleChange('specialization', value)}
                      >
                        <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='general'>Dược sĩ chung</SelectItem>
                          <SelectItem value='clinical'>Dược lâm sàng</SelectItem>
                          <SelectItem value='oncology'>Dược ung thư</SelectItem>
                          <SelectItem value='pediatrics'>Dược nhi</SelectItem>
                          <SelectItem value='cardiology'>Dược tim mạch</SelectItem>
                          <SelectItem value='diabetes'>Dược tiểu đường</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='licenseIssueDate' className='text-gray-700'>
                        Ngày cấp
                      </Label>
                      <Input
                        id='licenseIssueDate'
                        type='date'
                        value={settings.licenseIssueDate}
                        onChange={(e) => handleChange('licenseIssueDate', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='licenseExpiryDate' className='text-gray-700'>
                        Ngày hết hạn
                      </Label>
                      <Input
                        id='licenseExpiryDate'
                        type='date'
                        value={settings.licenseExpiryDate}
                        onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='yearsOfExperience' className='text-gray-700'>
                        Số năm kinh nghiệm
                      </Label>
                      <Input
                        id='yearsOfExperience'
                        type='number'
                        value={settings.yearsOfExperience}
                        onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                        min='0'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='workplace' className='text-gray-700'>
                        Nơi làm việc
                      </Label>
                      <div className='relative'>
                        <Briefcase className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='workplace'
                          value={settings.workplace}
                          onChange={(e) => handleChange('workplace', e.target.value)}
                          className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='outline' className='border-2 border-gray-200'>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => handleSave('thông tin chuyên môn')}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working Hours */}
            <TabsContent value='schedule' className='space-y-4 mt-4'>
              <Card className='border-blue-100'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <Clock className='w-5 h-5' />
                    Lịch làm việc
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-6'>
                  <p className='text-sm text-gray-600'>
                    Thiết lập khung giờ làm việc của bạn để hệ thống tự động quản lý trạng thái online/offline
                  </p>

                  <div className='space-y-3'>
                    {workDays.map(({ key, label }) => (
                      <div
                        key={key}
                        className='flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-100'
                      >
                        <div className='w-32'>
                          <div className='flex items-center gap-3'>
                            <Switch
                              checked={settings[`${key}Enabled` as keyof typeof settings] as boolean}
                              onCheckedChange={(checked) => handleChange(`${key}Enabled`, checked)}
                              className='data-[state=checked]:bg-blue-600'
                            />
                            <Label className='text-gray-700'>{label}</Label>
                          </div>
                        </div>

                        {settings[`${key}Enabled` as keyof typeof settings] ? (
                          <div className='flex-1 flex items-center gap-4'>
                            <div className='flex items-center gap-2'>
                              <Label className='text-sm text-gray-600'>Từ</Label>
                              <Input
                                type='time'
                                value={settings[`${key}Start` as keyof typeof settings] as string}
                                onChange={(e) => handleChange(`${key}Start`, e.target.value)}
                                className='w-32 border-2 border-blue-200 focus:border-blue-500'
                              />
                            </div>
                            <div className='flex items-center gap-2'>
                              <Label className='text-sm text-gray-600'>Đến</Label>
                              <Input
                                type='time'
                                value={settings[`${key}End` as keyof typeof settings] as string}
                                onChange={(e) => handleChange(`${key}End`, e.target.value)}
                                className='w-32 border-2 border-blue-200 focus:border-blue-500'
                              />
                            </div>
                          </div>
                        ) : (
                          <div className='flex-1 text-sm text-gray-400 italic'>Nghỉ</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='outline' className='border-2 border-gray-200'>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => handleSave('lịch làm việc')}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consultation Settings */}
            <TabsContent value='consultation' className='space-y-4 mt-4'>
              <Card className='border-blue-100'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <MessageSquare className='w-5 h-5' />
                    Cài đặt tư vấn
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-6'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='maxConcurrentChats' className='text-gray-700'>
                        Số cuộc tư vấn đồng thời tối đa
                      </Label>
                      <Select
                        value={settings.maxConcurrentChats}
                        onValueChange={(value) => handleChange('maxConcurrentChats', value)}
                      >
                        <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1'>1 cuộc</SelectItem>
                          <SelectItem value='2'>2 cuộc</SelectItem>
                          <SelectItem value='3'>3 cuộc</SelectItem>
                          <SelectItem value='5'>5 cuộc</SelectItem>
                          <SelectItem value='10'>10 cuộc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='averageResponseTime' className='text-gray-700'>
                        Thời gian phản hồi trung bình (phút)
                      </Label>
                      <Input
                        id='averageResponseTime'
                        type='number'
                        value={settings.averageResponseTime}
                        onChange={(e) => handleChange('averageResponseTime', e.target.value)}
                        className='border-2 border-blue-200 focus:border-blue-500'
                        min='1'
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-100'>
                      <div>
                        <Label className='text-gray-900'>Tự động chấp nhận cuộc tư vấn</Label>
                        <p className='text-sm text-gray-600 mt-1'>
                          Tự động nhận tư vấn mới khi online (trong giới hạn số cuộc đồng thời)
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoAcceptChats}
                        onCheckedChange={(checked) => handleChange('autoAcceptChats', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-100'>
                      <div>
                        <Label className='text-gray-900'>Hiển thị hồ sơ công khai</Label>
                        <p className='text-sm text-gray-600 mt-1'>
                          Cho phép bệnh nhân xem thông tin chuyên môn của bạn
                        </p>
                      </div>
                      <Switch
                        checked={settings.showProfilePublic}
                        onCheckedChange={(checked) => handleChange('showProfilePublic', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-100'>
                      <div>
                        <Label className='text-gray-900'>Cho phép đánh giá</Label>
                        <p className='text-sm text-gray-600 mt-1'>
                          Bệnh nhân có thể đánh giá chất lượng tư vấn của bạn
                        </p>
                      </div>
                      <Switch
                        checked={settings.allowPatientReviews}
                        onCheckedChange={(checked) => handleChange('allowPatientReviews', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='outline' className='border-2 border-gray-200'>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => handleSave('cài đặt tư vấn')}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value='notifications' className='space-y-4 mt-4'>
              <Card className='border-blue-100'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <Bell className='w-5 h-5' />
                    Cài đặt thông báo
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-6'>
                  <p className='text-sm text-gray-600'>
                    Quản lý các loại thông báo bạn muốn nhận qua Email, SMS và Push Notification
                  </p>

                  <Separator />

                  <div className='space-y-3'>
                    <h3 className='font-medium text-gray-900'>Kênh thông báo</h3>

                    <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-100'>
                      <div className='flex items-center gap-3'>
                        <Mail className='w-5 h-5 text-blue-600' />
                        <div>
                          <Label className='text-gray-900'>Email</Label>
                          <p className='text-sm text-gray-600'>Nhận thông báo qua email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-100'>
                      <div className='flex items-center gap-3'>
                        <MessageSquare className='w-5 h-5 text-green-600' />
                        <div>
                          <Label className='text-gray-900'>SMS</Label>
                          <p className='text-sm text-gray-600'>Nhận thông báo qua tin nhắn SMS</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleChange('smsNotifications', checked)}
                        className='data-[state=checked]:bg-green-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-100'>
                      <div className='flex items-center gap-3'>
                        <Bell className='w-5 h-5 text-purple-600' />
                        <div>
                          <Label className='text-gray-900'>Push Notification</Label>
                          <p className='text-sm text-gray-600'>Nhận thông báo trên thiết bị</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
                        className='data-[state=checked]:bg-purple-600'
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-3'>
                    <h3 className='font-medium text-gray-900'>Loại thông báo</h3>

                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <Label className='text-gray-700'>Đơn thuốc mới</Label>
                      <Switch
                        checked={settings.notifyNewPrescription}
                        onCheckedChange={(checked) => handleChange('notifyNewPrescription', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <Label className='text-gray-700'>Yêu cầu tư vấn mới</Label>
                      <Switch
                        checked={settings.notifyNewChat}
                        onCheckedChange={(checked) => handleChange('notifyNewChat', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <Label className='text-gray-700'>Đơn hàng sẵn sàng</Label>
                      <Switch
                        checked={settings.notifyOrderReady}
                        onCheckedChange={(checked) => handleChange('notifyOrderReady', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>

                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <Label className='text-gray-700'>Câu hỏi từ bệnh nhân</Label>
                      <Switch
                        checked={settings.notifyPatientQuestion}
                        onCheckedChange={(checked) => handleChange('notifyPatientQuestion', checked)}
                        className='data-[state=checked]:bg-blue-600'
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-3'>
                    <h3 className='font-medium text-gray-900'>Bảo mật</h3>

                    <div className='flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-100'>
                      <div className='flex items-center gap-3'>
                        <Shield className='w-5 h-5 text-red-600' />
                        <div>
                          <Label className='text-gray-900'>Xác thực hai yếu tố (2FA)</Label>
                          <p className='text-sm text-gray-600'>Tăng cường bảo mật tài khoản</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(checked) => handleChange('twoFactorAuth', checked)}
                        className='data-[state=checked]:bg-red-600'
                      />
                    </div>
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='outline' className='border-2 border-gray-200'>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => handleSave('thông báo')}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    
  )
}
