import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { Run } from '../runs/run.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';

export const AUTO_REJECT_PREFIX = 'Auto-rejected: user banned';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Run)
    private readonly runsRepository: Repository<Run>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) {
      throw new ConflictException('Email or username already in use');
    }
    const user = this.usersRepository.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
      role: 'user',
    });
    return this.usersRepository.save(user);
  }

  async ensureAdmin(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (!existing) {
      const admin = this.usersRepository.create({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        role: 'admin',
      });
      await this.usersRepository.save(admin);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      await this.usersRepository.save(existing);
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  private findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorIsAdmin = false,
  ): Promise<User> {
    const { currentPassword, ...changes } = dto;

    if (changes.password && !actorIsAdmin) {
      if (!currentPassword) {
        throw new BadRequestException(
          'currentPassword is required to change your password',
        );
      }
      const existing = await this.findByIdWithPassword(id);
      if (
        !existing ||
        !(await bcrypt.compare(currentPassword, existing.password))
      ) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    await this.assertAvailable(id, changes.email, changes.username);

    const patch: Partial<User> = { ...changes };
    if (changes.password) {
      patch.password = await bcrypt.hash(changes.password, 10);
    }
    const user = await this.usersRepository.preload({ id, ...patch });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.usersRepository.save(user);
  }

  private async assertAvailable(
    id: string,
    email?: string,
    username?: string,
  ): Promise<void> {
    const where = [
      ...(email ? [{ email, id: Not(id) }] : []),
      ...(username ? [{ username, id: Not(id) }] : []),
    ];
    if (!where.length) {
      return;
    }
    if (await this.usersRepository.findOne({ where })) {
      throw new ConflictException('Email or username already in use');
    }
  }

  isBanned(user: User): boolean {
    if (!user.banned) {
      return false;
    }
    if (!user.bannedUntil) {
      return true;
    }
    return user.bannedUntil.getTime() > Date.now();
  }

  async ban(id: string, dto: BanUserDto, actorId?: string): Promise<User> {
    const user = await this.findOne(id);
    if (user.role === 'admin') {
      throw new ForbiddenException('Admins cannot be banned');
    }
    user.banned = true;
    user.bannedAt = new Date();
    user.banReason = dto.reason ?? null;
    user.banRunId = dto.runId ?? null;
    user.bannedUntil = dto.durationDays
      ? new Date(Date.now() + dto.durationDays * 24 * 60 * 60 * 1000)
      : null;
    const banned = await this.usersRepository.save(user);

    await this.runsRepository.update(
      { userId: id, status: 'pending' },
      {
        status: 'rejected',
        reviewComment: dto.reason
          ? `Auto-rejected: user banned (${dto.reason})`
          : 'Auto-rejected: user banned',
        reviewedAt: new Date(),
        reviewedById: actorId ?? null,
      },
    );

    return banned;
  }

  async unban(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.banned = false;
    user.bannedUntil = null;
    user.banReason = null;
    user.bannedAt = null;
    user.banRunId = null;
    const unbanned = await this.usersRepository.save(user);

    await this.runsRepository.update(
      {
        userId: id,
        status: 'rejected',
        reviewComment: Like(`${AUTO_REJECT_PREFIX}%`),
      },
      {
        status: 'pending',
        reviewComment: null,
        reviewedAt: null,
        reviewedById: null,
      },
    );

    return unbanned;
  }

  async findBanned(): Promise<User[]> {
    const users = await this.usersRepository.find({ where: { banned: true } });
    return users.filter((user) => this.isBanned(user));
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
