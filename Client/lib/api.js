import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      config.headers.Accept = 'application/json';
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data instanceof FormData) {
        console.log('📦 [API] FormData:', Array.from(config.data.keys()));
      } else {
        console.log('📦 [API] Payload:', config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url;

    if (status === 401) {
      console.warn(`🔐 [API] Unauthorized: ${url}`);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } else if (status === 422) {
      console.warn('🔴 [API] Validation Error:', data?.errors);
    } else if (status === 403) {
      console.error('🚫 [API] Forbidden:', url, data?.message);
    } else if (status === 404) {
      console.warn('🔍 [API] Not Found:', url);
    } else if (status === 500) {
      console.error('💥 [API] Server Error:', data?.message || 'Internal Server Error');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [API] Request timeout:', url);
    } else if (error.message === 'Network Error') {
      console.error('🌐 [API] Network Error - Periksa koneksi internet atau server tidak aktif');
    } else if (!error.response) {
      console.error('🌐 [API] Network Error - Tidak dapat terhubung ke server:', error.message);
    }

    return Promise.reject(error);
  }
);

export const uploadWithProgress = (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
    timeout: 120000,
  });
};

export const downloadFile = async (url, filename) => {
  const response = await api.get(url, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default api;