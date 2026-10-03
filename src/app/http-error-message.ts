import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'Сервер недоступен. Проверьте соединение и повторите попытку.';
  if (error.status === 401) return 'Сессия истекла. Войдите снова.';
  if (error.status === 403) return 'Недостаточно прав для выполнения операции.';

  const body: unknown = error.error;
  if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) return body;
  if (body !== null && typeof body === 'object') {
    if ('message' in body && typeof body.message === 'string') return body.message;
    if (error.status === 400) {
      const messages = Object.values(body).filter(
        (value): value is string => typeof value === 'string',
      );
      if (messages.length) return messages.join('. ');
    }
  }
  return fallback;
}
