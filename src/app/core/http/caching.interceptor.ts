import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpCacheService } from './http-cache.service';

/**
 * Serves repeated GETs from {@link HttpCacheService} and keeps the cache honest: any write
 * (POST, PUT, PATCH, DELETE) invalidates the collection it targets, so the next read is fresh.
 */
export const cachingInterceptor: HttpInterceptorFn = (request, next) => {
  const cache = inject(HttpCacheService);

  if (request.method !== 'GET') {
    cache.invalidate(collectionUrl(request.method, request.urlWithParams));

    return next(request);
  }

  const cached = cache.get(request.urlWithParams);

  if (cached) {
    return of(cached.clone());
  }

  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) {
        cache.set(request.urlWithParams, event);
      }
    }),
  );
};

/**
 * The collection a write belongs to: POST targets the collection itself, while PUT, PATCH
 * and DELETE target an item, so the last path segment is dropped.
 */
function collectionUrl(method: string, url: string): string {
  const path = url.split('?')[0];

  return method === 'POST' ? path : path.replace(/\/[^/]+$/, '');
}
