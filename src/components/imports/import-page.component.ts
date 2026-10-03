import { Component, DestroyRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { httpErrorMessage } from '../../app/http-error-message';
import { ImportService } from '../../service/import.service';
import { ImportHistoryComponent } from './import-history.component';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    RouterOutlet,
    ImportHistoryComponent,
  ],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.css',
})
export class ImportPageComponent {
  private readonly importService = inject(ImportService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(ImportHistoryComponent) private history?: ImportHistoryComponent;
  @ViewChild(RouterOutlet) private adminOutlet?: RouterOutlet;
  selectedFile: File | null = null;
  loading = false;
  errorMessage = '';

  selectFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    this.errorMessage = '';
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.selectedFile = null;
      input.value = '';
      this.errorMessage = 'Выберите файл с расширением .csv';
      return;
    }
    this.selectedFile = file;
  }

  importFile(input: HTMLInputElement): void {
    if (!this.selectedFile || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.importService
      .importFile(this.selectedFile)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Импорт успешно завершён', 'Закрыть', { duration: 5000 });
          this.selectedFile = null;
          input.value = '';
          this.refreshHistory();
        },
        error: (error: unknown) => {
          this.errorMessage = httpErrorMessage(error, 'Не удалось импортировать файл');
          this.refreshHistory();
        },
      });
  }

  private refreshHistory(): void {
    this.history?.refresh();
    if (this.adminOutlet?.isActivated) {
      const adminHistory = this.adminOutlet.component;
      if (adminHistory instanceof ImportHistoryComponent) adminHistory.refresh();
    }
  }
}
