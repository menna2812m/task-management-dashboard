import { HttpResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';

/** How long a cached GET response stays fresh. Override in tests or per environment. */
export const HTTP_CACHE_TTL_MS = new InjectionToken<number>('HTTP_CACHE_TTL_MS', {
  providedIn: 'root',
  factory: () => 60_000,
});

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

/**
 * In-memory store for GET responses keyed by full URL. The caching interceptor reads and
 * writes it; anything that knows data changed (a mutation, a manual refresh) invalidates it.
 */
@Injectable({
  providedIn: 'root',
})
export class HttpCacheService {
  private readonly ttlMs = inject(HTTP_CACHE_TTL_MS);
  private readonly entries = new Map<string, CacheEntry>();

  /** Returns the cached response for `url`, or undefined when absent or expired. */
  get(url: string): HttpResponse<unknown> | undefined {
    const entry = this.entries.get(url);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(url);

      return undefined;
    }

    return entry.response;
  }

  set(url: string, response: HttpResponse<unknown>): void {
    this.entries.set(url, { response, expiresAt: Date.now() + this.ttlMs });
  }

  /** Removes every entry whose URL starts with `prefix`, e.g. a collection and its items. */
  invalidate(prefix: string): void {
    for (const url of this.entries.keys()) {
      if (url.startsWith(prefix)) {
        this.entries.delete(url);
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
