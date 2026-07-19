import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateGameDto, Game } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/games';

  getAll(): Observable<Game[]> {
    return this.http.get<Game[]>(this.base);
  }

  getOne(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.base}/${id}`);
  }

  create(dto: CreateGameDto): Observable<Game> {
    return this.http.post<Game>(this.base, dto);
  }
}
