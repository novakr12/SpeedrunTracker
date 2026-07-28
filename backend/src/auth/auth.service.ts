import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthProfile, AuthTokenResponse } from './dto/auth-profile.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  private buildToken(user: User): AuthTokenResponse {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toProfile(user),
    };
  }

  // isBanned() treats an expired temporary ban as inactive, so the badge clears
  // itself once the ban runs out. The ban details are blanked in that case too,
  // so a served-out reason is not still exposed to the client.
  private toProfile(user: User): AuthProfile {
    const banned = this.usersService.isBanned(user);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      banned,
      banReason: banned ? user.banReason : null,
      bannedUntil: banned ? user.bannedUntil : null,
      bannedAt: banned ? user.bannedAt : null,
    };
  }
}
