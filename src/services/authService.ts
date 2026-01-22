const TOKEN_KEY = "pickleGoalsAuthToken";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

const requireApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return apiBaseUrl;
};

export const authService = {
  getGoogleLoginUrl() {
    return `${requireApiBaseUrl()}/auth/google`;
  },
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
