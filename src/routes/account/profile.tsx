import { ProfileForm } from '~/components/account'

export function meta() {
  return [{ title: 'Hồ sơ cá nhân | MEDISPACE' }, { name: 'description', content: 'Quản lý thông tin cá nhân' }]
}

export default function AccountProfile() {
  return (
    <div className='space-y-6 text-gray-900 [color-scheme:light]'>
      <div className='border-b border-gray-200 pb-4 text-gray-900'>
        <h1 className='text-2xl font-bold text-blue-800 mb-2'>Hồ sơ cá nhân</h1>
        <p className='text-gray-600'>Quản lý thông tin và cài đặt tài khoản</p>
      </div>

      <ProfileForm />
    </div>
  )
}
