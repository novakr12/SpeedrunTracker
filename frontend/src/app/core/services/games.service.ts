import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateGameDto, Game, UpdateGameDto } from '../models/game.model';

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

  update(id: string, dto: UpdateGameDto): Observable<Game> {
    return this.http.patch<Game>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getFollowed(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.base}/followed`);
  }

  follow(id: string): Observable<Game[]> {
    return this.http.post<Game[]>(`${this.base}/${id}/follow`, {});
  }

  unfollow(id: string): Observable<Game[]> {
    return this.http.delete<Game[]>(`${this.base}/${id}/follow`);
  }
}
