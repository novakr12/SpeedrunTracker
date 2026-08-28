# SpeedrunTracker

Praćenje speedrun pokušaja po igrama i kategorijama, sa moderacijom runova i leaderboard sistemom.

Angular + NgRx, NestJS + TypeORM, PostgreSQL u Docker-u.

## Funkcionalnosti:

- Registracija i prijava preko JWT-a, uloge korisnik i admin
- Igre sa platformama i tagovima, pretraga po naslovu, tagu ili platformi
- Kategorije sa splitovima koje definiše admin
- Prijava runa sa razradom po splitovima; zbir splitova mora da odgovara ukupnom vremenu
- Moderacija runova: prihvatanje ili odbijanje uz komentar, sa upisom ko je odlučio
- Rang-lista po kategoriji sa oznakom svetskog rekorda i deljenim mestima za ista vremena
- Najbolje vreme po svakom splitu i zbir najboljih segmenata
- Lični rekordi i grafik napretka kroz vreme na profilu
- Praćenje igara i filter na samo praćene
- Privremeni i trajni ban sa žalbom koju admin rešava

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
