const EMPTY_PREVIEW = 'Chưa có tin nhắn'
const PHARMACIST_OFFLINE_PREVIEW = 'Dược sĩ đang offline, AI tiếp tục hỗ trợ'

const normalizeForMatching = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const compactText = (value?: string) => value?.replace(/\s+/g, ' ').trim() || ''

const isPharmacistOfflineFallback = (value: string) => {
  const normalized = normalizeForMatching(value)

  return (
    normalized.includes('duoc si') &&
    (normalized.includes('khong online') || normalized.includes('dang offline') || normalized.includes('offline')) &&
    (normalized.includes('tro ly ai se tiep tuc ho tro') || normalized.includes('de lai loi nhan'))
  )
}

export const getConversationPreview = (lastMessage?: string) => {
  const preview = compactText(lastMessage)
  if (!preview) return EMPTY_PREVIEW
  if (isPharmacistOfflineFallback(preview)) return PHARMACIST_OFFLINE_PREVIEW
  return preview
}

export const getConversationPreviewTitle = (lastMessage?: string) => compactText(lastMessage)
