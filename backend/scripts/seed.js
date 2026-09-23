const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PASSWORD = 'user123';
const RUNNERS = Array.from({ length: 5 }, (_, i) => `user${i + 1}`);
const RUNS_PER_GAME = 2;

const t = (m, s, ms = 0) => (m * 60 + s) * 1000 + ms;

const GAMES = [
  {
    title: 'Celeste',
    platforms: ['PC', 'Switch', 'PlayStation', 'Xbox'],
    tags: ['platformer', 'indie', 'precision'],
    releaseYear: 2018,
    categories: [
      {
        name: 'Any%',
        rules: 'Reach the summit. Any routing allowed, no cheats.',
        splits: ['Forsaken City', 'Old Site', 'Celestial Resort', 'Golden Ridge', 'Summit'],
        baseTime: t(29, 0),
      },
      {
        name: '100%',
        rules: 'All strawberries, hearts and cassettes.',
        splits: ['Chapters 1-3', 'Chapters 4-6', 'Chapters 7-8', 'Core + Farewell'],
        baseTime: t(95, 0),
      },
    ],
  },
  {
    title: 'Hollow Knight',
    platforms: ['PC', 'Switch', 'PlayStation'],
    tags: ['metroidvania', 'indie', 'souls-like'],
    releaseYear: 2017,
    categories: [
      {
        name: 'Any%',
        rules: 'Defeat The Hollow Knight. Glitches allowed.',
        splits: ['Forgotten Crossroads', 'Greenpath', 'City of Tears', 'Black Egg Temple'],
        baseTime: t(35, 0),
      },
    ],
  },
  {
    title: 'Super Mario 64',
    platforms: ['Switch'],
    tags: ['platformer', 'classic', 'nintendo'],
    releaseYear: 1996,
    categories: [
      {
        name: '16 Star',
        rules: 'Collect 16 stars, then beat Bowser.',
        splits: ['Bob-omb Battlefield', 'Basement', 'Upstairs', 'Bowser 3'],
        baseTime: t(16, 30),
      },
      {
        name: '70 Star',
        rules: 'Collect 70 stars before the final fight.',
        splits: ['First Floor', 'Basement', 'Second Floor', 'Third Floor', 'Bowser 3'],
        baseTime: t(52, 0),
      },
    ],
  },
  {
    title: 'Portal',
    platforms: ['PC', 'Xbox'],
    tags: ['puzzle', 'fps', 'valve'],
    releaseYear: 2007,
    categories: [
      {
        name: 'Glitchless',
        rules: 'No portal bumping, no save glitches.',
        splits: ['Test Chambers 00-10', 'Test Chambers 11-18', 'Escape', 'GLaDOS'],
        baseTime: t(25, 30),
      },
    ],
  },
  {
    title: 'Hades',
    platforms: ['PC', 'Switch', 'PlayStation', 'Xbox'],
    tags: ['roguelike', 'indie', 'action'],
    releaseYear: 2020,
    categories: [
      {
        name: 'Clean File Escape',
        rules: 'New save file, first successful escape.',
        splits: ['Tartarus', 'Asphodel', 'Elysium', 'Temple of Styx'],
        baseTime: t(20, 0),
      },
    ],
  },
];

function splitTime(totalMs, count, seed) {
  const weights = Array.from(
    { length: count },
    (_, i) => 1 + (((seed * 7 + i * 13) % 5) - 2) * 0.08,
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.floor((totalMs * w) / weightSum));
  parts[count - 1] += totalMs - parts.reduce((a, b) => a + b, 0);
  return parts;
}

async function main() {
  const db = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'speedrun',
    password: process.env.DB_PASSWORD ?? 'speedrun',
    database: process.env.DB_NAME ?? 'speedrun',
  });
  await db.connect();

  try {
    await db.query('BEGIN');

    await db.query('DELETE FROM games');
    await db.query(`DELETE FROM users WHERE role <> 'admin'`);

    const hash = await bcrypt.hash(PASSWORD, 10);
    const runnerIds = [];
    for (const name of RUNNERS) {
      const id = randomUUID();
      runnerIds.push(id);
      await db.query(
        `INSERT INTO users (id, username, email, password, role) VALUES ($1,$2,$3,$4,'user')`,
        [id, name, `${name}@speedrun.local`, hash],
      );
    }

    let runCount = 0;
    let seed = 1;

    for (const game of GAMES) {
      const gameId = randomUUID();
      await db.query(
        `INSERT INTO games (id, title, platforms, tags, "releaseYear")
         VALUES ($1,$2,$3,$4,$5)`,
        [gameId, game.title, game.platforms.join(','), game.tags.join(','), game.releaseYear],
      );

      const categories = [];
      for (const category of game.categories) {
        const categoryId = randomUUID();
        await db.query(
          `INSERT INTO categories (id, name, rules, "gameId") VALUES ($1,$2,$3,$4)`,
          [categoryId, category.name, category.rules, gameId],
        );

        const segmentIds = [];
        for (let i = 0; i < category.splits.length; i++) {
          const segmentId = randomUUID();
          segmentIds.push(segmentId);
          await db.query(
            `INSERT INTO category_segments (id, "categoryId", name, position)
             VALUES ($1,$2,$3,$4)`,
            [segmentId, categoryId, category.splits[i], i],
          );
        }
        categories.push({ id: categoryId, segmentIds, baseTime: category.baseTime });
      }

      for (const userId of runnerIds) {
        for (let n = 0; n < RUNS_PER_GAME; n++) {
          const category = categories[n % categories.length];
          const timeMs = category.baseTime + ((seed * 37) % 90) * 1000 + ((seed * 17) % 1000);
          const runId = randomUUID();
          const playedAt = new Date(2026, 5 + (seed % 4), 1 + (seed % 27), 10, 0, 0);

          await db.query(
            `INSERT INTO runs
               (id, "userId", "gameId", "categoryId", "timeMs", "videoUrl", status, "playedAt")
             VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)`,
            [
              runId,
              userId,
              gameId,
              category.id,
              timeMs,
              `https://youtube.com/watch?v=seed${String(++runCount).padStart(3, '0')}`,
              playedAt,
            ],
          );

          const parts = splitTime(timeMs, category.segmentIds.length, seed++);
          for (let i = 0; i < category.segmentIds.length; i++) {
            await db.query(
              `INSERT INTO run_segments (id, "runId", "segmentId", "durationMs")
               VALUES ($1,$2,$3,$4)`,
              [randomUUID(), runId, category.segmentIds[i], parts[i]],
            );
          }
        }
      }
    }

    await db.query('COMMIT');
    console.log(`OK: ${GAMES.length} games, ${RUNNERS.length} users, ${runCount} pending runs`);
    console.log(`Login: <ime>@speedrun.local / ${PASSWORD}  (${RUNNERS.join(', ')})`);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
