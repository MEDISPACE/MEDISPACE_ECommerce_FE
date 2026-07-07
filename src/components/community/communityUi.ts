import type { CommunityRoom } from '~/types/community'

export const DEFAULT_ROOM_GUIDELINES = [
  'Tôn trọng trải nghiệm và quyền riêng tư của thành viên khác.',
  'Không chia sẻ thông tin cá nhân nhạy cảm hoặc hồ sơ bệnh án đầy đủ.',
  'Nội dung trong cộng đồng không thay thế tư vấn y khoa trực tiếp.',
]

const DISEASE_LABELS: Record<string, string> = {
  diabetes: 'Đái tháo đường',
  cardiovascular: 'Tim mạch',
  heart: 'Tim mạch',
  dermatology: 'Da liễu',
  mental_health: 'Sức khỏe tinh thần',
  mother_baby: 'Mẹ và bé',
  respiratory: 'Hô hấp',
  oncology: 'Ung bướu',
  nutrition: 'Dinh dưỡng',
}

export function getRoomTopic(room?: Pick<CommunityRoom, 'topicLabel' | 'diseaseKey' | 'name'> | null) {
  const key = room?.diseaseKey?.trim()
  if (room?.topicLabel?.trim()) return room.topicLabel.trim()
  if (key) return DISEASE_LABELS[key] || key.replace(/[-_]/g, ' ')
  return 'Chăm sóc sức khỏe'
}

export function getRoomDescription(room: CommunityRoom) {
  if (room.description?.trim()) return room.description.trim()
  return `Không gian trao đổi an toàn về ${getRoomTopic(room).toLowerCase()}, kinh nghiệm chăm sóc và các câu hỏi thường gặp.`
}

export function getRoomGuidelines(room?: CommunityRoom | null) {
  return room?.guidelines?.length ? room.guidelines : DEFAULT_ROOM_GUIDELINES
}

export function richTextToPlainText(value?: string) {
  if (!value) return ''
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() || ''
  }
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export function communityPreviewText(value?: string, fallback = 'Chưa có bài mới') {
  return richTextToPlainText(value) || fallback
}

export function formatRelativeTime(value?: string) {
  if (!value) return 'Chưa có hoạt động'
  const diff = Date.now() - new Date(value).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'Vừa hoạt động'
  if (diff < hour) return `${Math.max(Math.floor(diff / minute), 1)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(value))
}

export function roomInitials(room?: Pick<CommunityRoom, 'name' | 'slug'> | null, fallback = 'MS') {
  const source = room?.name || room?.slug || fallback
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || fallback
}
