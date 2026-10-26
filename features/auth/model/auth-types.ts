export type Credentials = {
  email: string;
  password: string;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type Problem = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  requestId?: string;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
};

export type AuthContextValue = AuthState & {
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  clearSession: () => void;
};

