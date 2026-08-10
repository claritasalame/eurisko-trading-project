const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
export const AUTH_TOKEN_STORAGE_KEY = "eurisko-auth-token";

export type AuthUser = {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
};

export type QuoteResponse = {
  symbol: string;
  price: number;
  day_change_percent: number;
  volume: number | null;
  fetched_at: string;
  currency: string;
};

export type NewsArticleResponse = {
  id: string;
  source: string;
  headline: string;
  publishedAt: string;
  symbol?: string;
  url?: string;
};

export type ChatSessionResponse = {
  id: string;
  user_id: string;
  created_at: string;
};

type NewsArticleApiResponse = {
  id: string;
  source: string;
  title: string;
  published_at: string;
  url: string;
};

export type MarketHistoryPoint = {
  timestamp: string;
  price: number;
  sma: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
};

export type ChatSessionListResponse = ChatSessionResponse & {
  preview: string;
  last_activity_at: string;
};

export type ChatMessageResponse = {
  id: string;
  chat_session_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type AdminUserResponse = AuthUser;

export type UserProfileResponse = {
  id: string;
  user_id: string;
  cash_balance: number;
  risk_tolerance: "conservative" | "moderate" | "aggressive" | null;
  investment_goals: string | null;
  experience_level: "beginner" | "intermediate" | "advanced" | null;
  updated_at: string;
};

export type HoldingResponse = {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_cost_basis: number;
  created_at: string;
};

export type AiQueryResponse = {
  answer: string;
  sources: Array<{ title: string; url: string; source: string }>;
  quote?: QuoteResponse | null;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function register(email: string, password: string): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function authenticate(email: string, password: string): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/auth/me");
}

export async function getQuote(symbol: string): Promise<QuoteResponse> {
  return apiRequest<QuoteResponse>(`/api/market-data/quote/${encodeURIComponent(symbol)}`);
}

export async function getNewsArticles(symbol: string): Promise<NewsArticleResponse[]> {
  const articles = await apiRequest<NewsArticleApiResponse[]>(`/api/news/articles?symbol=${encodeURIComponent(symbol)}`);
  return articles.map((article) => ({
    id: article.id,
    source: article.source,
    headline: article.title,
    publishedAt: article.published_at,
    url: article.url,
    symbol,
  }));
}

export async function getMarketHistory(symbol: string, range: string): Promise<MarketHistoryPoint[]> {
  return apiRequest<MarketHistoryPoint[]>(`/api/market-data/history/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range.toLowerCase())}`);
}

export async function getChatSessions(): Promise<ChatSessionListResponse[]> {
  return apiRequest<ChatSessionListResponse[]>(`/api/chat/sessions`);
}

export async function getChatSessionMessages(sessionId: string): Promise<ChatMessageResponse[]> {
  return apiRequest<ChatMessageResponse[]>(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
}

export async function createDemoSession(): Promise<ChatSessionResponse> {
  return apiRequest<ChatSessionResponse>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getProfile(userId: string): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(`/api/profile/${encodeURIComponent(userId)}`);
}

export async function updateProfile(
  userId: string,
  profile: Pick<UserProfileResponse, "cash_balance" | "risk_tolerance" | "investment_goals" | "experience_level">,
): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(`/api/profile/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function getHoldings(userId: string): Promise<HoldingResponse[]> {
  return apiRequest<HoldingResponse[]>(`/api/profile/${encodeURIComponent(userId)}/holdings`);
}

export async function addHolding(
  userId: string,
  holding: Pick<HoldingResponse, "symbol" | "quantity" | "average_cost_basis">,
): Promise<HoldingResponse> {
  return apiRequest<HoldingResponse>(`/api/profile/${encodeURIComponent(userId)}/holdings`, {
    method: "POST",
    body: JSON.stringify(holding),
  });
}

export async function deleteHolding(userId: string, holdingId: string): Promise<void> {
  await apiRequest<void>(
    `/api/profile/${encodeURIComponent(userId)}/holdings/${encodeURIComponent(holdingId)}`,
    { method: "DELETE" },
  );
}

export async function askAi(prompt: string): Promise<AiQueryResponse> {
  return apiRequest<AiQueryResponse>(`/api/ai/query`, {
    method: "POST",
    body: JSON.stringify({ query: prompt }),
  });
}

export function createChatSession(): Promise<ChatSessionResponse> {
  return apiRequest<ChatSessionResponse>("/api/chat/sessions", { method: "POST", body: JSON.stringify({}) });
}

export function sendChatMessage(sessionId: string, content: string, symbol?: string): Promise<AiQueryResponse> {
  return apiRequest<AiQueryResponse>(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, symbol }),
  });
}

export function getAdminUsers(): Promise<AdminUserResponse[]> {
  return apiRequest<AdminUserResponse[]>("/api/admin/users");
}

export function getAdminUserSessions(userId: string): Promise<ChatSessionResponse[]> {
  return apiRequest<ChatSessionResponse[]>(`/api/admin/users/${encodeURIComponent(userId)}/sessions`);
}

export function getAdminSessionMessages(userId: string, sessionId: string): Promise<ChatMessageResponse[]> {
  return apiRequest<ChatMessageResponse[]>(`/api/admin/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/messages`);
}
