import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CategorySegment } from './category-segment.entity';
import { RunSegment } from '../runs/run-segment.entity';
import { GamesService } from '../games/games.service';

const CATEGORY_ID = 'category-1';
const GAME_ID = 'game-1';

function existingSegment(id: string, name: string, position: number) {
  return { id, name, position, categoryId: CATEGORY_ID } as CategorySegment;
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categories: Record<string, jest.Mock>;
  let segments: Record<string, jest.Mock>;
  let runSegments: Record<string, jest.Mock>;

  beforeEach(async () => {
    categories = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: CATEGORY_ID, ...value })),
      preload: jest.fn(async (value) => value),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: CATEGORY_ID, gameId: GAME_ID, segments: [] }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    segments = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    runSegments = { count: jest.fn().mockResolvedValue(0) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categories },
        { provide: getRepositoryToken(CategorySegment), useValue: segments },
        { provide: getRepositoryToken(RunSegment), useValue: runSegments },
        {
          provide: GamesService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: GAME_ID }) },
        },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  it('numbers new segments by the order they were given', async () => {
    await service.create({
      name: 'Any%',
      gameId: GAME_ID,
      segments: ['First', 'Second', 'Third'],
    });

    expect(segments.save).toHaveBeenCalledWith([
      { categoryId: CATEGORY_ID, name: 'First', position: 0 },
      { categoryId: CATEGORY_ID, name: 'Second', position: 1 },
      { categoryId: CATEGORY_ID, name: 'Third', position: 2 },
    ]);
  });

  it('creates a category without touching segments when none are given', async () => {
    await service.create({ name: 'Any%', gameId: GAME_ID });

    expect(segments.save).not.toHaveBeenCalled();
  });

  it('keeps the id of a segment that survives an update', async () => {
    segments.find.mockResolvedValue([
      existingSegment('seg-1', 'First', 0),
      existingSegment('seg-2', 'Second', 1),
    ]);

    await service.update(CATEGORY_ID, {
      segments: ['First', 'Second', 'Third'],
    });

    const saved = segments.save.mock.calls[0][0];
    expect(saved[0].id).toBe('seg-1');
    expect(saved[1].id).toBe('seg-2');
    expect(saved[2].id).toBeUndefined();
  });

  it('renumbers segments when they are reordered', async () => {
    segments.find.mockResolvedValue([
      existingSegment('seg-1', 'First', 0),
      existingSegment('seg-2', 'Second', 1),
    ]);

    await service.update(CATEGORY_ID, { segments: ['Second', 'First'] });

    const saved = segments.save.mock.calls[0][0];
    expect(saved.map((row: CategorySegment) => [row.id, row.position])).toEqual([
      ['seg-2', 0],
      ['seg-1', 1],
    ]);
  });

  it('deletes a segment that is dropped and has no recorded times', async () => {
    segments.find.mockResolvedValue([
      existingSegment('seg-1', 'First', 0),
      existingSegment('seg-2', 'Second', 1),
    ]);

    await service.update(CATEGORY_ID, { segments: ['First'] });

    const criteria = segments.delete.mock.calls[0][0];
    expect(criteria.id.value).toEqual(['seg-2']);
  });

  it('refuses to drop a segment that runs have already timed', async () => {
    segments.find.mockResolvedValue([
      existingSegment('seg-1', 'First', 0),
      existingSegment('seg-2', 'Second', 1),
    ]);
    runSegments.count.mockResolvedValue(3);

    await expect(
      service.update(CATEGORY_ID, { segments: ['First'] }),
    ).rejects.toThrow(
      'Segments that already have recorded run times cannot be removed',
    );
    expect(segments.delete).not.toHaveBeenCalled();
  });

  it('leaves segments alone when an update does not mention them', async () => {
    segments.find.mockResolvedValue([existingSegment('seg-1', 'First', 0)]);

    await service.update(CATEGORY_ID, { name: 'Renamed' });

    expect(segments.save).not.toHaveBeenCalled();
    expect(segments.delete).not.toHaveBeenCalled();
  });

  it('clears every segment when an empty list is given', async () => {
    segments.find.mockResolvedValue([existingSegment('seg-1', 'First', 0)]);

    await service.update(CATEGORY_ID, { segments: [] });

    expect(segments.delete).toHaveBeenCalled();
    expect(segments.save).toHaveBeenCalledWith([]);
  });
});
