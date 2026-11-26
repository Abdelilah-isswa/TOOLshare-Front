// Session persistence. localStorage is readable by any script running on the page, which is
// why the app never renders user content as HTML (see README, "Sécurité"). Every access is
// wrapped in try/catch because storage can be blocked or full.
const TOKEN_KEY = 'toolshare.token';
const USER_KEY = 'toolshare.user';

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const session = {
  getToken: () => safe(() => localStorage.getItem(TOKEN_KEY)),
  getUser: () => safe(() => JSON.parse(localStorage.getItem(USER_KEY))),
  save: (token, user) =>
    safe(() => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }),
  clear: () =>
    safe(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }),
};
