export interface LeaderboardEntrySegment {
  segmentId: string;
  durationMs: number;
}

export interface LeaderboardEntry {
  rank: number;
  runId: string;
  userId: string;
  username: string;
  timeMs: number;
  videoUrl?: string;
  playedAt?: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  reviewComment: string | null;
  segments: LeaderboardEntrySegment[];
}

export interface SegmentBest {
  segmentId: string;
  segmentName: string;
  position: number;
  userId: string | null;
  username: string | null;
  runId: string | null;
  durationMs: number | null;
}

export interface LeaderboardCategory {
  categoryId: string;
  categoryName: string;
  entries: LeaderboardEntry[];
  segmentBests: SegmentBest[];
  sumOfBestMs: number | null;
}

export interface GameLeaderboard {
  gameId: string;
  gameTitle: string;
  categories: LeaderboardCategory[];
}

export interface PersonalBest {
  runId: string;
  gameId: string;
  gameTitle: string;
  categoryId: string;
  categoryName: string;
  timeMs: number;
  playedAt: string | null;
  isWorldRecord: boolean;
}
