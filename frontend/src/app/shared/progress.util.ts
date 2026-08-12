import { Run } from '../core/models/run.model';

export interface ProgressPoint {
  runId: string;
  timeMs: number;
  at: string | null;
  isRecord: boolean;
}

export interface ProgressSeries {
  categoryId: string;
  gameTitle: string;
  categoryName: string;
  points: ProgressPoint[];
  bestMs: number;
  worstMs: number;
  improvementMs: number;
}

function runDate(run: Run): string | null {
  return run.playedAt ?? run.createdAt ?? null;
}

function chronologically(a: Run, b: Run): number {
  const left = runDate(a);
  const right = runDate(b);
  if (!left || !right) {
    return 0;
  }
  return new Date(left).getTime() - new Date(right).getTime();
}

export function buildProgressSeries(runs: Run[]): ProgressSeries[] {
  const accepted = runs.filter((run) => run.status === 'accepted');

  const byCategory = new Map<string, Run[]>();
  accepted.forEach((run) => {
    const bucket = byCategory.get(run.categoryId);
    if (bucket) {
      bucket.push(run);
    } else {
      byCategory.set(run.categoryId, [run]);
    }
  });

  const series: ProgressSeries[] = [];
  byCategory.forEach((categoryRuns, categoryId) => {
    const ordered = [...categoryRuns].sort(chronologically);

    let record = Number.POSITIVE_INFINITY;
    const points = ordered.map((run) => {
      const isRecord = run.timeMs < record;
      if (isRecord) {
        record = run.timeMs;
      }
      return {
        runId: run.id,
        timeMs: run.timeMs,
        at: runDate(run),
        isRecord,
      };
    });

    const times = points.map((point) => point.timeMs);
    const bestMs = Math.min(...times);
    const worstMs = Math.max(...times);

    series.push({
      categoryId,
      gameTitle: ordered[0].game?.title ?? 'Unknown',
      categoryName: ordered[0].category?.name ?? 'Unknown',
      points,
      bestMs,
      worstMs,
      improvementMs: points[0].timeMs - bestMs,
    });
  });

  return series.sort(
    (a, b) =>
      b.points.length - a.points.length ||
      a.gameTitle.localeCompare(b.gameTitle),
  );
}
