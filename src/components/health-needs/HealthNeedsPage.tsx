import { Activity, ArrowRight, Bone, Droplets, HeartPulse, Leaf, Shield, Thermometer, User } from 'lucide-react'
import { Link } from 'react-router'
import { healthNeeds } from '../../data/healthNeeds'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

const iconMap = {
  activity: Activity,
  bone: Bone,
  droplets: Droplets,
  heartPulse: HeartPulse,
  leaf: Leaf,
  shield: Shield,
  thermometer: Thermometer,
  user: User,
}

const severityLabel = {
  selfcare: 'Tự chăm sóc có hướng dẫn',
  pharmacist: 'Nên hỏi dược sĩ',
  doctor: 'Cần thận trọng với bệnh nền',
}

export function HealthNeedsPage() {
  return (
    <div className='min-h-screen bg-[#F8FAFB]'>
      <div className='border-b border-[#E8EDF5] bg-white'>
        <div className='mx-auto max-w-7xl px-4 py-5'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Nhu cầu sức khỏe' },
            ]}
          />
        </div>
      </div>

      <main className='mx-auto max-w-7xl px-4 py-10'>
        <div className='max-w-3xl'>
          <Badge className='mb-4 bg-[#E0F2FE] text-[#0A2463] hover:bg-[#E0F2FE]'>Health needs</Badge>
          <h1 className='font-display text-4xl font-bold text-[#0A2463] md:text-5xl'>Mua theo nhu cầu sức khỏe</h1>
          <p className='mt-4 text-lg leading-8 text-[#4B5E7A]'>
            Chọn tình trạng hoặc mục tiêu chăm sóc để xem nhóm sản phẩm gợi ý, bài viết liên quan và các dấu hiệu nên hỏi dược sĩ trước khi mua.
          </p>
        </div>

        <div className='mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {healthNeeds.map((need) => {
            const Icon = iconMap[need.icon]
            return (
              <Link key={need.slug} to={`/health-needs/${need.slug}`} className='group block h-full'>
                <Card className='h-full border-[#E8EDF5] bg-white transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(10,36,99,0.12)]'>
                  <CardContent className='flex h-full flex-col p-5'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F6FF] text-[#0A2463]'>
                        <Icon className='h-6 w-6' />
                      </div>
                      <ArrowRight className='mt-1 h-5 w-5 text-[#8094AE] transition group-hover:translate-x-1 group-hover:text-[#0A2463]' />
                    </div>
                    <h2 className='mt-5 font-display text-xl font-semibold text-[#1C2B4A] group-hover:text-[#0A2463]'>{need.label}</h2>
                    <p className='mt-2 min-h-[48px] text-sm leading-6 text-[#4B5E7A]'>{need.summary}</p>
                    <div className='mt-4 flex flex-wrap gap-2'>
                      {need.keywords.slice(0, 3).map((keyword) => (
                        <span key={keyword} className='rounded-full bg-[#F8FAFB] px-3 py-1 text-xs font-medium text-[#4B5E7A]'>
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className='mt-auto pt-5 text-sm font-semibold text-[#1E40AF]'>{severityLabel[need.severity]}</div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
