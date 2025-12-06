import { useState } from 'react'
import { Save, Mail, MessageSquare, CreditCard, Truck, Shield, Globe } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'

export function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // Email
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@medispace.com',
    smtpPassword: '********',

    // SMS
    smsEnabled: true,
    smsProvider: 'esms',
    smsApiKey: 'YOUR_API_KEY',

    // Payment
    momoEnabled: true,
    momoPartnerCode: 'MOMO_PARTNER',
    momoAccessKey: '********',
    vnpayEnabled: true,
    vnpayTmnCode: 'VNPAY_TMN',
    vnpayHashSecret: '********',
    codEnabled: true,

    // Shipping
    ghnEnabled: true,
    ghnShopId: '123456',
    ghnToken: '********',
    ghtkEnabled: false,

    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,

    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5',

    // General
    siteName: 'MEDISPACE',
    siteUrl: 'https://medispace.com',
    supportEmail: 'support@medispace.com',
    supportPhone: '1900-xxxx',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
  })

  const handleSave = (category: string) => {
    toast.success(`Đã lưu cài đặt ${category}`)
  }

  const handleChange = (key: string, value: string | boolean) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <h1
          className='text-3xl font-bold bg-clip-text text-transparent'
          style={{
            backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
          }}
        >
          Cài đặt hệ thống
        </h1>
        <p className='text-gray-600 mt-1'>Quản lý cấu hình email, SMS, payment gateway và các thiết lập hệ thống</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='general' className='space-y-4'>
        <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
          <TabsList className='grid w-full grid-cols-6 !bg-blue-50 p-1.5 rounded-lg h-auto'>
            <TabsTrigger value='general' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Chung
            </TabsTrigger>
            <TabsTrigger value='email' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Email
            </TabsTrigger>
            <TabsTrigger value='sms' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              SMS
            </TabsTrigger>
            <TabsTrigger value='payment' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value='shipping' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Vận chuyển
            </TabsTrigger>
            <TabsTrigger value='security' className='!border-0 data-[state=active]:!bg-white data-[state=active]:!text-gray-900 data-[state=active]:shadow-md !text-gray-700 hover:!text-gray-900 !transition-all !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-0 rounded-md px-4 py-2.5'>
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value='general' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <Globe className='w-5 h-5' />
                  Thông tin chung
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='siteName'>Tên website</Label>
                    <Input
                      id='siteName'
                      value={settings.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <Label htmlFor='siteUrl'>URL website</Label>
                    <Input
                      id='siteUrl'
                      value={settings.siteUrl}
                      onChange={(e) => handleChange('siteUrl', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <Label htmlFor='supportEmail'>Email hỗ trợ</Label>
                    <Input
                      id='supportEmail'
                      value={settings.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <Label htmlFor='supportPhone'>Hotline</Label>
                    <Input
                      id='supportPhone'
                      value={settings.supportPhone}
                      onChange={(e) => handleChange('supportPhone', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <Label htmlFor='timezone'>Múi giờ</Label>
                    <Select value={settings.timezone} onValueChange={(val) => handleChange('timezone', val)}>
                      <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Asia/Ho_Chi_Minh'>Việt Nam (GMT+7)</SelectItem>
                        <SelectItem value='Asia/Bangkok'>Thailand (GMT+7)</SelectItem>
                        <SelectItem value='Asia/Singapore'>Singapore (GMT+8)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='currency'>Đơn vị tiền tệ</Label>
                    <Select value={settings.currency} onValueChange={(val) => handleChange('currency', val)}>
                      <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='VND'>VND (₫)</SelectItem>
                        <SelectItem value='USD'>USD ($)</SelectItem>
                        <SelectItem value='EUR'>EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => handleSave('thông tin chung')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value='email' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <Mail className='w-5 h-5' />
                  Cấu hình Email SMTP
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-5 h-5 text-blue-600' />
                    <span className='text-gray-900'>Bật gửi email</span>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(val) => handleChange('emailEnabled', val)}
                  />
                </div>

                {settings.emailEnabled && (
                  <>
                    <Separator />
                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='smtpHost'>SMTP Host</Label>
                        <Input
                          id='smtpHost'
                          value={settings.smtpHost}
                          onChange={(e) => handleChange('smtpHost', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                          placeholder='smtp.gmail.com'
                        />
                      </div>
                      <div>
                        <Label htmlFor='smtpPort'>SMTP Port</Label>
                        <Input
                          id='smtpPort'
                          value={settings.smtpPort}
                          onChange={(e) => handleChange('smtpPort', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                          placeholder='587'
                        />
                      </div>
                      <div>
                        <Label htmlFor='smtpUser'>SMTP Username</Label>
                        <Input
                          id='smtpUser'
                          value={settings.smtpUser}
                          onChange={(e) => handleChange('smtpUser', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <Label htmlFor='smtpPassword'>SMTP Password</Label>
                        <Input
                          id='smtpPassword'
                          type='password'
                          value={settings.smtpPassword}
                          onChange={(e) => handleChange('smtpPassword', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={() => handleSave('email')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Settings */}
          <TabsContent value='sms' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <MessageSquare className='w-5 h-5' />
                  Cấu hình SMS Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <MessageSquare className='w-5 h-5 text-blue-600' />
                    <span className='text-gray-900'>Bật gửi SMS</span>
                  </div>
                  <Switch checked={settings.smsEnabled} onCheckedChange={(val) => handleChange('smsEnabled', val)} />
                </div>

                {settings.smsEnabled && (
                  <>
                    <Separator />
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='smsProvider'>Nhà cung cấp SMS</Label>
                        <Select value={settings.smsProvider} onValueChange={(val) => handleChange('smsProvider', val)}>
                          <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='esms'>eSMS.vn</SelectItem>
                            <SelectItem value='vietguys'>VietGuys</SelectItem>
                            <SelectItem value='sms24'>SMS24h</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='smsApiKey'>API Key</Label>
                        <Input
                          id='smsApiKey'
                          value={settings.smsApiKey}
                          onChange={(e) => handleChange('smsApiKey', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                          placeholder='YOUR_API_KEY'
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={() => handleSave('SMS')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value='payment' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <CreditCard className='w-5 h-5' />
                  Cổng thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* MoMo */}
                <div className='p-4 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-gray-900'>MoMo</h4>
                    <Switch
                      checked={settings.momoEnabled}
                      onCheckedChange={(val) => handleChange('momoEnabled', val)}
                    />
                  </div>
                  {settings.momoEnabled && (
                    <div className='space-y-3'>
                      <div>
                        <Label>Partner Code</Label>
                        <Input
                          value={settings.momoPartnerCode}
                          onChange={(e) => handleChange('momoPartnerCode', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <Label>Access Key</Label>
                        <Input
                          type='password'
                          value={settings.momoAccessKey}
                          onChange={(e) => handleChange('momoAccessKey', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* VNPay */}
                <div className='p-4 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-gray-900'>VNPay</h4>
                    <Switch
                      checked={settings.vnpayEnabled}
                      onCheckedChange={(val) => handleChange('vnpayEnabled', val)}
                    />
                  </div>
                  {settings.vnpayEnabled && (
                    <div className='space-y-3'>
                      <div>
                        <Label>TMN Code</Label>
                        <Input
                          value={settings.vnpayTmnCode}
                          onChange={(e) => handleChange('vnpayTmnCode', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <Label>Hash Secret</Label>
                        <Input
                          type='password'
                          value={settings.vnpayHashSecret}
                          onChange={(e) => handleChange('vnpayHashSecret', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* COD */}
                <div className='p-4 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-gray-900'>Thanh toán khi nhận hàng (COD)</h4>
                    <Switch checked={settings.codEnabled} onCheckedChange={(val) => handleChange('codEnabled', val)} />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('thanh toán')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value='shipping' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <Truck className='w-5 h-5' />
                  Đơn vị vận chuyển
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* GHN */}
                <div className='p-4 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-gray-900'>Giao Hàng Nhanh (GHN)</h4>
                    <Switch checked={settings.ghnEnabled} onCheckedChange={(val) => handleChange('ghnEnabled', val)} />
                  </div>
                  {settings.ghnEnabled && (
                    <div className='space-y-3'>
                      <div>
                        <Label>Shop ID</Label>
                        <Input
                          value={settings.ghnShopId}
                          onChange={(e) => handleChange('ghnShopId', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <Label>Token</Label>
                        <Input
                          type='password'
                          value={settings.ghnToken}
                          onChange={(e) => handleChange('ghnToken', e.target.value)}
                          className='border-2 border-blue-200 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* GHTK */}
                <div className='p-4 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-gray-900'>Giao Hàng Tiết Kiệm (GHTK)</h4>
                    <Switch
                      checked={settings.ghtkEnabled}
                      onCheckedChange={(val) => handleChange('ghtkEnabled', val)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('vận chuyển')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value='security' className='space-y-4 mt-4'>
            <Card className='border border-blue-200'>
              <CardHeader>
                <CardTitle className='text-blue-900 flex items-center gap-2'>
                  <Shield className='w-5 h-5' />
                  Bảo mật hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                  <div>
                    <p className='text-gray-900'>Xác thực 2 yếu tố (2FA)</p>
                    <p className='text-sm text-gray-600'>Yêu cầu mã OTP khi đăng nhập</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(val) => handleChange('twoFactorAuth', val)}
                  />
                </div>

                <Separator />

                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='sessionTimeout'>Thời gian session (phút)</Label>
                    <Input
                      id='sessionTimeout'
                      type='number'
                      value={settings.sessionTimeout}
                      onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <Label htmlFor='maxLoginAttempts'>Số lần đăng nhập tối đa</Label>
                    <Input
                      id='maxLoginAttempts'
                      type='number'
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleChange('maxLoginAttempts', e.target.value)}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('bảo mật')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
