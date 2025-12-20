import { apiClient } from './apiClient'

interface ContactData {
    name: string
    email: string
    phone: string
    subject: string
    message: string
}

class ContactService {
    async sendMessage(data: ContactData): Promise<void> {
        try {
            await apiClient.post('/contact', data)
        } catch (error) {
            console.error('Send contact message error:', error)
            throw error
        }
    }
}

export const contactService = new ContactService()
