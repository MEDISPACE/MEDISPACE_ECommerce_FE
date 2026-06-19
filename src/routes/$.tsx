import { Link } from 'react-router'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'

export function meta() {
  return [
    { title: 'Không tìm thấy trang | MEDISPACE' },
    { name: 'description', content: 'Trang bạn tìm kiếm không tồn tại' },
  ]
}

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#F8FAFB] to-[#F0F6FF]'>
      <div className='text-center p-8'>
        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-[#1E40AF] mb-4'>404</h1>
          <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Không tìm thấy trang</h2>
          <p className='text-gray-600 mb-8'>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        </div>

        <div className='space-y-4'>
          <Button asChild className='bg-[#0A2463] hover:bg-[#071A49] text-white mr-4'>
            <Link to='/'>
              <Home className='bg-whiw-4 h-4 mr-2' />
              Về trang chủ
            </Link>
          </Button>

          <Button variant='outline' asChild>
            <Link to='javascript:history.back()'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
