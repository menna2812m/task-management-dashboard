import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { retry, throwError, timer } from 'rxjs';

/** Base delay for exponential backoff between retries. Tests override it with 0. */
export const RETRY_BASE_DELAY_MS = new InjectionToken<number>('RETRY_BASE_DELAY_MS', {
  providedIn: 'root',
  factory: () => 400,
});

const MAX_RETRIES = 2;

/**
 * Retries failed GETs up to twice with exponential backoff (400ms, 800ms by default).
 * Only transient failures are retried: network errors and 5xx responses. Client errors are
 * surfaced immediately, and writes are never retried because they may not be idempotent.
 */
export const retryInterceptor: HttpInterceptorFn = (request, next) => {
  const baseDelayMs = inject(RETRY_BASE_DELAY_MS);

  if (request.method !== 'GET') {
    return next(request);
  }

  return next(request).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, retryCount: number) =>
        isTransient(error) ? timer(baseDelayMs * 2 ** (retryCount - 1)) : throwError(() => error),
    }),
  );
};

function isTransient(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}
