// Centralized API service for consistent URL handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = {
  // Helper function to build full API URLs
  url: (endpoint: string) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
  },

  // Helper function for authenticated requests
  request: async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('bookon_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    return fetch(api.url(endpoint), {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  },

  // Common HTTP methods
  get: (endpoint: string, options?: RequestInit) => 
    api.request(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    api.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    api.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: (endpoint: string, data?: any, options?: RequestInit) =>
    api.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (endpoint: string, options?: RequestInit) =>
    api.request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
