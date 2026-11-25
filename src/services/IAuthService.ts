/** Trimmed view of the authenticated user shown in the UI. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export type AuthMode = 'fabric' | 'password';

export interface Credentials {
  email: string;
  password: string;
}

export interface IAuthService {
  readonly authMode: AuthMode;
  signIn(credentials?: Credentials): Promise<AuthUser>;
  signUp(credentials: Credentials): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  initEmbeddedAuth(): Promise<AuthUser | null>;
}

export function toAuthUser(user: {
  id: string;
  email: string;
  name?: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
  };
}
