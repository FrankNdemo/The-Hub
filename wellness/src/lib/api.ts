import type {
  BlogPost,
  BlogPostDraft,
  BookingInput,
  BookingRecord,
  NotificationItem,
  TherapistProfile,
  TherapistSession,
} from "@/types/wellness";

const FALLBACK_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const LOCALHOST_API_BASE_URL = "http://localhost:8000/api/v1";
const AUTH_STORAGE_KEY = "wellness-auth-v1";
const API_BASE_STORAGE_KEY = "wellness-api-base-v1";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isPrivateIpv4Host = (hostname: string) =>
  /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/.test(
    hostname,
  );

const isLoopbackHost = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  hostname === "::1" ||
  hostname === "[::1]";

const normalizeHostname = (hostname: string) => (hostname === "::1" ? "[::1]" : hostname);

const buildApiBaseUrl = (hostname: string, protocol = "http:") =>
  `${protocol === "https:" ? "https:" : "http:"}//${normalizeHostname(hostname)}:8000/api/v1`;

const parseStoredApiBaseUrl = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    return raw ? trimTrailingSlash(raw) : null;
  } catch {
    return null;
  }
};

const addApiBaseCandidate = (candidates: string[], candidate?: string | null) => {
  if (!candidate) {
    return;
  }

  const normalized = trimTrailingSlash(candidate);

  if (normalized && !candidates.includes(normalized)) {
    candidates.push(normalized);
  }
};

const getApiBaseCandidates = () => {
  const candidates: string[] = [];

  addApiBaseCandidate(candidates, preferredApiBaseUrl);
  addApiBaseCandidate(candidates, import.meta.env.VITE_API_BASE_URL);

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    if (hostname && (isLoopbackHost(hostname) || isPrivateIpv4Host(hostname))) {
      addApiBaseCandidate(candidates, buildApiBaseUrl(hostname, protocol));
    }
  }

  addApiBaseCandidate(candidates, FALLBACK_API_BASE_URL);
  addApiBaseCandidate(candidates, LOCALHOST_API_BASE_URL);

  return candidates;
};

let preferredApiBaseUrl: string | null = parseStoredApiBaseUrl();

const persistApiBaseUrl = (value: string | null) => {
  preferredApiBaseUrl = value ? trimTrailingSlash(value) : null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!preferredApiBaseUrl) {
      window.localStorage.removeItem(API_BASE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(API_BASE_STORAGE_KEY, preferredApiBaseUrl);
  } catch {
    // Ignore storage failures and keep the in-memory value only.
  }
};

export interface AuthTokens {
  access: string;
  refresh: string;
}

interface RequestOptions {
  auth?: boolean;
  retryOnAuth?: boolean;
}

export interface TherapistLoginResponse {
  access: string;
  refresh: string;
  therapist: TherapistProfile;
  therapistSession: TherapistSession;
}

export interface DashboardOverviewResponse {
  blogPosts: BlogPost[];
  bookings: BookingRecord[];
  notifications: NotificationItem[];
  therapist: TherapistProfile;
  therapistSession: TherapistSession;
}

interface SuccessResponse {
  success: boolean;
}

export interface BookingSuggestion {
  date: string;
  time: string;
  label?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const isLikelyNetworkErrorMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed")
  );
};

const parseStoredTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (typeof parsed.access !== "string" || typeof parsed.refresh !== "string") {
      return null;
    }

    return { access: parsed.access, refresh: parsed.refresh };
  } catch {
    return null;
  }
};

let authTokens: AuthTokens | null = parseStoredTokens();
let refreshPromise: Promise<AuthTokens | null> | null = null;

const fetchFromApi = async (path: string, init: RequestInit) => {
  const candidates = getApiBaseCandidates();
  let lastNetworkError: Error | null = null;

  for (const apiBaseUrl of candidates) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, init);
      persistApiBaseUrl(apiBaseUrl);
      return response;
    } catch (error) {
      if (error instanceof Error && isLikelyNetworkErrorMessage(error.message)) {
        lastNetworkError = error;
        continue;
      }

      throw error;
    }
  }

  if (lastNetworkError) {
    throw lastNetworkError;
  }

  throw new Error("Failed to fetch");
};

const persistTokens = (tokens: AuthTokens | null) => {
  authTokens = tokens;

  if (typeof window === "undefined") {
    return;
  }

  if (!tokens) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
};

