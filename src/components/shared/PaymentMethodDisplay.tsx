import { Banknote, Building2, CreditCard } from 'lucide-react'
import payOSLogo from '../../assets/payOSLogo.svg'
import VNPayLogo from '../../assets/VNPayLogo.svg'

type PaymentMethodDisplayProps = {
  method?: string | null
  label?: string
  description?: string
  logoClassName?: string
  className?: string
  showDescription?: boolean
}

export function getPaymentMethodName(method?: string | null) {
  const normalized = normalizePaymentMethod(method)

  if (normalized === 'vnpay') return 'VNPay'
  if (normalized === 'payos') return 'PayOS'
  if (normalized === 'cod') return 'Thanh toán khi nhận hàng (COD)'
  if (normalized === 'bank_transfer') return 'Chuyển khoản ngân hàng'
  if (normalized === 'credit_card' || normalized === 'credit_card_pos') return 'Thẻ thanh toán'
  if (normalized === 'cash') return 'Tiền mặt'

  return method || 'Thanh toán khi nhận hàng (COD)'
}

export function normalizePaymentMethod(method?: string | null) {
  const value = (method || '').trim().toLowerCase()

  if (value.includes('vnpay') || value.includes('vn pay')) return 'vnpay'
  if (value.includes('payos') || value.includes('pay os')) return 'payos'
  if (value.includes('cod') || value.includes('nhận hàng')) return 'cod'
  if (value.includes('bank') || value.includes('chuyển khoản')) return 'bank_transfer'
  if (value.includes('credit_card_pos')) return 'credit_card_pos'
  if (value.includes('credit') || value.includes('card') || value.includes('thẻ')) return 'credit_card'
  if (value.includes('cash') || value.includes('tiền mặt')) return 'cash'

  return value
}

export function PaymentMethodLogo({ method, className = 'h-5 w-auto max-w-[72px]' }: { method?: string | null; className?: string }) {
  const normalized = normalizePaymentMethod(method)

  if (normalized === 'vnpay') {
    return <img src={VNPayLogo} alt='VNPay' className={className} />
  }

  if (normalized === 'payos') {
    return <img src={payOSLogo} alt='PayOS' className={className} />
  }

  if (normalized === 'cod' || normalized === 'cash') {
    return <Banknote className='h-5 w-5 text-emerald-600' />
  }

  if (normalized === 'bank_transfer') {
    return <Building2 className='h-5 w-5 text-[#1E40AF]' />
  }

  return <CreditCard className='h-5 w-5 text-[#1E40AF]' />
}

export function PaymentMethodDisplay({
  method,
  label,
  description,
  logoClassName,
  className = '',
  showDescription = true,
}: PaymentMethodDisplayProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span className='flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-[#E8EDF5] bg-white px-1.5'>
        <PaymentMethodLogo method={method} className={logoClassName || 'h-5 w-auto max-w-full'} />
      </span>
      <span className='min-w-0'>
        <span className='block truncate font-medium text-gray-900'>{label || getPaymentMethodName(method)}</span>
        {showDescription && description && <span className='block truncate text-sm text-gray-600'>{description}</span>}
      </span>
    </div>
  )
}
