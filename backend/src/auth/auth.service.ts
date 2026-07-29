import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthProfile, AuthTokenResponse } from './dto/auth-profile.types';
import { AppealsService } from '../appeals/appeals.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly appealsService: AppealsService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildToken(user);
  }

  async me(userId: string): Promise<AuthProfile> {
    return this.toProfile(await this.usersService.findOne(userId));
  }

  private async buildToken(user: User): Promise<AuthTokenResponse> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: await this.toProfile(user),
    };
  }

  // isBanned() treats an expired temporary ban as inactive, so the badge clears
  // itself once the ban runs out. The ban details are blanked in that case too,
  // so a served-out reason is not still exposed to the client.
  private async toProfile(user: User): Promise<AuthProfile> {
    const banned = this.usersService.isBanned(user);
    const appeal = banned
      ? await this.appealsService.findForCurrentBan(user)
      : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      banned,
      banReason: banned ? user.banReason : null,
      bannedUntil: banned ? user.bannedUntil : null,
      bannedAt: banned ? user.bannedAt : null,
      // One appeal per ban: offered only while the ban is active and unused.
      // An unban clears bannedAt, so findForCurrentBan() returns null and the
      // button disappears rather than reappearing.
      canAppeal: banned && !appeal,
      appeal: appeal
        ? {
            status: appeal.status,
            message: appeal.message,
            adminComment: appeal.adminComment,
            createdAt: appeal.createdAt,
            resolvedAt: appeal.resolvedAt,
          }
        : null,
    };
  }
}
