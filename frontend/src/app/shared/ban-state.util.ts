import { BanAppeal } from '../core/models/appeal.model';

export type BanState = 'active' | 'expired' | 'lifted';

// An appeal is tied to one specific ban through banIssuedAt. If the user's
// current bannedAt no longer matches, that ban is gone — either lifted, or
// replaced by a newer one — and the moderator should see that before ruling.
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
