import { UserRole } from '../../users/user.entity';
import { AppealStatus } from '../../appeals/appeal.entity';

export interface AuthProfileAppeal {
  status: AppealStatus;
  message: string;
  adminComment: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface AuthProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
  bannedUntil: Date | null;
  bannedAt: Date | null;
  canAppeal: boolean;
  appeal: AuthProfileAppeal | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthProfile;
}
