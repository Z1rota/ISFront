import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { httpErrorMessage } from '../../app/http-error-message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './auth-form.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(6)]],
  });
  loading = false;

  submit(): void {
    if (this.loading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.authService
      .register(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Регистрация завершена. Войдите в аккаунт.', 'Закрыть', {
            duration: 5000,
          });
          void this.router.navigateByUrl('/login');
        },
        error: (error: HttpErrorResponse) => {
          const message =
            error.status === 409
              ? 'Пользователь с таким логином уже существует'
              : httpErrorMessage(error, 'Не удалось зарегистрироваться');
          this.snackBar.open(message, 'Закрыть', {
            duration: 6000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }
}
