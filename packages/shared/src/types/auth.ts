export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "RECRUITER" | "CANDIDATE";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser extends User {
  companies?: { id: string; name: string; role: UserRole }[];
}
