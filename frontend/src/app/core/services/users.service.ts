import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BanUserDto, ManagedUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/users';

  getBanned(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(`${this.base}/banned`);
  }

  ban(id: string, dto: BanUserDto): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${this.base}/${id}/ban`, dto);
  }

  unban(id: string): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${this.base}/${id}/unban`, {});
  }
}
