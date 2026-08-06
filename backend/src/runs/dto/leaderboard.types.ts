export interface LeaderboardEntry {
  rank: number;
  runId: string;
  userId: string;
  username: string;
  timeMs: number;
  videoUrl?: string;
  playedAt?: Date | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  reviewComment: string | null;
}

export interface LeaderboardCategory {
  categoryId: string;
  categoryName: string;
  entries: LeaderboardEntry[];
}

export interface GameLeaderboard {
  gameId: string;
  gameTitle: string;
  categories: LeaderboardCategory[];
}
