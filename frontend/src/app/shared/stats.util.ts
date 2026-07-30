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
  const submitted = runs.filter((run) => run.status !== 'rejected');
  const accepted = runs.filter((run) => run.status === 'accepted');

  const verifiedRuns = accepted.length;

  const totalTimeMs = accepted.reduce((sum, run) => sum + run.timeMs, 0);
  const averageTimeMs = verifiedRuns
    ? Math.round(totalTimeMs / verifiedRuns)
    : 0;

  const counts = new Map<string, number>();
  accepted.forEach((run) => {
    const title = run.game?.title ?? 'Unknown';
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  const runsPerGame = Array.from(counts, ([game, count]) => ({ game, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalGames: games.length,
    totalRuns: submitted.length,
    verifiedRuns,
    totalTimeMs,
    averageTimeMs,
    runsPerGame,
  };
}
