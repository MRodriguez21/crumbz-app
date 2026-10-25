import { QueryClient } from '@tanstack/react-query';

// Tuned for slow/intermittent connections: keep data around and retry with backoff.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60_000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 2,
    },
  },
});
