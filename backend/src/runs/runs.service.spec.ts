import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RunsService } from './runs.service';
import { Run } from './run.entity';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { CategoriesService } from '../categories/categories.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

const CATEGORY_ID = 'category-1';
const GAME_ID = 'game-1';

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-1',
    userId: 'user-1',
    gameId: GAME_ID,
    categoryId: CATEGORY_ID,
    timeMs: 1000,
    status: 'accepted',
    segments: [],
    user: { id: 'user-1', username: 'ada' },
    ...overrides,
  } as Run;
}

function makeSegment(id: string, name: string, position: number) {
  return { id, name, position, categoryId: CATEGORY_ID };
}

function timedSegment(segmentId: string, durationMs: number) {
  return { segmentId, durationMs };
}

describe('RunsService', () => {
  let service: RunsService;
  let repository: Record<string, jest.Mock>;
  let categoriesService: Record<string, jest.Mock>;
  let gamesService: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(makeRun()),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 'saved-run' })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      preload: jest.fn(async (value) => value),
    };
    categoriesService = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: CATEGORY_ID, gameId: GAME_ID, segments: [] }),
      findByGame: jest.fn().mockResolvedValue([]),
    };
    gamesService = {
      findOne: jest.fn().mockResolvedValue({ id: GAME_ID, title: 'Celeste' }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RunsService,
        { provide: getRepositoryToken(Run), useValue: repository },
        { provide: UsersService, useValue: { findOne: jest.fn() } },
        { provide: GamesService, useValue: gamesService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    service = moduleRef.get(RunsService);
  });

  describe('segment validation on create', () => {
    const dto = {
      gameId: GAME_ID,
      categoryId: CATEGORY_ID,
      timeMs: 600,
    };

    function withSegments(segments: { id: string; name: string }[]) {
      categoriesService.findOne.mockResolvedValue({
        id: CATEGORY_ID,
        gameId: GAME_ID,
        segments: segments.map((segment, index) =>
          makeSegment(segment.id, segment.name, index),
        ),
      });
    }

    it('accepts a run submitted without any segments', async () => {
      await service.create('user-1', dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ segments: undefined }),
      );
    });

    it('rejects segments when the category defines none', async () => {
      await expect(
        service.create('user-1', {
          ...dto,
          segments: [timedSegment('s1', 600)],
        }),
      ).rejects.toThrow('This category does not define any segments');
    });

    it('rejects the same segment timed twice', async () => {
      withSegments([
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ]);

      await expect(
        service.create('user-1', {
          ...dto,
          segments: [timedSegment('s1', 300), timedSegment('s1', 300)],
        }),
      ).rejects.toThrow('Each segment can only be timed once');
    });

    it('rejects a partial set of segments', async () => {
      withSegments([
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ]);

      await expect(
        service.create('user-1', {
          ...dto,
          segments: [timedSegment('s1', 600)],
        }),
      ).rejects.toThrow(
        'Segment times must cover exactly the segments defined by the category',
      );
    });

    it('rejects a segment that belongs to another category', async () => {
      withSegments([
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ]);

      await expect(
        service.create('user-1', {
          ...dto,
          segments: [timedSegment('s1', 300), timedSegment('other', 300)],
        }),
      ).rejects.toThrow(
        'Segment times must cover exactly the segments defined by the category',
      );
    });

    it('rejects segment times that do not add up to the total', async () => {
      withSegments([
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ]);

      await expect(
        service.create('user-1', {
          ...dto,
          segments: [timedSegment('s1', 300), timedSegment('s2', 299)],
        }),
      ).rejects.toThrow('Segment times must add up to the total run time');
    });

    it('stores segments when they cover the category and add up exactly', async () => {
      withSegments([
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ]);

      await service.create('user-1', {
        ...dto,
        segments: [timedSegment('s1', 250), timedSegment('s2', 350)],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          segments: [
            { segmentId: 's1', durationMs: 250 },
            { segmentId: 's2', durationMs: 350 },
          ],
        }),
      );
    });

    it('rejects a category that belongs to a different game', async () => {
      categoriesService.findOne.mockResolvedValue({
        id: CATEGORY_ID,
        gameId: 'another-game',
        segments: [],
      });

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('leaderboardForGame', () => {
    beforeEach(() => {
      categoriesService.findByGame.mockResolvedValue([
        {
          id: CATEGORY_ID,
          name: 'Any%',
          segments: [makeSegment('s1', 'First', 0), makeSegment('s2', 'Second', 1)],
        },
      ]);
    });

    it('ranks runs by time and gives tied runs the same rank', async () => {
      repository.find.mockResolvedValue([
        makeRun({ id: 'a', userId: 'u1', timeMs: 100 }),
        makeRun({ id: 'b', userId: 'u2', timeMs: 200 }),
        makeRun({ id: 'c', userId: 'u3', timeMs: 200 }),
        makeRun({ id: 'd', userId: 'u4', timeMs: 300 }),
      ]);

      const board = await service.leaderboardForGame(GAME_ID);

      expect(board.categories[0].entries.map((e) => e.rank)).toEqual([
        1, 2, 2, 4,
      ]);
    });

    it('keeps only the best run per runner', async () => {
      repository.find.mockResolvedValue([
        makeRun({ id: 'fast', userId: 'u1', timeMs: 100 }),
        makeRun({ id: 'slow', userId: 'u1', timeMs: 500 }),
        makeRun({ id: 'other', userId: 'u2', timeMs: 300 }),
      ]);

      const board = await service.leaderboardForGame(GAME_ID);

      expect(board.categories[0].entries.map((e) => e.runId)).toEqual([
        'fast',
        'other',
      ]);
    });

    it('takes segment bests from every accepted run, not just the ranked ones', async () => {
      repository.find.mockResolvedValue([
        makeRun({
          id: 'fast',
          userId: 'u1',
          timeMs: 100,
          segments: [timedSegment('s1', 60), timedSegment('s2', 40)] as any,
        }),
        makeRun({
          id: 'slow',
          userId: 'u1',
          timeMs: 500,
          segments: [timedSegment('s1', 10), timedSegment('s2', 490)] as any,
        }),
      ]);

      const board = await service.leaderboardForGame(GAME_ID);
      const bests = board.categories[0].segmentBests;

      expect(bests.map((best) => best.durationMs)).toEqual([10, 40]);
      expect(bests.map((best) => best.runId)).toEqual(['slow', 'fast']);
    });

    it('sums the best segments into a theoretical best time', async () => {
      repository.find.mockResolvedValue([
        makeRun({
          id: 'a',
          userId: 'u1',
          timeMs: 100,
          segments: [timedSegment('s1', 60), timedSegment('s2', 40)] as any,
        }),
        makeRun({
          id: 'b',
          userId: 'u2',
          timeMs: 110,
          segments: [timedSegment('s1', 50), timedSegment('s2', 60)] as any,
        }),
      ]);

      const board = await service.leaderboardForGame(GAME_ID);

      expect(board.categories[0].sumOfBestMs).toBe(90);
    });

    it('leaves the theoretical best empty while a segment has no times', async () => {
      repository.find.mockResolvedValue([
        makeRun({
          id: 'a',
          userId: 'u1',
          timeMs: 100,
          segments: [timedSegment('s1', 100)] as any,
        }),
      ]);

      const board = await service.leaderboardForGame(GAME_ID);

      expect(board.categories[0].sumOfBestMs).toBeNull();
    });

    it('returns an empty category when nothing has been accepted', async () => {
      repository.find.mockResolvedValue([]);

      const board = await service.leaderboardForGame(GAME_ID);

      expect(board.categories[0].entries).toEqual([]);
      expect(board.categories[0].sumOfBestMs).toBeNull();
    });
  });

  describe('personalBests', () => {
    it('returns nothing when the runner has no accepted runs', async () => {
      repository.find.mockResolvedValueOnce([]);

      await expect(service.personalBests('user-1')).resolves.toEqual([]);
    });

    it('keeps only the fastest run per category', async () => {
      repository.find
        .mockResolvedValueOnce([
          makeRun({ id: 'fast', timeMs: 100, categoryId: 'c1' }),
          makeRun({ id: 'slow', timeMs: 500, categoryId: 'c1' }),
        ])
        .mockResolvedValueOnce([makeRun({ id: 'fast', timeMs: 100, categoryId: 'c1' })]);

      const bests = await service.personalBests('user-1');

      expect(bests).toHaveLength(1);
      expect(bests[0].runId).toBe('fast');
    });

    it('flags a personal best that is also the fastest overall', async () => {
      repository.find
        .mockResolvedValueOnce([makeRun({ id: 'mine', timeMs: 100, categoryId: 'c1' })])
        .mockResolvedValueOnce([makeRun({ id: 'mine', timeMs: 100, categoryId: 'c1' })]);

      const [best] = await service.personalBests('user-1');

      expect(best.isWorldRecord).toBe(true);
    });

    it('does not flag a personal best when someone else is faster', async () => {
      repository.find
        .mockResolvedValueOnce([makeRun({ id: 'mine', timeMs: 200, categoryId: 'c1' })])
        .mockResolvedValueOnce([
          makeRun({ id: 'theirs', userId: 'u2', timeMs: 100, categoryId: 'c1' }),
          makeRun({ id: 'mine', timeMs: 200, categoryId: 'c1' }),
        ]);

      const [best] = await service.personalBests('user-1');

      expect(best.isWorldRecord).toBe(false);
    });
  });

  describe('ownership rules', () => {
    const otherUser: AuthUser = {
      userId: 'someone-else',
      username: 'bob',
      role: 'user',
    };
    const admin: AuthUser = {
      userId: 'admin-1',
      username: 'admin',
      role: 'admin',
    };

    it('stops a runner from editing a run they do not own', async () => {
      repository.findOne.mockResolvedValue(
        makeRun({ userId: 'user-1', status: 'pending' }),
      );

      await expect(
        service.update('run-1', { timeMs: 10 }, otherUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('stops a runner from editing a run that was already reviewed', async () => {
      repository.findOne.mockResolvedValue(
        makeRun({ userId: 'user-1', status: 'accepted' }),
      );

      await expect(
        service.update(
          'run-1',
          { timeMs: 10 },
          { userId: 'user-1', username: 'ada', role: 'user' },
        ),
      ).rejects.toThrow('Only runs still awaiting verification can be edited');
    });

    it('lets an admin edit a reviewed run belonging to someone else', async () => {
      repository.findOne.mockResolvedValue(
        makeRun({ userId: 'user-1', status: 'accepted' }),
      );

      await expect(
        service.update('run-1', { timeMs: 10 }, admin),
      ).resolves.toBeDefined();
    });

    it('stops a runner from deleting a run they do not own', async () => {
      repository.findOne.mockResolvedValue(makeRun({ userId: 'user-1' }));

      await expect(service.remove('run-1', otherUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
