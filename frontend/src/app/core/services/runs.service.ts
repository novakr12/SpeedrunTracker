import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRunDto, Run } from '../models/run.model';

@Injectable({ providedIn: 'root' })
export class RunsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/runs';

  getAll(): Observable<Run[]> {
    return this.http.get<Run[]>(this.base);
  }

  create(dto: CreateRunDto): Observable<Run> {
    return this.http.post<Run>(this.base, dto);
  }
}
