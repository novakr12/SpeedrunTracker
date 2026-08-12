import { Category, Game } from './game.model';
import { AuthUser } from './auth.model';

export type RunStatus = 'pending' | 'accepted' | 'rejected';

export interface RunSegment {
  id: string;
  runId: string;
  segmentId: string;
  durationMs: number;
}

export interface RunSegmentInput {
  segmentId: string;
  durationMs: number;
}

export interface Run {
  id: string;
  userId: string;
  gameId: string;
  categoryId: string;
  timeMs: number;
  videoUrl?: string;
  status: RunStatus;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewedBy?: { id: string; username: string } | null;
  playedAt?: string;
  createdAt?: string;
  user?: AuthUser;
  game?: Game;
  category?: Category;
  segments?: RunSegment[];
}

export interface CreateRunDto {
  gameId: string;
  categoryId: string;
  timeMs: number;
  videoUrl?: string;
  playedAt?: string;
  segments?: RunSegmentInput[];
}

export interface ReviewRunDto {
  status: 'accepted' | 'rejected';
  comment?: string;
}
