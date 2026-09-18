export const apiUrl = "/api";

export const adminToken =
  process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "dev-admin-token";

export const authStorageKey = "kindred-auth";

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  role: "professional" | "recruiter" | "admin";
  availableRoles: Array<"professional" | "recruiter" | "admin">;
  hasSwitchPin: boolean;
};

export type StoredSession = {
  token: string;
  user: SessionUser;
};

function summarizeResponseBody(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(authStorageKey);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function setStoredSession(session: StoredSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
}

export function getAuthHeaders(extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  const session = getStoredSession();

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  return headers;
}

export async function readJsonResponse<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = summarizeResponseBody(text);
    const receivedHtml =
      snippet.startsWith("<!DOCTYPE") || snippet.startsWith("<html");

    throw new Error(
      receivedHtml
        ? `Expected JSON from ${apiUrl}, but received an HTML page instead. Check that the Fastify API is running and NEXT_PUBLIC_API_URL points to the backend.`
        : `Expected JSON from ${apiUrl}, but received invalid response content: ${snippet || "empty response"}`,
    );
  }
}

export async function authedFetch(input: string, init?: RequestInit) {
  return fetch(input, {
    ...init,
    headers: getAuthHeaders(init?.headers),
  });
}
