export enum Role {
  A = 'ADMIN',
  S = 'SYNDIC',
  R = 'RESIDENT'
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
  expiresIn:number;
  uuid:string;
}

export interface JwtPayload {
  sub: string;
  authorities: string[];
  exp: number;
}
