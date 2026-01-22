const TOKEN_KEY = "pickleGoalsAuthToken";
const TOKEN_EVENT = "pickleGoalsAuthTokenChanged";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

const requireApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return apiBaseUrl;
};

export type AuthUser = {
  _id: string;
  googleId: string;
  email: string;
  displayName: string;
  photoUrl: string;
};

const request = async <T>(path: string, options: RequestInit = {}) => {
  const baseUrl = requireApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  return text ? (JSON.parse(text) as T) : (null as T);
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const emitTokenChange = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

export const authService = {
  getGoogleLoginUrl() {
    return `${requireApiBaseUrl()}/auth/google`;
  },
  getToken() {
    return getToken();
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    emitTokenChange();
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    emitTokenChange();
  },
  onTokenChange(callback: (token: string | null) => void) {
    if (typeof window === "undefined") {
      return () => undefined;
    }
    const handler = () => callback(getToken());
    window.addEventListener(TOKEN_EVENT, handler);
    return () => window.removeEventListener(TOKEN_EVENT, handler);
  },
  async getProfile() {
    return request<AuthUser>("/auth/profile", { headers: getAuthHeaders() });
  },
  async logout() {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },
};
