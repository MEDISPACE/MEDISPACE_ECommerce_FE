import { EyeOff, MessageCircle, ShieldCheck, Siren, Sparkles, Stethoscope, Users, Video } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import type { CommunityThread, CommunityThreadPrefix, CommunityUserSummary } from '~/types/community'

export const THREAD_PREFIX_OPTIONS: Array<{ value: CommunityThreadPrefix; label: string }> = [
  { value: 'question', label: 'Hỏi đáp' },
  { value: 'review', label: 'Review' },
  { value: 'warning', label: 'Cảnh báo' },
  { value: 'story', label: 'Tâm sự' },
  { value: 'experience', label: 'Kinh nghiệm' },
  { value: 'pharmacist', label: 'Dược sĩ' },
]

const prefixStyles: Record<CommunityThreadPrefix, string> = {
  question: 'border-blue-100 bg-blue-50 text-[#0A2463]',
  review: 'border-[#9fc7aa] bg-[#f1f8f2] text-[#27623a]',
  warning: 'border-[#d8ba75] bg-[#fff8df] text-[#7a5512]',
  story: 'border-[#d5a7b5] bg-[#fff1f5] text-[#7a2942]',
  experience: 'border-[#b5adc8] bg-[#f5f1fb] text-[#4d3d70]',
  pharmacist: 'border-[#96c7cc] bg-[#eefafa] text-[#225e66]',
}

export function prefixLabel(prefix?: CommunityThreadPrefix) {
  return THREAD_PREFIX_OPTIONS.find((item) => item.value === prefix)?.label || 'Hỏi đáp'
}

export function ThreadPrefixBadge({ prefix }: { prefix?: CommunityThreadPrefix }) {
  return (
    <Badge variant='outline' className={`h-6 rounded-full px-2 text-[11px] font-semibold leading-none ${prefixStyles[prefix || 'question']}`}>
      {prefix === 'warning' ? <Siren className='h-3 w-3' /> : prefix === 'pharmacist' ? <Stethoscope className='h-3 w-3' /> : <MessageCircle className='h-3 w-3' />}
      {prefixLabel(prefix)}
    </Badge>
  )
}

export function ThreadStateBadges({ thread }: { thread: CommunityThread }) {
  return (
    <>
      {thread.sticky && <Badge className='h-6 rounded-full bg-[#0A2463] px-2 text-[11px] text-white hover:bg-[#0A2463]'><Sparkles className='h-3 w-3' />Ghim</Badge>}
      {thread.status === 'hidden' && <Badge className='h-6 rounded-full bg-rose-50 px-2 text-[11px] text-rose-700 hover:bg-rose-50'><EyeOff className='h-3 w-3' />Đã ẩn</Badge>}
      {thread.status === 'answered' && <Badge className='h-6 rounded-full bg-emerald-50 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50'><ShieldCheck className='h-3 w-3' />Đã trả lời</Badge>}
      {thread.videoMeeting?.url && <ThreadVideoMeetingBadge thread={thread} />}
      {thread.locked && <Badge variant='outline' className='h-6 rounded-full border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-700'>Đã khóa</Badge>}
    </>
  )
}

export function videoMeetingLabel(thread: CommunityThread) {
  if (thread.videoMeeting?.status === 'ended') return 'Đã kết thúc video'
  return 'Có phòng video'
}

export function ThreadVideoMeetingBadge({ thread }: { thread: CommunityThread }) {
  const status = thread.videoMeeting?.status
  const className = status === 'ended' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-blue-100 bg-blue-50 text-[#0A2463]'

  return (
    <Badge variant='outline' className={`h-6 rounded-full px-2 text-[11px] font-semibold ${className}`}>
      <Video className='h-3 w-3' />
      {videoMeetingLabel(thread)}
    </Badge>
  )
}

export function authorName(author?: CommunityUserSummary, anonymous?: boolean) {
  if (anonymous) return 'Thành viên ẩn danh'
  if (!author) return 'Thành viên'
  return `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Thành viên'
}

export function authorInitials(author?: CommunityUserSummary, anonymous?: boolean) {
  const name = authorName(author, anonymous)
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'MS'
}

export function formatCount(value?: number) {
  const count = value || 0
  if (count < 1000) return String(count)
  return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
}

export function ThreadMetric({ icon: Icon, value, label }: { icon: typeof Users; value?: number; label: string }) {
  return (
    <span className='inline-flex items-center gap-1 text-xs text-slate-500'>
      <Icon className='h-3.5 w-3.5' />
      {formatCount(value)} {label}
    </span>
  )
}
