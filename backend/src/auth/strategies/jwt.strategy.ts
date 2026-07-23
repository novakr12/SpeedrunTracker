import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../../users/user.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-in-production'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
