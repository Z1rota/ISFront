import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Color, Country, Person } from '../model/person';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface NationalityCount {
  nationality: Country | null;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  private readonly apiUrl = '/api/persons';

  constructor(private http: HttpClient) {}

  getAll(
    page: number,
    size: number,
    sortBy: string,
    direction: string,
    name?: string
  ): Observable<PageResponse<Person>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<PageResponse<Person>>(
      this.apiUrl,
      { params }
    );
  }

    getById(id: number): Observable<Person> {
        return this.http.get<Person>(
        `${this.apiUrl}/${id}`
        );
    }

    create(person: Person): Observable<Person> {
        return this.http.post<Person>(
        this.apiUrl,
        person
        );
    }

    update(id: number, person: Person): Observable<Person> {
    return this.http.post<Person>(
      `${this.apiUrl}/${id}`,
      person
    );
  }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(
        `${this.apiUrl}/${id}`
        );
    }
    deleteOneByNationality(
    nationality: Country
    ): Observable<number> {
    return this.http.delete<number>(
        `${this.apiUrl}/special/nationality/${nationality}`
    );
    }

    getMinHeightPerson(): Observable<Person> {
    return this.http.get<Person>(
        `${this.apiUrl}/special/min-height`
    );
    }

    groupByNationality(): Observable<NationalityCount[]> {
    return this.http.get<NationalityCount[]>(
        `${this.apiUrl}/special/group-by-nationality`
    );
    }

    getHairColorPercentage(
    color: Color
    ): Observable<number> {
    return this.http.get<number>(
        `${this.apiUrl}/special/hair-percentage/${color}`
    );
    }

    countByEyeColor(
    color: Color
    ): Observable<number> {
    return this.http.get<number>(
        `${this.apiUrl}/special/eye-count/${color}`
    );
    }
}