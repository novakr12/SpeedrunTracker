import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Run } from './run.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { ReviewRunDto } from './dto/review-run.dto';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(Run)
    private readonly runsRepository: Repository<Run>,
    private readonly usersService: UsersService,
    private readonly gamesService: GamesService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(userId: string, dto: CreateRunDto): Promise<Run> {
    await this.validateReferences(userId, dto.gameId, dto.categoryId);
    const run = this.runsRepository.create({
      ...dto,
      userId,
      playedAt: dto.playedAt ? new Date(dto.playedAt) : undefined,
    });
    return this.runsRepository.save(run);
  }

  findAll(): Promise<Run[]> {
    return this.runsRepository.find({
      relations: { user: true, game: true, category: true },
      order: { timeMs: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Run> {
    const run = await this.runsRepository.findOne({
      where: { id },
      relations: { user: true, game: true, category: true },
    });
    if (!run) {
      throw new NotFoundException(`Run ${id} not found`);
    }
    return run;
  }

  async update(id: string, dto: UpdateRunDto): Promise<Run> {
    if (dto.gameId || dto.categoryId) {
      const existing = await this.findOne(id);
      await this.validateReferences(
        existing.userId,
        dto.gameId ?? existing.gameId,
        dto.categoryId ?? existing.categoryId,
      );
    }
    const run = await this.runsRepository.preload({
      id,
      ...dto,
      playedAt: dto.playedAt ? new Date(dto.playedAt) : undefined,
    });
    if (!run) {
      throw new NotFoundException(`Run ${id} not found`);
    }
    return this.runsRepository.save(run);
  }

  async review(id: string, dto: ReviewRunDto): Promise<Run> {
    const run = await this.findOne(id);
    run.status = dto.status;
    run.reviewComment = dto.comment ?? null;
    run.reviewedAt = new Date();
    return this.runsRepository.save(run);
  }

  async remove(id: string): Promise<void> {
    const result = await this.runsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Run ${id} not found`);
    }
  }

  private async validateReferences(
    userId: string,
    gameId: string,
    categoryId: string,
  ): Promise<void> {
    await this.usersService.findOne(userId);
    await this.gamesService.findOne(gameId);
    const category = await this.categoriesService.findOne(categoryId);
    if (category.gameId !== gameId) {
      throw new BadRequestException(
        'Category does not belong to the given game',
      );
    }
  }
}
