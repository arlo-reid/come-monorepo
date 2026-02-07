import { useAuthStore } from './authStore';
import { User } from '../types';

describe('authStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    phone: '+1234567890',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockToken = 'jwt-token-abc123';

  describe('initial state', () => {
    it('should have null user initially', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('should have null token initially', () => {
      const { token } = useAuthStore.getState();
      expect(token).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });

    it('should be loading initially', () => {
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set the user', () => {
      useAuthStore.getState().setUser(mockUser);
      
      const { user } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
    });
  });

  describe('setToken', () => {
    it('should set the token', () => {
      useAuthStore.getState().setToken(mockToken);
      
      const { token } = useAuthStore.getState();
      expect(token).toBe(mockToken);
    });
  });

  describe('login', () => {
    it('should set user, token, and authentication state', () => {
      useAuthStore.getState().login(mockUser, mockToken);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user, token, and authentication state', () => {
      // First login
      useAuthStore.getState().login(mockUser, mockToken);
      
      // Then logout
      useAuthStore.getState().logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading to false', () => {
      useAuthStore.getState().setLoading(false);
      
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should set loading to true', () => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setLoading(true);
      
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(true);
    });
  });

  describe('state persistence across actions', () => {
    it('should maintain other state when setting user', () => {
      useAuthStore.getState().setToken(mockToken);
      useAuthStore.getState().setUser(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
    });
  });
});
