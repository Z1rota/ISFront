import { DatePipe } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { httpErrorMessage } from '../../app/http-error-message';
import { ImportOperation } from '../../model/import-operation';
import { AuthService } from '../../service/auth.service';
import { ImportService } from '../../service/import.service';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressBarModule, MatSnackBarModule],
  templateUrl: './import-history.component.html',
  styleUrl: './import-history.component.css',
})
export class ImportHistoryComponent implements OnInit {
  private readonly importService = inject(ImportService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private historySubscription?: Subscription;
  @Input() allUsers = inject(ActivatedRoute).snapshot.data['allUsers'] === true;
  history: ImportOperation[] = [];
  loading = false;
  errorMessage = '';
  readonly statusLabels = { SUCCESS: 'Успешно', FAILED: 'Ошибка', IN_PROGRESS: 'Выполняется' };

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (!this.authService.isAuthenticated()) return;
    if (this.allUsers && !this.authService.isAdmin()) return;
    this.historySubscription?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    const request = this.allUsers
      ? this.importService.getAllHistory()
      : this.importService.getHistory();
    this.historySubscription = request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (history) => {
          this.history = history;
        },
        error: (error: unknown) => {
          this.errorMessage = httpErrorMessage(error, 'Не удалось загрузить историю импорта');
          this.snackBar.open(this.errorMessage, 'Закрыть', {
            duration: 6000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }
}
