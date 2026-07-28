import { Run } from '../core/models/run.model';

export interface ProfileStats {
  totalRuns: number;
  totalTimeMs: number;
  averageTimeMs: number;
  verifiedRuns: number;
  distinctGames: number;
  distinctCategories: number;
  mostRunGame: { game: string; count: number } | null;
  fastestRun: { game: string; category: string; timeMs: number } | null;
}

export function computeProfileStats(runs: Run[]): ProfileStats {
  // A rejected run has been ruled invalid, so it counts nowhere. Times and
  // records go one step further and use verified runs only, so an unreviewed
  // submission can never surface as a personal best.
  const submitted = runs.filter((run) => run.status !== 'rejected');
  const accepted = runs.filter((run) => run.status === 'accepted');

  const totalRuns = submitted.length;
  const verifiedRuns = accepted.length;

  const totalTimeMs = accepted.reduce((sum, run) => sum + run.timeMs, 0);
  const averageTimeMs = verifiedRuns
    ? Math.round(totalTimeMs / verifiedRuns)
    : 0;

  const distinctGames = new Set(accepted.map((run) => run.gameId)).size;
  const distinctCategories = new Set(accepted.map((run) => run.categoryId)).size;

  const counts = new Map<string, number>();
  accepted.forEach((run) => {
    const title = run.game?.title ?? 'Unknown';
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  const mostRunGame =
    [...counts.entries()]
      .map(([game, count]) => ({ game, count }))
      .sort((a, b) => b.count - a.count)[0] ?? null;

  const fastest = accepted.reduce<Run | null>(
    (best, run) => (!best || run.timeMs < best.timeMs ? run : best),
    null,
  );
  const fastestRun = fastest
    ? {
        game: fastest.game?.title ?? 'Unknown',
        category: fastest.category?.name ?? 'Unknown',
        timeMs: fastest.timeMs,
      }
    : null;

  return {
    totalRuns,
    totalTimeMs,
    averageTimeMs,
    verifiedRuns,
    distinctGames,
    distinctCategories,
    mostRunGame,
    fastestRun,
  };
}
