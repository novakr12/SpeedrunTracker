import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BanAppeal,
  CreateAppealDto,
  ResolveAppealDto,
} from '../models/appeal.model';

@Injectable({ providedIn: 'root' })
export class AppealsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/appeals';

  submit(dto: CreateAppealDto): Observable<BanAppeal> {
    return this.http.post<BanAppeal>(this.base, dto);
  }

  getAll(): Observable<BanAppeal[]> {
    return this.http.get<BanAppeal[]>(this.base);
  }

  resolve(id: string, dto: ResolveAppealDto): Observable<BanAppeal> {
    return this.http.patch<BanAppeal>(`${this.base}/${id}/resolve`, dto);
  }
}
