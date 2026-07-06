import { Truck } from 'lucide-react'
import ahamoveLogo from '../../assets/ahamoveLogo.svg'
import GHNLogo from '../../assets/GHN_Logo.png'
import GHTKLogo from '../../assets/GHTKLogo.svg'

type ShippingProvider = 'ghn' | 'ghtk' | 'ahamove' | 'default'

type ShippingMethodDisplayProps = {
  method?: string | null
  label?: string
  description?: string
  logoClassName?: string
  className?: string
  showDescription?: boolean
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function normalizeShippingProvider(method?: string | null, label?: string | null, description?: string | null): ShippingProvider {
  const value = normalizeText([method, label, description].filter(Boolean).join(' ').trim())

  if (value.includes('ahamove') || value.includes('aha move')) return 'ahamove'
  if (value.includes('ghtk') || value.includes('giao hang tiet kiem')) return 'ghtk'
  if (value.includes('ghn') || value.includes('giao hang nhanh')) return 'ghn'

  return 'default'
}

export function getShippingProviderName(method?: string | null, label?: string | null, description?: string | null) {
  const provider = normalizeShippingProvider(method, label, description)

  if (provider === 'ghn') return 'GHN'
  if (provider === 'ghtk') return 'GHTK'
  if (provider === 'ahamove') return 'Ahamove'

  return label || method || 'Giao hàng'
}

export function ShippingMethodLogo({
  method,
  label,
  description,
  className = 'h-6 w-full object-contain',
}: {
  method?: string | null
  label?: string | null
  description?: string | null
  className?: string
}) {
  const provider = normalizeShippingProvider(method, label, description)

  if (provider === 'ghn') return <img src={GHNLogo} alt='GHN' className={className} />
  if (provider === 'ghtk') return <img src={GHTKLogo} alt='GHTK' className={className} />
  if (provider === 'ahamove') return <img src={ahamoveLogo} alt='Ahamove' className={className} />

  return <Truck className='h-6 w-6 text-[#1E40AF]' />
}

export function ShippingMethodDisplay({
  method,
  label,
  description,
  logoClassName,
  className = '',
  showDescription = true,
}: ShippingMethodDisplayProps) {
  const title = label || getShippingProviderName(method, label, description)
  const shouldShowDescription = Boolean(
    showDescription && description && normalizeText(description) !== normalizeText(title),
  )

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span className='flex h-11 w-[72px] shrink-0 items-center justify-center rounded-md border border-[#E8EDF5] bg-white px-2'>
        <ShippingMethodLogo
          method={method}
          label={label}
          description={description}
          className={logoClassName || 'h-6 w-full object-contain'}
        />
      </span>
      <span className='min-w-0'>
        <span className='block truncate font-medium text-gray-900'>{title}</span>
        {shouldShowDescription && <span className='block truncate text-sm text-gray-600'>{description}</span>}
      </span>
    </div>
  )
}
