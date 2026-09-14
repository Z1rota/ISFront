import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Coordinates } from '../model/person';

@Injectable({
  providedIn: 'root'
})
export class CoordinatesService {

  private readonly apiUrl = '/api/coordinates';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Coordinates[]> {
    return this.http.get<Coordinates[]>(this.apiUrl);
  }

   create(coordinates: Coordinates): Observable<Coordinates> {
    return this.http.post<Coordinates>(
      this.apiUrl,
      coordinates
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}