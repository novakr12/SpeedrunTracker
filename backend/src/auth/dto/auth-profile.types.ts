import { UserRole } from '../../users/user.entity';

export interface AuthProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
  bannedUntil: Date | null;
  bannedAt: Date | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthProfile;
}
