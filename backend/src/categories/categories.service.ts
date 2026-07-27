import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GamesService } from '../games/games.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly gamesService: GamesService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.gamesService.findOne(dto.gameId);
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  findByGame(gameId: string): Promise<Category[]> {
    return this.categoriesRepository.find({ where: { gameId } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    if (dto.gameId) {
      await this.gamesService.findOne(dto.gameId);
    }
    const category = await this.categoriesRepository.preload({ id, ...dto });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoriesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }
}
