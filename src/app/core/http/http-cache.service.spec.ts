import { HttpResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HTTP_CACHE_TTL_MS, HttpCacheService } from './http-cache.service';

describe('HttpCacheService', () => {
  let cache: HttpCacheService;
  let now: number;

  const response = (body: unknown) => new HttpResponse({ body, status: 200 });

  beforeEach(() => {
    now = 1_000_000;
    spyOn(Date, 'now').and.callFake(() => now);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: HTTP_CACHE_TTL_MS, useValue: 1000 }],
    });
    cache = TestBed.inject(HttpCacheService);
  });

  it('returns nothing for an unknown url', () => {
    expect(cache.get('/api/tasks')).toBeUndefined();
  });

  it('returns a stored response while it is fresh', () => {
    cache.set('/api/tasks', response([1]));
    now += 999;

    expect(cache.get('/api/tasks')?.body).toEqual([1]);
  });

  it('drops a response once its time-to-live has passed', () => {
    cache.set('/api/tasks', response([1]));
    now += 1000;

    expect(cache.get('/api/tasks')).toBeUndefined();
  });

  it('invalidates every entry under a url prefix', () => {
    cache.set('/api/tasks', response([1]));
    cache.set('/api/tasks/7', response({ id: 7 }));
    cache.set('/api/users', response([2]));

    cache.invalidate('/api/tasks');

    expect(cache.get('/api/tasks')).toBeUndefined();
    expect(cache.get('/api/tasks/7')).toBeUndefined();
    expect(cache.get('/api/users')?.body).toEqual([2]);
  });

  it('clears everything', () => {
    cache.set('/api/tasks', response([1]));
    cache.set('/api/users', response([2]));

    cache.clear();

    expect(cache.get('/api/tasks')).toBeUndefined();
    expect(cache.get('/api/users')).toBeUndefined();
  });
});
