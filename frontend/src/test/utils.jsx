import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import App from '../App';
import { USERS } from './server';
import { session } from '../utils/session';

// Renders the whole app at a given URL, optionally already logged in as "user" | "manager" | "admin".
// A fresh QueryClient per test (no retries) keeps tests independent and reproducible.
export function renderApp(route = '/', { as } = {}) {
  if (as) session.save(`token-${as}`, USERS[as]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
