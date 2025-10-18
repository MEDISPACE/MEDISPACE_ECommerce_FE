import { useState } from 'react'
import { Plus, Shield, CreditCard, Smartphone, Building, Info } from 'lucide-react'

import { PaymentMethodCard } from './PaymentMethodCard'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  type: 'card' | 'ewallet' | 'bank'
  name: string
  details: string
  lastFour?: string
  expiryDate?: string
  isDefault: boolean
  icon?: string
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    name: 'Visa Credit Card',
    details: 'Ngân hàng Vietcombank',
    lastFour: '4532',
    expiryDate: '12/26',
    isDefault: true,
  },
  {
    id: '2',
    type: 'ewallet',
    name: 'MoMo',
    details: '0901234567',
    isDefault: false,
  },
  {
    id: '3',
    type: 'bank',
    name: 'Techcombank',
    details: '19036584251xxx',
    isDefault: false,
  },
]

const ewalletOptions = [
  { value: 'momo', label: 'MoMo', icon: '💜' },
  { value: 'zalopay', label: 'ZaloPay', icon: '🔵' },
  { value: 'shopeepay', label: 'ShopeePay', icon: '🟠' },
  { value: 'vnpay', label: 'VNPay', icon: '🔴' },
]

const bankOptions = [
  'Vietcombank',
  'BIDV',
  'Vietinbank',
  'Techcombank',
  'ACB',
  'Sacombank',
  'Eximbank',
  'DongA Bank',
  'TPBank',
  'VPBank',
]

