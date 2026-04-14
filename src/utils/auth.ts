/**
 * Get authentication token from localStorage
 * @returns Access token or null
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('medispace_access_token')
}

/**
 * Check if user is authenticated
 * @returns true if user has valid token
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
