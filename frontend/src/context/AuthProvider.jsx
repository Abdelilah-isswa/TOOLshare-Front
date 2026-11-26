import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import { authApi } from '../api/services';
import { setUnauthorizedHandler } from '../api/client';
import { session } from '../utils/session';

// Session state shared by the whole app (Context API): who is logged in, and the login/logout actions.
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => (session.getToken() ? session.getUser() : null));
  const [notice, setNotice] = useState('');

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
    queryClient.clear(); // never keep one account's cached data for the next one
  }, [queryClient]);

  const login = useCallback(async (credentials) => {
    const { token, user: loggedIn } = await authApi.login(credentials);
    session.save(token, loggedIn);
    setUser(loggedIn);
    setNotice('');
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    const { token, user: created } = await authApi.register(details);
    session.save(token, created);
    setUser(created);
    setNotice('');
    return created;
  }, []);

  // The Axios interceptor calls this on a 401 while logged in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setNotice('Votre session a expiré. Reconnectez-vous.');
    });
    return () => setUnauthorizedHandler(() => {});
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), notice, login, register, logout }),
    [user, notice, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
