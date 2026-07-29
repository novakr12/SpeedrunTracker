import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const patch: Partial<User> = { ...dto };
    if (dto.password) {
      patch.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.usersRepository.preload({ id, ...patch });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.usersRepository.save(user);
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

  async ban(id: string, dto: BanUserDto): Promise<User> {
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
    return this.usersRepository.save(user);
  }

  async unban(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.banned = false;
    user.bannedUntil = null;
    user.banReason = null;
    user.bannedAt = null;
    // Cleared too, otherwise a later ban would inherit this one's run.
    user.banRunId = null;
    return this.usersRepository.save(user);
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
