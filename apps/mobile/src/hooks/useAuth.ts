import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryKeys } from '../services/queryClient';
import { useAuthStore } from '../store/authStore';
import { User, ApiError } from '../types';

// ============ API Types ============

interface SendOTPRequest {
  phone: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
}

interface VerifyOTPRequest {
  phone: string;
  code: string;
}

interface VerifyOTPResponse {
  user: User | null;
  token: string;
  isNewUser: boolean;
}

interface CreateProfileRequest {
  name: string;
  avatar?: string;
}

interface CreateProfileResponse {
  user: User;
}

interface LoginResponse {
  user: User;
  token: string;
}

// ============ Mutations ============

/**
 * Send OTP code to phone number
 */
export function useSendOTP() {
  return useMutation<SendOTPResponse, ApiError, SendOTPRequest>({
    mutationFn: async ({ phone }) => {
      const { data } = await api.post<SendOTPResponse>('/auth/send-otp', { phone });
      return data;
    },
  });
}

/**
 * Verify OTP code and get auth token
 */
export function useVerifyOTP() {
  const { login, setToken } = useAuthStore();
  
  return useMutation<VerifyOTPResponse, ApiError, VerifyOTPRequest>({
    mutationFn: async ({ phone, code }) => {
      const { data } = await api.post<VerifyOTPResponse>('/auth/verify-otp', { phone, code });
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        // Existing user - log them in
        login(data.user, data.token);
      } else {
        // New user - just set token for profile creation
        setToken(data.token);
      }
    },
  });
}

/**
 * Create profile for new user
 */
export function useCreateProfile() {
  const { login, token } = useAuthStore();
  
  return useMutation<CreateProfileResponse, ApiError, CreateProfileRequest>({
    mutationFn: async ({ name, avatar }) => {
      const { data } = await api.post<CreateProfileResponse>('/auth/create-profile', { 
        name, 
        avatar,
      });
      return data;
    },
    onSuccess: (data) => {
      if (token) {
        login(data.user, token);
      }
    },
  });
}

/**
 * Logout user - clears local state and invalidates token on server
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      // Attempt to invalidate token on server
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore errors - we still want to logout locally
      }
    },
    onSettled: () => {
      // Always clear local state and cache
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Refresh the current user's data
 */
export function useRefreshUser() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation<User, ApiError, void>({
    mutationFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.currentUser, user);
    },
  });
}

/**
 * Delete account permanently
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await api.delete('/auth/account');
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}
