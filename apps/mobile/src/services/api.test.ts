import { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// Store interceptor callbacks
let requestInterceptorFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
let requestInterceptorRejected: (error: unknown) => Promise<never>;
let responseInterceptorFulfilled: (response: unknown) => unknown;
let responseInterceptorRejected: (error: unknown) => Promise<unknown>;
let createCalledWith: unknown = null;

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: jest.fn((fulfilled, rejected) => {
          requestInterceptorFulfilled = fulfilled;
          requestInterceptorRejected = rejected;
          return 0;
        }),
      },
      response: {
        use: jest.fn((fulfilled, rejected) => {
          responseInterceptorFulfilled = fulfilled;
          responseInterceptorRejected = rejected;
          return 0;
        }),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  const mockCreate = jest.fn((config) => {
    createCalledWith = config;
    return mockAxiosInstance;
  });

  return {
    __esModule: true,
    default: {
      create: mockCreate,
    },
    create: mockCreate,
    AxiosHeaders: class MockAxiosHeaders {
      private headers: Record<string, string> = {};
      set(key: string, value: string) {
        this.headers[key] = value;
      }
      get(key: string) {
        return this.headers[key];
      }
    },
  };
});

describe('api service', () => {
  beforeAll(() => {
    // Import the api module to register interceptors
    require('./api');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset auth store
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  describe('axios instance creation', () => {
    it('should create axios instance with correct config', () => {
      expect(createCalledWith).toEqual({
        baseURL: expect.any(String),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      // Set token in store
      useAuthStore.getState().setToken('test-jwt-token');

      const mockHeaders = {
        Authorization: undefined as string | undefined,
        set: function(key: string, value: string) {
          if (key === 'Authorization') this.Authorization = value;
        },
      };
      
      const config = {
        headers: mockHeaders,
      } as unknown as InternalAxiosRequestConfig;

      const result = requestInterceptorFulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
    });

    it('should not add Authorization header when no token', () => {
      const mockHeaders = {
        Authorization: undefined as string | undefined,
        set: function(key: string, value: string) {
          if (key === 'Authorization') this.Authorization = value;
        },
      };
      
      const config = {
        headers: mockHeaders,
      } as unknown as InternalAxiosRequestConfig;

      const result = requestInterceptorFulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should reject on request error', async () => {
      const error = new Error('Request failed');

      await expect(requestInterceptorRejected(error)).rejects.toEqual(error);
    });
  });

  describe('response interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: { success: true } };

      const result = responseInterceptorFulfilled(response);

      expect(result).toEqual(response);
    });

    it('should logout user on 401 error', async () => {
      // First login
      useAuthStore.getState().login(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          phone: '+1234567890',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        'test-token'
      );

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      await expect(responseInterceptorRejected(error)).rejects.toEqual({
        message: 'Unauthorized',
        code: 'UNKNOWN_ERROR',
        statusCode: 401,
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('should handle 403 forbidden error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied', code: 'FORBIDDEN' },
        },
      };

      await expect(responseInterceptorRejected(error)).rejects.toEqual({
        message: 'Access denied',
        code: 'FORBIDDEN',
        statusCode: 403,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Access forbidden:', 'Access denied');
      consoleSpy.mockRestore();
    });

    it('should handle 500 server error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      await expect(responseInterceptorRejected(error)).rejects.toEqual({
        message: 'Internal server error',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Server error:', 'Internal server error');
      consoleSpy.mockRestore();
    });

    it('should handle timeout error', async () => {
      const error = {
        code: 'ECONNABORTED',
      };

      await expect(responseInterceptorRejected(error)).rejects.toEqual({
        message: 'Request timed out',
        code: 'TIMEOUT',
        statusCode: 0,
      });
    });

    it('should handle network error', async () => {
      const error = {
        code: 'ERR_NETWORK',
      };

      await expect(responseInterceptorRejected(error)).rejects.toEqual({
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      });
    });
  });
});
