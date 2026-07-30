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
  user?: ManagedUser;
}

export interface CreateAppealDto {
  message: string;
}

export interface ResolveAppealDto {
  status: 'accepted' | 'rejected';
  comment?: string;
}
