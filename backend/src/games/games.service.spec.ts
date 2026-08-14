import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GamesService } from './games.service';
import { Game } from './game.entity';
import { User } from '../users/user.entity';

const GAME_ID = 'game-1';
const USER_ID = 'user-1';

describe('GamesService', () => {
  let service: GamesService;
  let games: Record<string, jest.Mock>;
  let users: Record<string, jest.Mock>;
  let follower: { id: string; followedGames: Partial<Game>[] };

  beforeEach(async () => {
    follower = { id: USER_ID, followedGames: [] };
    games = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      preload: jest.fn(async (value) => value),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: GAME_ID, title: 'Celeste' }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    users = {
      findOne: jest.fn(async () => follower),
      save: jest.fn(async (value) => {
        follower = value;
        return value;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: getRepositoryToken(Game), useValue: games },
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();

    service = moduleRef.get(GamesService);
  });

  it('starts with nothing followed', async () => {
    await expect(service.findFollowed(USER_ID)).resolves.toEqual([]);
  });

  it('adds a game to the followed list', async () => {
    const followed = await service.follow(USER_ID, GAME_ID);

    expect(followed.map((game) => game.id)).toEqual([GAME_ID]);
  });

  it('does not add the same game twice', async () => {
    await service.follow(USER_ID, GAME_ID);
    const followed = await service.follow(USER_ID, GAME_ID);

    expect(followed).toHaveLength(1);
    expect(users.save).toHaveBeenCalledTimes(1);
  });

  it('removes a followed game', async () => {
    await service.follow(USER_ID, GAME_ID);
    const followed = await service.unfollow(USER_ID, GAME_ID);

    expect(followed).toEqual([]);
  });

  it('treats unfollowing a game that was never followed as a no-op', async () => {
    const followed = await service.unfollow(USER_ID, 'never-followed');

    expect(followed).toEqual([]);
  });

  it('refuses to follow for a user that does not exist', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(service.follow(USER_ID, GAME_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to follow a game that does not exist', async () => {
    games.findOne.mockResolvedValue(null);

    await expect(service.follow(USER_ID, GAME_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(users.save).not.toHaveBeenCalled();
  });
});
