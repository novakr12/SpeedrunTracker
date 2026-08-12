import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategorySegment } from './category-segment.entity';
import { RunSegment } from '../runs/run-segment.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GamesService } from '../games/games.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(CategorySegment)
    private readonly segmentsRepository: Repository<CategorySegment>,
    @InjectRepository(RunSegment)
    private readonly runSegmentsRepository: Repository<RunSegment>,
    private readonly gamesService: GamesService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.gamesService.findOne(dto.gameId);
    const { segments, ...rest } = dto;
    const category = await this.categoriesRepository.save(
      this.categoriesRepository.create(rest),
    );
    if (segments?.length) {
      await this.replaceSegments(category.id, segments);
    }
    return this.findOne(category.id);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: { segments: true },
      order: { segments: { position: 'ASC' } },
    });
  }

  findByGame(gameId: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { gameId },
      relations: { segments: true },
      order: { segments: { position: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { segments: true },
      order: { segments: { position: 'ASC' } },
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
    const { segments, ...rest } = dto;
    const category = await this.categoriesRepository.preload({ id, ...rest });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    await this.categoriesRepository.save(category);
    if (segments) {
      await this.replaceSegments(id, segments);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoriesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  private async replaceSegments(
    categoryId: string,
    names: string[],
  ): Promise<void> {
    const existing = await this.segmentsRepository.find({
      where: { categoryId },
      order: { position: 'ASC' },
    });

    const kept = new Map<string, CategorySegment>();
    for (const segment of existing) {
      if (!kept.has(segment.name)) {
        kept.set(segment.name, segment);
      }
    }

    const removed = existing.filter((segment) => !names.includes(segment.name));
    if (removed.length) {
      await this.assertUnused(removed);
      await this.segmentsRepository.delete({
        id: In(removed.map((segment) => segment.id)),
      });
    }

    const rows = names.map((name, position) => {
      const previous = kept.get(name);
      return previous
        ? { ...previous, position }
        : this.segmentsRepository.create({ categoryId, name, position });
    });
    await this.segmentsRepository.save(rows);
  }

  private async assertUnused(segments: CategorySegment[]): Promise<void> {
    const used = await this.runSegmentsRepository.count({
      where: { segmentId: In(segments.map((segment) => segment.id)) },
    });
    if (used) {
      throw new BadRequestException(
        'Segments that already have recorded run times cannot be removed',
      );
    }
  }
}
