import { apiClient } from './apiClient'

interface UploadResponse {
  message: string
  result: {
    url: string
    type: number
  }[]
}

export const uploadService = {
  uploadImage: (formData: FormData, purpose?: 'prescription' | 'general') => {
    return apiClient.post<UploadResponse>('/medias/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: purpose ? { purpose } : undefined,
    })
  },
}
