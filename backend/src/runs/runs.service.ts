import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Run } from './run.entity';
import { CreateRunDto, RunSegmentDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { ReviewRunDto } from './dto/review-run.dto';
import {
  GameLeaderboard,
  LeaderboardEntry,
  PersonalBest,
  SegmentBest,
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
    const segments = await this.buildSegments(
      dto.categoryId,
      dto.timeMs,
      dto.segments,
    );
    const run = this.runsRepository.create({
      ...dto,
      segments,
      userId,
      playedAt: dto.playedAt ? new Date(dto.playedAt) : undefined,
    });
    const saved = await this.runsRepository.save(run);
    return this.findOne(saved.id);
  }

  findAll(): Promise<Run[]> {
    return this.runsRepository.find({
      relations: {
        user: true,
        game: true,
        category: true,
        reviewedBy: true,
        segments: true,
      },
      select: {
        user: { id: true, username: true },
        reviewedBy: { id: true, username: true },
      },
      order: { timeMs: 'ASC' },
    });
  }

  async personalBests(userId: string): Promise<PersonalBest[]> {
    const runs = await this.runsRepository.find({
      where: { userId, status: 'accepted' },
      relations: { game: true, category: true },
      order: { timeMs: 'ASC' },
    });

    const bestByCategory = new Map<string, Run>();
    for (const run of runs) {
      if (!bestByCategory.has(run.categoryId)) {
        bestByCategory.set(run.categoryId, run);
      }
    }
    if (!bestByCategory.size) {
      return [];
    }

    const contenders = await this.runsRepository.find({
      where: {
        categoryId: In([...bestByCategory.keys()]),
        status: 'accepted',
      },
      order: { timeMs: 'ASC' },
    });
    const worldRecords = new Map<string, number>();
    for (const run of contenders) {
      if (!worldRecords.has(run.categoryId)) {
        worldRecords.set(run.categoryId, run.timeMs);
      }
    }

    return [...bestByCategory.values()].map((run) => ({
      runId: run.id,
      gameId: run.gameId,
      gameTitle: run.game?.title ?? 'Unknown',
      categoryId: run.categoryId,
      categoryName: run.category?.name ?? 'Unknown',
      timeMs: run.timeMs,
      playedAt: run.playedAt ?? null,
      isWorldRecord: worldRecords.get(run.categoryId) === run.timeMs,
    }));
  }

  async leaderboardForGame(gameId: string): Promise<GameLeaderboard> {
    const game = await this.gamesService.findOne(gameId);
    const categories = await this.categoriesService.findByGame(gameId);
    const runs = await this.runsRepository.find({
      where: { gameId, status: 'accepted' },
      relations: { user: true, reviewedBy: true, segments: true },
      select: {
        user: { id: true, username: true },
        reviewedBy: { id: true, username: true },
      },
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

    const runsByCategory = new Map<string, Run[]>();
    for (const run of runs) {
      const bucket = runsByCategory.get(run.categoryId);
      if (bucket) {
        bucket.push(run);
      } else {
        runsByCategory.set(run.categoryId, [run]);
      }
    }

    return {
      gameId: game.id,
      gameTitle: game.title,
      categories: categories.map((category) => {
        const segmentBests = this.toSegmentBests(
          category.segments ?? [],
          runsByCategory.get(category.id) ?? [],
        );
        const complete = segmentBests.every(
          (best) => best.durationMs !== null,
        );
        return {
          categoryId: category.id,
          categoryName: category.name,
          entries: this.toRankedEntries(bestByCategory.get(category.id) ?? []),
          segmentBests,
          sumOfBestMs:
            segmentBests.length && complete
              ? segmentBests.reduce(
                  (sum, best) => sum + (best.durationMs ?? 0),
                  0,
                )
              : null,
        };
      }),
    };
  }

  async findOne(id: string): Promise<Run> {
    const run = await this.runsRepository.findOne({
      where: { id },
      relations: {
        user: true,
        game: true,
        category: true,
        reviewedBy: true,
        segments: true,
      },
      select: {
        user: { id: true, username: true },
        reviewedBy: { id: true, username: true },
      },
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

  async review(
    id: string,
    dto: ReviewRunDto,
    actor: AuthUser,
  ): Promise<Run> {
    await this.findOne(id);
    await this.runsRepository.update(id, {
      status: dto.status,
      reviewComment: dto.comment ?? null,
      reviewedAt: new Date(),
      reviewedById: actor.userId,
    });
    return this.findOne(id);
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
        verifiedBy: run.reviewedBy?.username ?? null,
        verifiedAt: run.reviewedAt ?? null,
        reviewComment: run.reviewComment ?? null,
        segments: (run.segments ?? []).map((segment) => ({
          segmentId: segment.segmentId,
          durationMs: segment.durationMs,
        })),
      };
    });
  }

  private toSegmentBests(
    segments: { id: string; name: string; position: number }[],
    runs: Run[],
  ): SegmentBest[] {
    return [...segments]
      .sort((a, b) => a.position - b.position)
      .map((segment) => {
        let best: { run: Run; durationMs: number } | null = null;
        for (const run of runs) {
          const recorded = run.segments?.find(
            (entry) => entry.segmentId === segment.id,
          );
          if (recorded && (!best || recorded.durationMs < best.durationMs)) {
            best = { run, durationMs: recorded.durationMs };
          }
        }
        return {
          segmentId: segment.id,
          segmentName: segment.name,
          position: segment.position,
          userId: best?.run.userId ?? null,
          username: best?.run.user?.username ?? null,
          runId: best?.run.id ?? null,
          durationMs: best?.durationMs ?? null,
        };
      });
  }

  private async buildSegments(
    categoryId: string,
    timeMs: number,
    provided: RunSegmentDto[] | undefined,
  ): Promise<{ segmentId: string; durationMs: number }[] | undefined> {
    if (!provided?.length) {
      return undefined;
    }

    const category = await this.categoriesService.findOne(categoryId);
    const defined = category.segments ?? [];
    if (!defined.length) {
      throw new BadRequestException(
        'This category does not define any segments',
      );
    }

    const providedIds = provided.map((segment) => segment.segmentId);
    if (new Set(providedIds).size !== providedIds.length) {
      throw new BadRequestException('Each segment can only be timed once');
    }

    const definedIds = new Set(defined.map((segment) => segment.id));
    if (
      providedIds.length !== definedIds.size ||
      providedIds.some((id) => !definedIds.has(id))
    ) {
      throw new BadRequestException(
        'Segment times must cover exactly the segments defined by the category',
      );
    }

    const total = provided.reduce(
      (sum, segment) => sum + segment.durationMs,
      0,
    );
    if (total !== timeMs) {
      throw new BadRequestException(
        'Segment times must add up to the total run time',
      );
    }

    return provided.map((segment) => ({
      segmentId: segment.segmentId,
      durationMs: segment.durationMs,
    }));
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
