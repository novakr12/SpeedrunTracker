import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Run } from './run.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { ReviewRunDto } from './dto/review-run.dto';
import {
  GameLeaderboard,
  LeaderboardEntry,
} from './dto/leaderboard.types';
import { AuthUser } from '../auth/decorators/current-user.decorator';
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

  async leaderboardForGame(gameId: string): Promise<GameLeaderboard> {
    const game = await this.gamesService.findOne(gameId);
    const categories = await this.categoriesService.findByGame(gameId);
    const runs = await this.runsRepository.find({
      where: { gameId, status: 'accepted' },
      relations: { user: true },
      order: { timeMs: 'ASC' },
    });

    const bestByCategory = new Map<string, Run[]>();
    const seenRunners = new Map<string, Set<string>>();
    for (const run of runs) {
      let runners = seenRunners.get(run.categoryId);
      if (!runners) {
        runners = new Set<string>();
        seenRunners.set(run.categoryId, runners);
      }
      if (runners.has(run.userId)) {
        continue;
      }
      runners.add(run.userId);
      const best = bestByCategory.get(run.categoryId);
      if (best) {
        best.push(run);
      } else {
        bestByCategory.set(run.categoryId, [run]);
      }
    }

    return {
      gameId: game.id,
      gameTitle: game.title,
      categories: categories.map((category) => ({
        categoryId: category.id,
        categoryName: category.name,
        entries: this.toRankedEntries(bestByCategory.get(category.id) ?? []),
      })),
    };
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

  async update(id: string, dto: UpdateRunDto, actor: AuthUser): Promise<Run> {
    const existing = await this.findOne(id);
    this.assertOwnedBy(existing, actor);

    if (actor.role !== 'admin' && existing.status !== 'pending') {
      throw new ForbiddenException(
        'Only runs still awaiting verification can be edited',
      );
    }

    if (dto.gameId || dto.categoryId) {
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

  async remove(id: string, actor: AuthUser): Promise<void> {
    const run = await this.findOne(id);
    this.assertOwnedBy(run, actor);
    await this.runsRepository.delete(id);
  }

  private assertOwnedBy(run: Run, actor: AuthUser): void {
    if (actor.role !== 'admin' && run.userId !== actor.userId) {
      throw new ForbiddenException('You can only modify your own runs');
    }
  }

  private toRankedEntries(runs: Run[]): LeaderboardEntry[] {
    let previousTimeMs: number | null = null;
    let previousRank = 0;
    return runs.map((run, index) => {
      const rank = run.timeMs === previousTimeMs ? previousRank : index + 1;
      previousTimeMs = run.timeMs;
      previousRank = rank;
      return {
        rank,
        runId: run.id,
        userId: run.userId,
        username: run.user?.username ?? 'Unknown',
        timeMs: run.timeMs,
        videoUrl: run.videoUrl ?? undefined,
        playedAt: run.playedAt ?? null,
      };
    });
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
