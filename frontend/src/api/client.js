import axios from 'axios';
import { session } from '../utils/session';
import { toApiError } from '../utils/errors';

// Same-origin "/api" by default: Vite proxy in dev, nginx in Docker. No secret lives here.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 10000 });

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// Request: attach the JWT when there is one.
api.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_CALLS = ['/auth/login', '/auth/register', '/installation'];

// Response: normalise errors; a 401 on a logged-in session means the token is gone or expired.
// A 403 is not a session problem: it reaches the screen as an "access denied" message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    const isAuthCall = AUTH_CALLS.some((path) => error.config?.url?.startsWith(path));
    if (apiError.status === 401 && !isAuthCall && session.getToken()) onUnauthorized();
    return Promise.reject(apiError);
  }
);
