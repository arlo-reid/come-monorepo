import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client with sensible defaults for mobile
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache time - how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus for mobile
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect for better offline experience
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query keys for type-safe cache invalidation
 */
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Groups
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  groupMessages: (groupId: string) => ['groups', groupId, 'messages'] as const,
  groupMembers: (groupId: string) => ['groups', groupId, 'members'] as const,
  
  // Events
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  groupEvents: (groupId: string) => ['groups', groupId, 'events'] as const,
  
  // Users
  user: (id: string) => ['users', id] as const,
} as const;

export default queryClient;
