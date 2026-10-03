import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ImportOperation } from '../model/import-operation';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly http = inject(HttpClient);

  importFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>('/api/imports', formData);
  }

  getHistory() {
    return this.http.get<ImportOperation[]>('/api/imports/history');
  }

  getAllHistory() {
    return this.http.get<ImportOperation[]>('/api/admin/imports/history');
  }
}
