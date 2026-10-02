const TOKEN_KEY = "access_token";
const USER_ID_KEY = "current_user_id";

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),

  getUserId: (): string | null => localStorage.getItem(USER_ID_KEY),
  setUserId: (id: string): void => localStorage.setItem(USER_ID_KEY, id),
  removeUserId: (): void => localStorage.removeItem(USER_ID_KEY),

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};
