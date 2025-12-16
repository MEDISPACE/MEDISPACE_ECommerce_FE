import axios from 'axios'
import { getAuthToken } from '../utils/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface MediaResponse {
    url: string
    type: number // 0: Image, 1: Video
}

interface UploadResponse {
    url: MediaResponse[]
    message: string
}

/**
 * Upload một ảnh lên S3
 * @param file - File ảnh cần upload
 * @returns S3 URL của ảnh
 */
export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)

    const token = getAuthToken()
    if (!token) {
        throw new Error('Vui lòng đăng nhập để upload ảnh')
    }

    try {
        const response = await axios.post<{ result: MediaResponse[]; message: string }>(
            `${API_URL}/medias/upload-image`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        if (response.data.result && response.data.result.length > 0) {
            return response.data.result[0].url
        }

        throw new Error('Không nhận được URL từ server')
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message
            throw new Error(`Upload ảnh thất bại: ${message}`)
        }
        throw error
    }
}

/**
 * Upload nhiều ảnh lên S3
 * @param files - Mảng các file ảnh (tối đa 4)
 * @returns Mảng S3 URLs
 */
export async function uploadImages(files: File[]): Promise<string[]> {
    if (files.length === 0) {
        return []
    }

    if (files.length > 4) {
        throw new Error('Chỉ được upload tối đa 4 ảnh cùng lúc')
    }

    const formData = new FormData()
    files.forEach((file) => {
        formData.append('image', file)
    })

    const token = getAuthToken()
    if (!token) {
        throw new Error('Vui lòng đăng nhập để upload ảnh')
    }

    try {
        const response = await axios.post<{ result: MediaResponse[]; message: string }>(
            `${API_URL}/medias/upload-image`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        if (response.data.result && response.data.result.length > 0) {
            return response.data.result.map((item) => item.url)
        }

        throw new Error('Không nhận được URL từ server')
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message
            throw new Error(`Upload ảnh thất bại: ${message}`)
        }
        throw error
    }
}

// TODO: Uncomment khi cần upload video
// /**
//  * Upload video lên S3
//  * @param file - File video (.mp4 hoặc .mov, tối đa 50MB)
//  * @returns S3 URL của video
//  */
// export async function uploadVideo(file: File): Promise<string> {
//   // Validate file size (50MB)
//   const maxSize = 50 * 1024 * 1024
//   if (file.size > maxSize) {
//     throw new Error('Video không được vượt quá 50MB')
//   }

//   // Validate file type
//   const validTypes = ['video/mp4', 'video/quicktime']
//   if (!validTypes.includes(file.type)) {
//     throw new Error('Chỉ hỗ trợ video định dạng MP4 hoặc MOV')
//   }

//   const formData = new FormData()
//   formData.append('video', file)

//   const token = getAuthToken()
//   if (!token) {
//     throw new Error('Vui lòng đăng nhập để upload video')
//   }

//   try {
//     const response = await axios.post<UploadResponse>(`${API_URL}/medias/upload-video`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//         Authorization: `Bearer ${token}`,
//       },
//     })

//     if (response.data.url && response.data.url.length > 0) {
//       return response.data.url[0].url
//     }

//     throw new Error('Không nhận được URL từ server')
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       const message = error.response?.data?.message || error.message
//       throw new Error(`Upload video thất bại: ${message}`)
//     }
//     throw error
//   }
// }

/**
 * Upload ảnh với progress callback
 * @param file - File ảnh
 * @param onProgress - Callback nhận progress (0-100)
 * @returns S3 URL
 */
export async function uploadImageWithProgress(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)

    const token = getAuthToken()
    if (!token) {
        throw new Error('Vui lòng đăng nhập để upload ảnh')
    }

    try {
        const response = await axios.post<{ result: MediaResponse[]; message: string }>(
            `${API_URL}/medias/upload-image`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        onProgress(percentCompleted)
                    }
                },
            }
        )

        if (response.data.result && response.data.result.length > 0) {
            return response.data.result[0].url
        }

        throw new Error('Không nhận được URL từ server')
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message
            throw new Error(`Upload ảnh thất bại: ${message}`)
        }
        throw error
    }
}

/**
 * Validate file ảnh trước khi upload
 * @param file - File cần validate
 * @param maxSizeMB - Kích thước tối đa (MB)
 * @returns true nếu hợp lệ, throw error nếu không
 */
export function validateImageFile(file: File, maxSizeMB: number = 2): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File phải là hình ảnh')
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
        throw new Error(`Kích thước file không được vượt quá ${maxSizeMB}MB`)
    }

    return true
}

export const mediaService = {
    uploadImage,
    uploadImages,
    // uploadVideo, // TODO: Uncomment khi cần
    uploadImageWithProgress,
    validateImageFile,
}
