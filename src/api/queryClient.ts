import { QueryClient } from '@tanstack/react-query';

// 1min default staleTime: pokemon data (types, base stats...) barely ever
// changes, no reason to hit the api again every time a screen refocuses
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});