const extractErrorMessage = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractErrorMessage(item);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.detail === "string") {
      return record.detail;
    }

    for (const nested of Object.values(record)) {
      const message = extractErrorMessage(nested);
      if (message) {
        return message;
      }
    }
  }

  return null;
};

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const refreshAuthTokens = async (): Promise<AuthTokens | null> => {
  if (!authTokens?.refresh) {
    persistTokens(null);
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetchFromApi("/auth/refresh/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: authTokens?.refresh }),
        });
        const payload = await parseResponseBody(response);

        if (!response.ok || !payload || typeof payload !== "object") {
          persistTokens(null);
          return null;
        }

        const parsed = payload as Partial<AuthTokens>;
        if (typeof parsed.access !== "string") {
          persistTokens(null);
          return null;
        }

        const nextTokens: AuthTokens = {
          access: parsed.access,
          refresh: typeof parsed.refresh === "string" ? parsed.refresh : authTokens!.refresh,
        };
        persistTokens(nextTokens);
        return nextTokens;
      } catch {
        persistTokens(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

const request = async <T>(
  path: string,
  init: RequestInit = {},
  { auth = true, retryOnAuth = true }: RequestOptions = {},
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && authTokens?.access) {
    headers.set("Authorization", `Bearer ${authTokens.access}`);
  }

  const response = await fetchFromApi(path, {
    ...init,
    headers,
  });

  if (response.status === 401 && auth && retryOnAuth && authTokens?.refresh) {
    const nextTokens = await refreshAuthTokens();

    if (nextTokens) {
      return request<T>(path, init, { auth, retryOnAuth: false });
    }
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload) ?? `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return payload as T;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return extractErrorMessage(error.data) ?? error.message;
  }

  if (error instanceof Error && isLikelyNetworkErrorMessage(error.message)) {
    return "Unable to reach the wellness API. Check that the Django server is running and that this frontend origin is allowed in CORS.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const getSuggestedBookingSlot = (error: unknown): BookingSuggestion | null => {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return null;
  }

  const payload = error.data as Record<string, unknown>;
  const date = payload.suggestedDate;
  const time = payload.suggestedTime;
  const label = payload.detail;

  if (typeof date !== "string" || typeof time !== "string") {
    return null;
  }

  return {
    date,
    time,
    label: typeof label === "string" ? label : undefined,
  };
};

export const getStoredAuthTokens = () => authTokens;

export const setStoredAuthTokens = (tokens: AuthTokens | null) => {
  persistTokens(tokens);
};

export const clearStoredAuthTokens = () => {
  persistTokens(null);
};

export const fetchPublicTherapist = () =>
  request<TherapistProfile>("/public/therapist/", { method: "GET" }, { auth: false });

export const fetchPublicBlogPosts = () =>
  request<BlogPost[]>("/blog/posts/", { method: "GET" }, { auth: false });

export const createBooking = (input: BookingInput) =>
  request<BookingRecord>(
    "/bookings/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );

export const fetchManageBooking = (token: string) =>
  request<BookingRecord>(`/bookings/manage/${token}/`, { method: "GET" }, { auth: false });

export const rescheduleManageBooking = (token: string, date: string, time: string) =>
  request<BookingRecord>(
    `/bookings/manage/${token}/reschedule/`,
    {
      method: "POST",
      body: JSON.stringify({ date, time }),
    },
    { auth: false },
  );

export const cancelManageBooking = (token: string) =>
  request<BookingRecord>(
    `/bookings/manage/${token}/cancel/`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    { auth: false },
  );

export const verifyTherapistPassphraseRequest = (passphrase: string) =>
  request<{ success: boolean; email: string }>(
    "/auth/verify-passphrase/",
    {
      method: "POST",
      body: JSON.stringify({ passphrase }),
    },
    { auth: false },
  );

export const loginTherapistRequest = async (email: string, password: string) => {
  const payload = await request<TherapistLoginResponse>(
    "/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false },
  );

  persistTokens({
    access: payload.access,
    refresh: payload.refresh,
  });

  return payload;
};

export const resetTherapistPasswordRequest = (email: string, secretPassphrase: string, nextPassword: string) =>
  request<SuccessResponse>(
    "/auth/reset-password/",
    {
      method: "POST",
      body: JSON.stringify({ email, secretPassphrase, nextPassword }),
    },
    { auth: false },
  );

export const fetchTherapistMe = () => request<{ therapist: TherapistProfile; therapistSession: TherapistSession }>("/auth/me/");

export const fetchDashboardOverview = () => request<DashboardOverviewResponse>("/dashboard/");

export const logoutTherapistRequest = async () => {
  const refresh = authTokens?.refresh;

  try {
    if (refresh) {
      await request<void>(
        "/auth/logout/",
        {
          method: "POST",
          body: JSON.stringify({ refresh }),
        },
        { retryOnAuth: false },
      );
    }
  } finally {
    persistTokens(null);
  }
};

export const updateTherapistProfileRequest = (profile: TherapistProfile) =>
  request<TherapistProfile>(
    "/dashboard/profile/",
    {
      method: "PATCH",
      body: JSON.stringify(profile),
    },
  );

export const updateTherapistPasswordRequest = (currentPassword: string, nextPassword: string) =>
  request<SuccessResponse>(
    "/dashboard/change-password/",
    {
      method: "POST",
      body: JSON.stringify({ currentPassword, nextPassword }),
    },
  );

export const updateTherapistSecretPassphraseRequest = (
  currentSecretPassphrase: string,
  nextSecretPassphrase: string,
) =>
  request<SuccessResponse>(
    "/dashboard/change-secret-passphrase/",
    {
      method: "POST",
      body: JSON.stringify({ currentSecretPassphrase, nextSecretPassphrase }),
    },
  );

export const completeBookingRequest = (id: string) =>
  request<BookingRecord>(
    `/dashboard/bookings/${id}/complete/`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );

export const deleteBookingRequest = (id: string, reason: string) =>
  request<SuccessResponse>(
    `/dashboard/bookings/${id}/delete/`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );

export const saveBlogPostRequest = (draft: BlogPostDraft) => {
  const path = draft.id ? `/dashboard/blog-posts/${draft.id}/` : "/dashboard/blog-posts/";
  const method = draft.id ? "PATCH" : "POST";

  return request<BlogPost>(
    path,
    {
      method,
      body: JSON.stringify(draft),
    },
  );
};

export const deleteBlogPostRequest = (id: string) =>
  request<void>(
    `/dashboard/blog-posts/${id}/`,
    {
      method: "DELETE",
    },
  );

export const deleteNotificationRequest = (id: string) =>
  request<void>(
    `/dashboard/notifications/${id}/`,
    {
      method: "DELETE",
    },
  );

export const markNotificationsReadRequest = () =>
  request<SuccessResponse>(
    "/dashboard/notifications/mark-read/",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
