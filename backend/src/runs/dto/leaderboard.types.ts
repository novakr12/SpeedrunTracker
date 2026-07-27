export interface LeaderboardEntry {
  rank: number;
  runId: string;
  userId: string;
  username: string;
  timeMs: number;
  videoUrl?: string;
  playedAt?: Date | null;
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
