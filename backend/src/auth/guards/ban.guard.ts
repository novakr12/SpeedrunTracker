import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class BanGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      return true;
    }

    const user = await this.usersService.findOne(request.user.userId);
    if (!this.usersService.isBanned(user)) {
      return true;
    }

    const until = user.bannedUntil
      ? `until ${user.bannedUntil.toISOString().slice(0, 10)}`
      : 'permanently';
    const reason = user.banReason ? `: ${user.banReason}` : '';
    throw new ForbiddenException(
      `You are banned from submitting runs ${until}${reason}`,
    );
  }
}
