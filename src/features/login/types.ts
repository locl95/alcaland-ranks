export interface Authorization {
  userName: string;
  token: string;
  lastUsed: string;
  validUntil: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginState {
  accessToken?: string;
  refreshToken?: string;
  user?: string;
  roles?: string[];
}
