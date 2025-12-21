import { apiClient } from './apiClient'
import { API_ENDPOINTS, UserRole } from '../constants'

interface Pharmacist {
    _id: string
    firstName: string
    lastName: string
    email: string
}

class PharmacistService {
    // Get list of pharmacists (for admin/testing)
    async getPharmacists(): Promise<Pharmacist[]> {
        try {
            // This endpoint might not exist yet - you may need to create it
            const response = await apiClient.get<{ result: { users: Pharmacist[] } }>(`${API_ENDPOINTS.ADMIN.USERS}?role=${UserRole.Pharmacist}&limit=10`)
            return response.data.result.users || []
        } catch (error) {

            return []
        }
    }

    // Get first available pharmacist
    async getFirstPharmacist(): Promise<string | null> {
        try {
            const pharmacists = await this.getPharmacists()
            return pharmacists.length > 0 ? pharmacists[0]._id : null
        } catch (error) {

            return null
        }
    }
}

export const pharmacistService = new PharmacistService()
export default pharmacistService
