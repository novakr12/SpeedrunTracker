import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
