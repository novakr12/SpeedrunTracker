import { ManagedUser } from './user.model';

export type AppealStatus = 'open' | 'accepted' | 'rejected';

export interface BanAppeal {
  id: string;
  userId: string;
  banIssuedAt: string;
  message: string;
  status: AppealStatus;
  adminComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  // The API loads the full user relation, so ban details ride along with the
  // appeal and the moderator can see what is actually being appealed.
  user?: ManagedUser;
}

export interface CreateAppealDto {
  message: string;
}

export interface ResolveAppealDto {
  status: 'accepted' | 'rejected';
  comment?: string;
}
