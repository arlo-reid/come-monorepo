import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../types';

// API base URL from environment
// In production, use react-native-config or similar for env management
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

/**
 * Axios instance configured for the Come API
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and token expiration
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const { response } = error;
    
    // Handle specific error codes
    if (response) {
      switch (response.status) {
        case 401:
          // Token expired or invalid - logout user
          useAuthStore.getState().logout();
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', response.data?.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', response.data?.message);
          break;
      }
      
      // Return structured error
      return Promise.reject({
        message: response.data?.message || 'An unexpected error occurred',
        code: response.data?.code || 'UNKNOWN_ERROR',
        statusCode: response.status,
      } as ApiError);
    }
    
    // Network error or request cancelled
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timed out',
        code: 'TIMEOUT',
        statusCode: 0,
      } as ApiError);
    }
    
    return Promise.reject({
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
      statusCode: 0,
    } as ApiError);
  }
);

export default api;
