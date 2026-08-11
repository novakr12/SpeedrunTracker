# SpeedrunTracker

Praćenje speedrun pokušaja po igrama i kategorijama, sa moderacijom runova i leaderboard sistemom.

Angular + NgRx, NestJS + TypeORM, PostgreSQL u Docker-u.

## Pokretanje:

```bash
npm install
```

```bash
cp backend/.env.example backend/.env
```

```bash
npm run db:up
```

```bash
npm run backend
```

```bash
npm run frontend
```


Aplikacija je na `http://localhost:4200`, API na `http://localhost:3000/api`.


Admin nalog se kreira automatski: `admin@speedrun.local` / `admin1234`.


Ostali nalozi se prave preko `/register`.
