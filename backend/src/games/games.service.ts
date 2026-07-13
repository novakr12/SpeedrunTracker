import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
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
      relations: { categories: true },
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
}