export function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [selectedType, setSelectedType] = useState<'card' | 'ewallet' | 'bank'>('card')

  // Type guard function for payment method types
  const isValidPaymentType = (value: string): value is 'card' | 'ewallet' | 'bank' => {
    return ['card', 'ewallet', 'bank'].includes(value)
  }
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveForFuture: false,
  })
  const [ewalletForm, setEwalletForm] = useState({
    provider: '',
    phoneNumber: '',
    saveForFuture: false,
  })
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    saveForFuture: false,
  })

  const handleAddPaymentMethod = () => {
    setEditingMethod(null)
    setCardForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      saveForFuture: false,
    })
    setEwalletForm({
      provider: '',
      phoneNumber: '',
      saveForFuture: false,
    })
    setBankForm({
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      saveForFuture: false,
    })
    setIsAddModalOpen(true)
  }

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingMethod(method)
    setSelectedType(method.type)
    setIsAddModalOpen(true)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handleSavePaymentMethod = () => {
    let newMethod: PaymentMethod

    if (selectedType === 'card') {
      if (!cardForm.cardNumber || !cardForm.expiryDate || !cardForm.cardholderName) {
        toast.error('Vui lòng điền đầy đủ thông tin thẻ')
        return
      }

      const lastFour = cardForm.cardNumber.replace(/\s/g, '').slice(-4)
      newMethod = {
        id: editingMethod?.id || Date.now().toString(),
        type: 'card',
        name: cardForm.cardholderName.includes('Visa') ? 'Visa Credit Card' : 'Mastercard',
        details: 'Thẻ tín dụng',
        lastFour,
        expiryDate: cardForm.expiryDate,
        isDefault: cardForm.saveForFuture && paymentMethods.length === 0,
      }
    } else if (selectedType === 'ewallet') {
      if (!ewalletForm.provider || !ewalletForm.phoneNumber) {
        toast.error('Vui lòng điền đầy đủ thông tin ví điện tử')
        return
      }

      const providerInfo = ewalletOptions.find((opt) => opt.value === ewalletForm.provider)
      newMethod = {
        id: editingMethod?.id || Date.now().toString(),
        type: 'ewallet',
        name: providerInfo?.label || '',
        details: ewalletForm.phoneNumber,
        isDefault: ewalletForm.saveForFuture && paymentMethods.length === 0,
      }
    } else {
      if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
        toast.error('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng')
        return
      }

      const maskedAccount = bankForm.accountNumber.slice(0, -3) + 'xxx'
      newMethod = {
        id: editingMethod?.id || Date.now().toString(),
        type: 'bank',
        name: bankForm.bankName,
        details: maskedAccount,
        isDefault: bankForm.saveForFuture && paymentMethods.length === 0,
      }
    }

    if (editingMethod) {
      setPaymentMethods((prev) => prev.map((method) => (method.id === editingMethod.id ? newMethod : method)))
      toast.success('Cập nhật phương thức thanh toán thành công')
    } else {
      setPaymentMethods((prev) => [...prev, newMethod])
      toast.success('Thêm phương thức thanh toán thành công')
    }

    setIsAddModalOpen(false)
  }

  const handleDeletePaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== methodId))
    toast.success('Đã xóa phương thức thanh toán')
  }

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === methodId,
      })),
    )
    toast.success('Đã đặt làm phương thức mặc định')
  }

  const cardTypes = paymentMethods.filter((m) => m.type === 'card')
  const ewallets = paymentMethods.filter((m) => m.type === 'ewallet')
  const bankAccounts = paymentMethods.filter((m) => m.type === 'bank')

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                Phương thức thanh toán
              </h1>
              <p className='text-gray-600 mt-1'>Quản lý thẻ và ví điện tử của bạn</p>
            </div>

            <Button
              onClick={handleAddPaymentMethod}
              className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg'
            >
              <Plus className='w-4 h-4 mr-2' />
              Thêm phương thức mới
            </Button>
          </div>

          <div className='flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <Shield className='w-5 h-5 text-green-600' />
            <span className='text-sm text-green-800 font-medium'>
              🔒 Thông tin được mã hóa SSL và tuân thủ chuẩn PCI DSS
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className='space-y-6'>
          {/* Credit/Debit Cards */}
          {cardTypes.length > 0 && (
            <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <CreditCard className='w-5 h-5 text-blue-600' />
                <h2 className='font-medium text-gray-900'>Thẻ tín dụng / Ghi nợ</h2>
                <Badge variant='secondary'>{cardTypes.length}</Badge>
              </div>
              <div className='space-y-4'>
                {cardTypes.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onEdit={handleEditPaymentMethod}
                    onDelete={handleDeletePaymentMethod}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </div>
            </div>
          )}

          {/* E-Wallets */}
          {ewallets.length > 0 && (
            <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Smartphone className='w-5 h-5 text-green-600' />
                <h2 className='font-medium text-gray-900'>Ví điện tử</h2>
                <Badge variant='secondary'>{ewallets.length}</Badge>
              </div>
              <div className='space-y-4'>
                {ewallets.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onEdit={handleEditPaymentMethod}
                    onDelete={handleDeletePaymentMethod}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bank Accounts */}
          {bankAccounts.length > 0 && (
            <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Building className='w-5 h-5 text-gray-600' />
                <h2 className='font-medium text-gray-900'>Tài khoản ngân hàng</h2>
                <Badge variant='secondary'>{bankAccounts.length}</Badge>
              </div>
              <div className='space-y-4'>
                {bankAccounts.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onEdit={handleEditPaymentMethod}
                    onDelete={handleDeletePaymentMethod}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {paymentMethods.length === 0 && (
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
              <CardContent className='p-12 text-center'>
                <CreditCard className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có phương thức thanh toán</h3>
                <p className='text-gray-500 mb-4'>Thêm thẻ hoặc ví điện tử để thanh toán nhanh chóng</p>
                <Button
                  onClick={handleAddPaymentMethod}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Thêm phương thức đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Payment Method Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Chỉnh sửa phương thức thanh toán' : 'Thêm phương thức thanh toán'}
              </DialogTitle>
              <DialogDescription>
                {editingMethod
                  ? 'Cập nhật thông tin phương thức thanh toán'
                  : 'Thêm phương thức thanh toán mới vào tài khoản'}
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={selectedType}
              onValueChange={(value: string) => {
                if (isValidPaymentType(value)) {
                  setSelectedType(value)
                }
              }}
            >
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='card' className='flex items-center gap-2'>
                  <CreditCard className='w-4 h-4' />
                  Thẻ
                </TabsTrigger>
                <TabsTrigger value='ewallet' className='flex items-center gap-2'>
                  <Smartphone className='w-4 h-4' />
                  Ví điện tử
                </TabsTrigger>
                <TabsTrigger value='bank' className='flex items-center gap-2'>
                  <Building className='w-4 h-4' />
                  Ngân hàng
                </TabsTrigger>
              </TabsList>

              {/* Credit Card Form */}
              <TabsContent value='card' className='space-y-4'>
                <div>
                  <Label htmlFor='cardNumber'>Số thẻ *</Label>
                  <Input
                    id='cardNumber'
                    value={cardForm.cardNumber}
                    onChange={(e) =>
                      setCardForm((prev) => ({
                        ...prev,
                        cardNumber: formatCardNumber(e.target.value),
                      }))
                    }
                    placeholder='1234 5678 9012 3456'
                    maxLength={19}
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='expiryDate'>Ngày hết hạn *</Label>
                    <Input
                      id='expiryDate'
                      value={cardForm.expiryDate}
                      onChange={(e) =>
                        setCardForm((prev) => ({
                          ...prev,
                          expiryDate: formatExpiryDate(e.target.value),
                        }))
                      }
                      placeholder='MM/YY'
                      maxLength={5}
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <Label htmlFor='cvv'>CVV *</Label>
                      <Info className='w-4 h-4 text-gray-400' />
                    </div>
                    <Input
                      id='cvv'
                      value={cardForm.cvv}
                      onChange={(e) =>
                        setCardForm((prev) => ({
                          ...prev,
                          cvv: e.target.value.replace(/[^0-9]/g, ''),
                        }))
                      }
                      placeholder='123'
                      maxLength={4}
                      type='password'
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='cardholderName'>Tên chủ thẻ *</Label>
                  <Input
                    id='cardholderName'
                    value={cardForm.cardholderName}
                    onChange={(e) =>
                      setCardForm((prev) => ({
                        ...prev,
                        cardholderName: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder='NGUYEN VAN A'
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='saveCard'
                    checked={cardForm.saveForFuture}
                    onCheckedChange={(checked) => setCardForm((prev) => ({ ...prev, saveForFuture: !!checked }))}
                  />
                  <Label htmlFor='saveCard'>Lưu để thanh toán nhanh</Label>
                </div>
              </TabsContent>

              {/* E-wallet Form */}
              <TabsContent value='ewallet' className='space-y-4'>
                <div>
                  <Label>Nhà cung cấp *</Label>
                  <Select
                    value={ewalletForm.provider}
                    onValueChange={(value) => setEwalletForm((prev) => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn ví điện tử' />
                    </SelectTrigger>
                    <SelectContent>
                      {ewalletOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className='flex items-center gap-2'>
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='phoneNumber'>Số điện thoại *</Label>
                  <Input
                    id='phoneNumber'
                    value={ewalletForm.phoneNumber}
                    onChange={(e) =>
                      setEwalletForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                    placeholder='0901234567'
                    maxLength={11}
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='saveEwallet'
                    checked={ewalletForm.saveForFuture}
                    onCheckedChange={(checked) => setEwalletForm((prev) => ({ ...prev, saveForFuture: !!checked }))}
                  />
                  <Label htmlFor='saveEwallet'>Lưu để thanh toán nhanh</Label>
                </div>
              </TabsContent>

              {/* Bank Form */}
              <TabsContent value='bank' className='space-y-4'>
                <div>
                  <Label>Ngân hàng *</Label>
                  <Select
                    value={bankForm.bankName}
                    onValueChange={(value) => setBankForm((prev) => ({ ...prev, bankName: value }))}
                  >
                    <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn ngân hàng' />
                    </SelectTrigger>
                    <SelectContent>
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='accountNumber'>Số tài khoản *</Label>
                  <Input
                    id='accountNumber'
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        accountNumber: e.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                    placeholder='1234567890'
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div>
                  <Label htmlFor='accountHolder'>Tên chủ tài khoản *</Label>
                  <Input
                    id='accountHolder'
                    value={bankForm.accountHolder}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        accountHolder: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder='NGUYEN VAN A'
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='saveBank'
                    checked={bankForm.saveForFuture}
                    onCheckedChange={(checked) => setBankForm((prev) => ({ ...prev, saveForFuture: !!checked }))}
                  />
                  <Label htmlFor='saveBank'>Lưu để thanh toán nhanh</Label>
                </div>
              </TabsContent>
            </Tabs>

            <div className='flex justify-end gap-3 pt-4 border-t'>
              <Button variant='outline' onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSavePaymentMethod}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              >
                {editingMethod ? 'Cập nhật' : 'Thêm phương thức'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
