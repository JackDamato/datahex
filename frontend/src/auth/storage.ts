/**
 * Authentication storage utilities
 * Handles localStorage-based token management for development auth
 */

export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('authToken');
};

export const isAuthed = (): boolean => {
  return !!getToken();
};

/**
 * Parse username from fake JWT token
 */
export const getUsernameFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Token format: "fake.{base64payload}.token"
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'fake') return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
};