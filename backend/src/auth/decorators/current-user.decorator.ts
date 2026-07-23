import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserRole } from '../../users/user.entity';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
