import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BanAppeal } from './appeal.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AppealsService {
  constructor(
    @InjectRepository(BanAppeal)
    private readonly appealsRepository: Repository<BanAppeal>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateAppealDto): Promise<BanAppeal> {
    const user = await this.usersService.findOne(userId);

    if (!this.usersService.isBanned(user) || !user.bannedAt) {
      throw new ForbiddenException('You are not currently banned');
    }

    if (await this.findForCurrentBan(user)) {
      throw new ConflictException('You have already appealed this ban');
    }

    const appeal = this.appealsRepository.create({
      userId,
      banIssuedAt: user.bannedAt,
      message: dto.message,
    });
    return this.appealsRepository.save(appeal);
  }

  findForCurrentBan(user: User): Promise<BanAppeal | null> {
    if (!user.bannedAt) {
      return Promise.resolve(null);
    }
    return this.appealsRepository.findOne({
      where: { userId: user.id, banIssuedAt: user.bannedAt },
    });
  }

  findAll(): Promise<BanAppeal[]> {
    return this.appealsRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async resolve(id: string, dto: ResolveAppealDto): Promise<BanAppeal> {
    const appeal = await this.appealsRepository.findOne({ where: { id } });
    if (!appeal) {
      throw new NotFoundException(`Appeal ${id} not found`);
    }
    if (appeal.status !== 'open') {
      throw new ConflictException('This appeal has already been resolved');
    }
    appeal.status = dto.status;
    appeal.adminComment = dto.comment ?? null;
    appeal.resolvedAt = new Date();
    return this.appealsRepository.save(appeal);
  }
}
