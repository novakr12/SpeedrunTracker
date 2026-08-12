import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './game.entity';
import { User } from '../users/user.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(dto: CreateGameDto): Promise<Game> {
    const game = this.gamesRepository.create(dto);
    return this.gamesRepository.save(game);
  }

  findAll(): Promise<Game[]> {
    return this.gamesRepository.find();
  }

  async findOne(id: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id },
      relations: { categories: { segments: true } },
      order: { categories: { segments: { position: 'ASC' } } },
    });
    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }
    return game;
  }

  async update(id: string, dto: UpdateGameDto): Promise<Game> {
    const game = await this.gamesRepository.preload({ id, ...dto });
    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }
    return this.gamesRepository.save(game);
  }

  async remove(id: string): Promise<void> {
    const result = await this.gamesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Game ${id} not found`);
    }
  }

  async findFollowed(userId: string): Promise<Game[]> {
    const user = await this.loadFollower(userId);
    return user.followedGames;
  }

  async follow(userId: string, gameId: string): Promise<Game[]> {
    const game = await this.findOne(gameId);
    const user = await this.loadFollower(userId);
    if (!user.followedGames.some((followed) => followed.id === game.id)) {
      user.followedGames = [...user.followedGames, game];
      await this.usersRepository.save(user);
    }
    return this.findFollowed(userId);
  }

  async unfollow(userId: string, gameId: string): Promise<Game[]> {
    const user = await this.loadFollower(userId);
    user.followedGames = user.followedGames.filter(
      (followed) => followed.id !== gameId,
    );
    await this.usersRepository.save(user);
    return this.findFollowed(userId);
  }

  private async loadFollower(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { followedGames: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    user.followedGames = user.followedGames ?? [];
    return user;
  }
}
