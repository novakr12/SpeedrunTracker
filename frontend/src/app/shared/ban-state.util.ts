import { BanAppeal } from '../core/models/appeal.model';

export type BanState = 'active' | 'expired' | 'lifted';

export function banStateOf(appeal: BanAppeal): BanState {
  const user = appeal.user;
  if (!user?.banned || !user.bannedAt) {
    return 'lifted';
  }
  if (
    new Date(user.bannedAt).getTime() !== new Date(appeal.banIssuedAt).getTime()
  ) {
    return 'lifted';
  }
  if (user.bannedUntil && new Date(user.bannedUntil).getTime() <= Date.now()) {
    return 'expired';
  }
  return 'active';
}
