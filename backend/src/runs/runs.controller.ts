import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RunsService } from './runs.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { ReviewRunDto } from './dto/review-run.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BanGuard } from '../auth/guards/ban.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @UseGuards(JwtAuthGuard, BanGuard)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRunDto) {
    return this.runsService.create(user.userId, dto);
  }

  @Get()
  findAll() {
    return this.runsService.findAll();
  }

  @Get('leaderboard/:gameId')
  leaderboard(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.runsService.leaderboardForGame(gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('personal-bests')
  personalBests(@CurrentUser() user: AuthUser) {
    return this.runsService.personalBests(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.runsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRunDto,
  ) {
    return this.runsService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/review')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewRunDto,
  ) {
    return this.runsService.review(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.remove(id, user);
  }
}
