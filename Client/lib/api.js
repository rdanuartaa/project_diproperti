import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle error dengan lebih baik
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika 401 (Unauthorized) atau 404 (Not Found)
    if (error.response?.status === 401 || error.response?.status === 404) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Jangan redirect otomatis, biarkan component handle sendiri
      }
    }
    return Promise.reject(error);
  }
);

export default api;