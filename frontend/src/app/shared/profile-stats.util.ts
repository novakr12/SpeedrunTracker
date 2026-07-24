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
  const totalRuns = runs.length;
  const totalTimeMs = runs.reduce((sum, run) => sum + run.timeMs, 0);
  const averageTimeMs = totalRuns ? Math.round(totalTimeMs / totalRuns) : 0;
  const verifiedRuns = runs.filter((run) => run.status === 'accepted').length;
  const distinctGames = new Set(runs.map((run) => run.gameId)).size;
  const distinctCategories = new Set(runs.map((run) => run.categoryId)).size;

  const counts = new Map<string, number>();
  runs.forEach((run) => {
    const title = run.game?.title ?? 'Unknown';
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  const mostRunGame =
    [...counts.entries()]
      .map(([game, count]) => ({ game, count }))
      .sort((a, b) => b.count - a.count)[0] ?? null;

  const fastest = runs.reduce<Run | null>(
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
