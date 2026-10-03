import 'zone.js';
import { provideZoneChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../service/auth.service';
import { Role } from '../model/auth';
import { ImportPageComponent } from '../components/imports/import-page.component';
import { LoginComponent } from '../components/auth/login.component';
import { RegisterComponent } from '../components/auth/register.component';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

describe('authentication and import integration', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  function signIn(role: Role = 'USER'): AuthService {
    const authService = TestBed.inject(AuthService);
    authService.login({ username: 'user', password: '123456' }).subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ token: 'jwt-token', username: 'user', role });
    return authService;
  }

  it('persists the login response, attaches JWT only to backend API and clears it on logout', async () => {
    const authService = signIn('ADMIN');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isAdmin()).toBe(true);
    expect(JSON.parse(localStorage.getItem('is-front.auth')!).username).toBe('user');
    const client = TestBed.inject(HttpClient);
    client.get('/api/persons').subscribe();
    const persons = http.expectOne('/api/persons');
    expect(persons.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    persons.flush([]);
    for (const url of ['/api/auth/example', '/assets/example', 'https://example.org/api/persons']) {
      client.get(url).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    authService.logout();
    expect(authService.token).toBeNull();
    expect(authService.isAdmin()).toBe(false);
    expect(localStorage.getItem('is-front.auth')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('restores a valid session and ignores malformed persisted data', () => {
    localStorage.setItem('is-front.auth', '{bad json');
    expect(TestBed.runInInjectionContext(() => new AuthService()).isAuthenticated()).toBe(false);
    localStorage.setItem(
      'is-front.auth',
      JSON.stringify({ token: 'saved', username: 'admin', role: 'ADMIN' }),
    );
    expect(TestBed.runInInjectionContext(() => new AuthService()).isAdmin()).toBe(true);
  });

  it('logs out on a protected 401, but preserves the session on 403 or failed login', () => {
    const authService = signIn();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    client.get('/api/admin/imports/history').subscribe({ error: () => {} });
    http
      .expectOne('/api/admin/imports/history')
      .flush('', { status: 403, statusText: 'Forbidden' });
    authService.login({ username: 'bad', password: 'bad' }).subscribe({ error: () => {} });
    http.expectOne('/api/auth/login').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(authService.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    client.get('/api/persons').subscribe({ error: () => {} });
    http.expectOne('/api/persons').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(authService.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('redirects every protected route, root and wildcard to login without a session', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of [
      '/persons',
      '/coordinates',
      '/locations',
      '/special',
      '/imports',
      '/',
      '/unknown',
    ]) {
      await harness.navigateByUrl(url, LoginComponent);
      expect(TestBed.inject(Router).url).toBe('/login');
    }
    http.expectNone('/api/imports/history');
    await harness.navigateByUrl('/register', RegisterComponent);
  });

  for (const role of ['USER', 'ADMIN'] as const) {
    it(`loads the correct history for ${role} and refreshes after multipart import`, async () => {
      signIn(role);
      const harness = await RouterTestingHarness.create();
      const page = await harness.navigateByUrl('/imports', ImportPageComponent);
      http.expectOne('/api/imports/history').flush([]);
      if (role === 'ADMIN') http.expectOne('/api/admin/imports/history').flush([]);
      else http.expectNone('/api/admin/imports/history');
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent?.includes('История всех пользователей')).toBe(
        role === 'ADMIN',
      );
      const input = document.createElement('input');
      const file = new File(['name;coordinatesX'], 'persons.csv', { type: 'text/csv' });
      page.selectedFile = file;
      page.importFile(input);
      expect(page.loading).toBe(true);
      const upload = http.expectOne('/api/imports');
      expect(upload.request.method).toBe('POST');
      expect(upload.request.body.get('file')).toBe(file);
      expect(upload.request.headers.get('Authorization')).toBe('Bearer jwt-token');
      expect(upload.request.headers.has('Content-Type')).toBe(false);
      upload.flush(null, { status: 201, statusText: 'Created' });
      expect(page.selectedFile).toBeNull();
      expect(page.loading).toBe(false);
      http.expectOne('/api/imports/history').flush([
        {
          id: 1,
          status: 'FAILED',
          username: 'user',
          addedCount: null,
          createdAt: '2026-10-03T10:00:00Z',
        },
      ]);
      if (role === 'ADMIN') http.expectOne('/api/admin/imports/history').flush([]);
      else http.expectNone('/api/admin/imports/history');
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Ошибка');
      expect(harness.routeNativeElement?.textContent).toContain('\u2014');
    });
  }

  it('validates registration password and leaves auth empty after registration', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/register', RegisterComponent);
    page.form.setValue({ username: 'user', password: '12345' });
    page.submit();
    http.expectNone('/api/auth/register');
    page.form.controls.password.setValue('123456');
    page.submit();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.body).toEqual({ username: 'user', password: '123456' });
    request.flush(null, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });

  it('rejects non-CSV files and preserves the CSV on a backend import error', async () => {
    signIn();
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/imports', ImportPageComponent);
    http.expectOne('/api/imports/history').flush([]);
    const snackBar = vi.spyOn(harness.routeDebugElement!.injector.get(MatSnackBar), 'open');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['invalid'], 'file.txt')],
      configurable: true,
    });
    page.selectFile(input);
    page.importFile(input);
    expect(page.selectedFile).toBeNull();
    http.expectNone('/api/imports');
    const file = new File(['invalid'], 'file.csv');
    Object.defineProperty(input, 'files', { value: [file] });
    page.selectFile(input);
    page.importFile(input);
    page.importFile(input);
    http.expectOne('/api/imports').flush('Ошибка в строке 1: hairColor обязателен', {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(snackBar).not.toHaveBeenCalled();
    expect(page.selectedFile).toBe(file);
    expect(page.loading).toBe(false);
    http.expectOne('/api/imports/history').flush([]);
    http.expectNone('/api/admin/imports/history');
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.import-error')?.textContent).toContain(
      'Ошибка в строке 1: hairColor обязателен',
    );
    Object.defineProperty(input, 'files', { value: [new File(['valid'], 'new.csv')] });
    page.selectFile(input);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.import-error')).toBeNull();
    http.expectNone('/api/imports');
  });

  it('shows credential and duplicate-username errors and releases loading state', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/login', LoginComponent);
    const snackBar = vi.spyOn(harness.routeDebugElement!.injector.get(MatSnackBar), 'open');
    login.form.setValue({ username: 'user', password: '123456' });
    login.submit();
    http.expectOne('/api/auth/login').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(login.loading).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(snackBar).toHaveBeenCalledWith(
      'Неверный логин или пароль',
      'Закрыть',
      expect.any(Object),
    );
    const register = await harness.navigateByUrl('/register', RegisterComponent);
    const registerSnackBar = vi.spyOn(harness.routeDebugElement!.injector.get(MatSnackBar), 'open');
    register.form.setValue({ username: 'user', password: '123456' });
    register.submit();
    http.expectOne('/api/auth/register').flush('', { status: 409, statusText: 'Conflict' });
    expect(register.loading).toBe(false);
    expect(registerSnackBar).toHaveBeenCalledWith(
      'Пользователь с таким логином уже существует',
      'Закрыть',
      expect.any(Object),
    );
  });
});
