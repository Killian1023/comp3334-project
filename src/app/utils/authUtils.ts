/**
 * Authentication utilities for managing user session
 */

/**
 * Log out the current user by clearing stored data
 * @returns Promise that resolves when logout is complete
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Clear all user-related data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('privateKey');
    
    // Clear any encryption keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('encryptionKey_')) {
        localStorage.removeItem(key);
      }
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Logout error:', error);
    return Promise.reject('Failed to log out properly');
  }
};

/**
 * Check if user is authenticated
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

/**
 * Get current user from localStorage
 * @returns User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Get auth token from localStorage
 * @returns Auth token or null
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};