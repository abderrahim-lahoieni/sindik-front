export enum Role {
  A = 'ADMIN',
  S = 'SYNDIC',
  R = 'RESIDENT',
  F = 'FINANCE_MANAGER'
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: Role;
  expiresIn?: number;
  uuid?: string | null;
}

export interface JwtPayload {
  sub: string;
  authorities: string[];
  exp: number;
  tokenType: 'access' | 'refresh';
}
