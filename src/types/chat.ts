export interface User {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
  isOnline?: boolean
}

export interface Conversation {
  _id: string
  customerId: string
  pharmacistId?: string // optional – chưa assign khi shared inbox
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: {
    customer: number
    pharmacist: number
  }
  status: 'active' | 'closed'
  createdAt: string
  updatedAt: string
  customer?: User
  pharmacist?: User
}

export interface ProductRef {
  productId: string
  name: string
  slug: string
  price: number
  unit: string
  imageUrl?: string
  requiresPrescription?: boolean
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderRole: 'customer' | 'pharmacist'
  content: string
  type: 'text' | 'image' | 'product'
  imageUrl?: string
  productRef?: ProductRef
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface SendMessagePayload {
  conversationId?: string
  pharmacistId?: string
  content?: string
  type?: 'text' | 'image' | 'product'
  imageUrl?: string
  productRef?: ProductRef
}

export interface GetConversationsParams {
  page?: number
  limit?: number
  status?: 'active' | 'closed'
}

export interface GetMessagesParams {
  conversationId: string
  page?: number
  limit?: number
}

export interface ConversationsResponse {
  conversations: Conversation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MessagesResponse {
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
