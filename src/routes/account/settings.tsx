import { SettingsForm } from '~/components/account'

export function meta() {
  return [{ title: 'Cài đặt tài khoản | MEDISPACE' }, { name: 'description', content: 'Cài đặt và bảo mật tài khoản' }]
}

export default function AccountSettings() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Cài đặt tài khoản</h1>
        <p className='text-gray-600'>Quản lý cài đặt và bảo mật</p>
      </div>

      <SettingsForm />
    </div>
  )
}
