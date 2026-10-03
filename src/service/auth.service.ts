import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../model/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'is-front.auth';
  private auth: AuthResponse | null = this.readAuth();

  get token(): string | null {
    return this.auth?.token ?? null;
  }

  get username(): string | null {
    return this.auth?.username ?? null;
  }

  get role(): AuthResponse['role'] | null {
    return this.auth?.role ?? null;
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((auth) => {
        localStorage.setItem(this.storageKey, JSON.stringify(auth));
        this.auth = auth;
      }),
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<void>('/api/auth/register', request);
  }

  logout(): void {
    this.auth = null;
    localStorage.removeItem(this.storageKey);
    void this.router.navigateByUrl('/login');
  }

  isAuthenticated(): boolean {
    return this.auth !== null;
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  private readAuth(): AuthResponse | null {
    try {
      const auth: unknown = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null');
      if (
        auth !== null &&
        typeof auth === 'object' &&
        'token' in auth &&
        typeof auth.token === 'string' &&
        auth.token.trim() &&
        'username' in auth &&
        typeof auth.username === 'string' &&
        auth.username.trim() &&
        'role' in auth &&
        (auth.role === 'USER' || auth.role === 'ADMIN')
      ) {
        return { token: auth.token, username: auth.username, role: auth.role };
      }
    } catch {
      // Invalid persisted data should leave the user on the login screen.
    }
    return null;
  }
}
