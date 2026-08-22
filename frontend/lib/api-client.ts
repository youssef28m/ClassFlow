import type { AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: QueryParams;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function buildUrl(
  baseUrl: string,
  path: string,
  params?: QueryParams,
): string {
  if (!params) return `${baseUrl}${path}`;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
}

const AUTH_FREE_PATHS = [/^\/auth\/login$/, /^\/auth\/refresh$/];

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  0: "Unable to reach the server. Please check your connection.",
  400: "The request was invalid.",
  401: "You are not authenticated.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This resource already exists.",
  429: "Too many requests. Please try again later.",
  500: "Something went wrong on our end. Please try again.",
};

function extractFieldErrors(payload: unknown): Record<string, string[]> {
  if (payload === null || typeof payload !== "object") return {};
  const errors = (payload as { errors?: unknown }).errors;
  if (errors === null || typeof errors !== "object") return {};
  const { name, message } = errors as { name?: unknown; message?: unknown };
  if (name !== "ZodError" || typeof message !== "string") return {};

  let issues: Array<{ path?: Array<string | number>; message?: string }>;
  try {
    issues = JSON.parse(message);
  } catch {
    return {};
  }
  if (!Array.isArray(issues)) return {};

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    if (typeof issue.message !== "string") continue;
    const field = issue.path?.join(".") || "form";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return fieldErrors;
}

function createApiError(status: number, payload: unknown): ApiError {
  let message =
    DEFAULT_STATUS_MESSAGES[status] ?? `Request failed with status ${status}`;
  if (payload !== null && typeof payload === "object") {
    const candidate = (payload as { message?: unknown }).message;
    if (typeof candidate === "string" && candidate.length > 0) {
      message = candidate;
    }
  }
  return new ApiError(status, message, extractFieldErrors(payload));
}

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

type SessionListener = (session: AuthSession | null) => void;
const sessionListeners = new Set<SessionListener>();
const unauthorizedListeners = new Set<() => void>();

function notifyUnauthorized(): void {
  accessToken = null;
  for (const listener of sessionListeners) listener(null);
  for (const listener of unauthorizedListeners) listener();
}

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      notifyUnauthorized();
      return false;
    }
    const session = (await res.json()) as AuthSession;
    accessToken = session.accessToken;
    for (const listener of sessionListeners) listener(session);
    return true;
  } catch {
    notifyUnauthorized();
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  setAuthToken(token: string | null): void {
    accessToken = token;
  },

  onSessionChange(listener: SessionListener): () => void {
    sessionListeners.add(listener);
    return () => sessionListeners.delete(listener);
  },

  onUnauthorized(listener: () => void): () => void {
    unauthorizedListeners.add(listener);
    return () => unauthorizedListeners.delete(listener);
  },

  async request<T>(
    path: string,
    options: RequestOptions = {},
    isRetry = false,
  ): Promise<T> {
    if (!API_URL) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let res: Response;
    try {
      res = await fetch(buildUrl(API_URL, path, options.params), {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        credentials: "include",
        cache: "no-store",
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      throw createApiError(0, null);
    }

    const payload = await parseResponseBody(res);

    if (!res.ok) {
      const isAuthFreePath = AUTH_FREE_PATHS.some((pattern) =>
        pattern.test(path),
      );
      if (res.status === 401 && !isRetry && !isAuthFreePath) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return apiClient.request<T>(path, options, true);
        }
      }
      throw createApiError(res.status, payload);
    }

    return payload as T;
  },
};

export const authApi = {
  login(credentials: LoginCredentials): Promise<AuthSession> {
    return apiClient.request<AuthSession>("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  me(): Promise<{ user: AuthUser }> {
    return apiClient.request<{ user: AuthUser }>("/auth/me");
  },

  logout(): Promise<void> {
    return apiClient.request<void>("/auth/logout", { method: "POST" });
  },

  logoutAll(): Promise<void> {
    return apiClient.request<void>("/auth/logout-all", { method: "POST" });
  },
};
