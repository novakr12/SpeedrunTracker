import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin-only: public sign-up goes through POST /auth/register, which is the
  // only path that should mint accounts for anonymous callers.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // Returns every user including email addresses, so admin only.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('banned')
  findBanned() {
    return this.usersService.findBanned();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/ban')
  ban(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BanUserDto) {
    return this.usersService.ban(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/unban')
  unban(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unban(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertSelfOrAdmin(current, id);
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    this.assertSelfOrAdmin(current, id);
    return this.usersService.update(id, dto, current.role === 'admin');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertSelfOrAdmin(current, id);
    return this.usersService.remove(id);
  }

  // UpdateUserDto includes `password`, so without this check any caller could
  // reset another account's password and take it over. Admins keep full access
  // because moderation depends on it.
  private assertSelfOrAdmin(current: AuthUser, targetId: string): void {
    if (current.role !== 'admin' && current.userId !== targetId) {
      throw new ForbiddenException('You can only modify your own account');
    }
  }
}
