import { Category, Game } from './game.model';
import { AuthUser } from './auth.model';

export interface Run {
  id: string;
  userId: string;
  gameId: string;
  categoryId: string;
  timeMs: number;
  videoUrl?: string;
  verified: boolean;
  playedAt?: string;
  createdAt?: string;
  user?: AuthUser;
  game?: Game;
  category?: Category;
}

export interface CreateRunDto {
  gameId: string;
  categoryId: string;
  timeMs: number;
  videoUrl?: string;
  playedAt?: string;
}
