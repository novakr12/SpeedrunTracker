import { Game } from '../core/models/game.model';
import { Run } from '../core/models/run.model';

export interface GameRunCount {
  game: string;
  count: number;
}

export interface DashboardStats {
  totalGames: number;
  totalRuns: number;
  verifiedRuns: number;
  totalTimeMs: number;
  averageTimeMs: number;
  runsPerGame: GameRunCount[];
}

export function computeDashboardStats(
  games: Game[],
  runs: Run[],
): DashboardStats {
  const verifiedRuns = runs.filter((run) => run.status === 'accepted').length;

  const totalTimeMs = runs.reduce((sum, run) => sum + run.timeMs, 0);

  const times = runs.map((run) => run.timeMs);
  const averageTimeMs = times.length
    ? Math.round(totalTimeMs / times.length)
    : 0;

  const counts = new Map<string, number>();
  runs.forEach((run) => {
    const title = run.game?.title ?? 'Unknown';
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  const runsPerGame = Array.from(counts, ([game, count]) => ({ game, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalGames: games.length,
    totalRuns: runs.length,
    verifiedRuns,
    totalTimeMs,
    averageTimeMs,
    runsPerGame,
  };
}
