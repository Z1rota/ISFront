import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Location } from '../model/person';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private readonly apiUrl = '/api/locations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  create(location: Location): Observable<Location> {
    return this.http.post<Location>(
      this.apiUrl,
      location
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}