import { Injectable } from '@angular/core';

export interface ServerSummary {
  games: number;
  runs: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  async loadSummary(): Promise<ServerSummary> {
    const [gamesResponse, runsResponse] = await Promise.all([
      fetch('/api/games'),
      fetch('/api/runs'),
    ]);

    if (!gamesResponse.ok || !runsResponse.ok) {
      throw new Error('Failed to load summary');
    }

    const games = (await gamesResponse.json()) as unknown[];
    const runs = (await runsResponse.json()) as unknown[];

    return { games: games.length, runs: runs.length };
  }
}
