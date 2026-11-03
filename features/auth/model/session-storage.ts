export type LocalSession = {
  userId: string | null;
  email: string | null;
  savedAt: number;
};

export const SESSION_STORAGE_KEY = "sf.session.v1";

const LOGOUT_PENDING_KEY = "sf.logout-pending.v1";

const EMPTY_IDENTITY = { userId: null, email: null } as const;

function readValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
  }
}

function removeValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
  }
}

function decodeTokenIdentity(token: string): { userId: string | null; email: string | null } {
  const payload = token.split(".")[1];

  if (!payload) {
    return EMPTY_IDENTITY;
  }

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const claims: unknown = JSON.parse(atob(padded));

    if (typeof claims !== "object" || claims === null) {
      return EMPTY_IDENTITY;
    }

    const { uid, sub, email } = claims as Record<string, unknown>;

    return {
      userId: typeof uid === "string" ? uid : typeof sub === "string" ? sub : null,
      email: typeof email === "string" ? email : null,
    };
  } catch {
    return EMPTY_IDENTITY;
  }
}

export function readStoredSession(): LocalSession | null {
  const raw = readValue(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalSession>;

    return {
      userId: typeof parsed.userId === "string" ? parsed.userId : null,
      email: typeof parsed.email === "string" ? parsed.email : null,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveStoredSession(accessToken: string): LocalSession {
  const session: LocalSession = {
    ...decodeTokenIdentity(accessToken),
    savedAt: Date.now(),
  };

  writeValue(SESSION_STORAGE_KEY, JSON.stringify(session));

  return session;
}

export function clearStoredSession() {
  removeValue(SESSION_STORAGE_KEY);
}

export function markLogoutPending() {
  writeValue(LOGOUT_PENDING_KEY, String(Date.now()));
}

export function hasPendingLogout() {
  return readValue(LOGOUT_PENDING_KEY) !== null;
}

export function clearPendingLogout() {
  removeValue(LOGOUT_PENDING_KEY);
}
