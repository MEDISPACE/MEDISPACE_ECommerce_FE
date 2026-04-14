import { apiClient } from './apiClient'
import type {
  Conversation,
  ConversationsResponse,
  GetConversationsParams,
  GetMessagesParams,
  Message,
  MessagesResponse,
  SendMessagePayload,
} from '../types/chat'
import type { AxiosError } from 'axios'

class ChatService {
  // Get all conversations for current user
  async getConversations(params?: GetConversationsParams): Promise<ConversationsResponse> {
    try {
      const response = await apiClient.get<{ message: string; result: ConversationsResponse }>('/chats/conversations', {
        params,
      })
      return response.data.result
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to get conversations' }
    }
  }

  // Get or create conversation (Customer only - shared inbox)
  async getOrCreateConversation(): Promise<Conversation> {
    try {
      const response = await apiClient.post<{ message: string; result: Conversation }>('/chats/conversations')
      return response.data.result
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to create conversation' }
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId: string): Promise<Conversation> {
    try {
      const response = await apiClient.get<{ message: string; result: Conversation }>(
        `/chats/conversations/${conversationId}`,
      )
      return response.data.result
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to get conversation' }
    }
  }

  // Send a message
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    try {
      const response = await apiClient.post<{ message: string; result: Message }>('/chats/messages', payload)
      return response.data.result
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to send message' }
    }
  }

  // Get messages for a conversation
  async getMessages(params: GetMessagesParams): Promise<MessagesResponse> {
    try {
      const response = await apiClient.get<{ message: string; result: MessagesResponse }>('/chats/messages', {
        params,
      })
      return response.data.result
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to get messages' }
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.post('/chats/messages/read', { conversationId })
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to mark messages as read' }
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/conversations/${conversationId}`)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to delete conversation' }
    }
  }

  // (3.5) Dược sĩ tự nhận conversation
  async assignConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/chats/conversations/${conversationId}/assign`)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to assign conversation' }
    }
  }
}

export const chatService = new ChatService()
export default chatService
