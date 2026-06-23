import { Toaster as Sonner, toast as sonnerToast, type ToasterProps } from 'sonner'

let testIdsPatched = false

const patchToastTestIds = () => {
  if (testIdsPatched) return

  const toastApi = sonnerToast as typeof sonnerToast & {
    success: (...args: any[]) => string | number
    error: (...args: any[]) => string | number
  }
  const originalSuccess = toastApi.success.bind(toastApi)
  const originalError = toastApi.error.bind(toastApi)

  toastApi.success = (message: any, data: any = {}) => originalSuccess(message, { ...data, testId: data.testId ?? 'toast-success' })
  toastApi.error = (message: any, data: any = {}) => originalError(message, { ...data, testId: data.testId ?? 'toast-error' })

  testIdsPatched = true
}

const Toaster = ({ ...props }: ToasterProps) => {
  patchToastTestIds()

  return (
    <Sonner
      theme='light'
      className='toaster group'
      position='bottom-right'
      closeButton
      richColors
      expand={false}
      duration={4000}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-2 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4',

          // Success toast - Green with glassmorphism
          success:
            'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-emerald-50/95 group-[.toaster]:to-green-50/95 group-[.toaster]:border-emerald-300 group-[.toaster]:text-emerald-900',

          // Error toast - Red with glassmorphism
          error:
            'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-red-50/95 group-[.toaster]:to-rose-50/95 group-[.toaster]:border-red-300 group-[.toaster]:text-red-900',

          // Warning toast - Orange with glassmorphism
          warning:
            'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-orange-50/95 group-[.toaster]:to-amber-50/95 group-[.toaster]:border-orange-300 group-[.toaster]:text-orange-900',

          // Info toast - Blue MEDISPACE theme with glassmorphism
          info: 'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-50/95 group-[.toaster]:to-[#F0F6FF]/95 group-[.toaster]:border-blue-400 group-[.toaster]:text-blue-900',

          // Default toast - MEDISPACE blue theme
          default:
            'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-50/95 group-[.toaster]:to-white/95 group-[.toaster]:border-[#BFDBFE] group-[.toaster]:text-gray-900',

          title: 'group-[.toast]:font-semibold group-[.toast]:text-base',
          description: 'group-[.toast]:text-sm group-[.toast]:opacity-90',
          actionButton:
            'group-[.toast]:bg-[#0A2463] group-[.toast]:text-white group-[.toast]:hover:bg-[#071A49] group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:transition-all',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:hover:bg-gray-200 group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:transition-all',
          closeButton:
            'group-[.toast]:bg-white/80 group-[.toast]:border-gray-200 group-[.toast]:hover:bg-gray-100 group-[.toast]:rounded-lg group-[.toast]:shadow-md group-[.toast]:transition-all',
          icon: 'group-[.toast]:w-5 group-[.toast]:h-5',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
