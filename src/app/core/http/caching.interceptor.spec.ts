import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { cachingInterceptor } from './caching.interceptor';

describe('cachingInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([cachingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('serves a repeated GET from the cache without hitting the backend', async () => {
    const first = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([{ id: 1 }]);
    await expectAsync(first).toBeResolvedTo([{ id: 1 }]);

    const second = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectNone('/api/tasks');
    await expectAsync(second).toBeResolvedTo([{ id: 1 }]);
  });

  it('caches per url, including the query string', async () => {
    const all = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([1, 2]);
    await all;

    const filtered = firstValueFrom(http.get('/api/tasks?status=done'));
    httpTesting.expectOne('/api/tasks?status=done').flush([2]);
    await expectAsync(filtered).toBeResolvedTo([2]);
  });

  it('caches different languages independently', async () => {
    const english = firstValueFrom(
      http.get('/api/tasks', { headers: { 'Accept-Language': 'en' } }),
    );
    httpTesting.expectOne('/api/tasks').flush([{ title: 'Task' }]);
    await english;

    const arabic = firstValueFrom(http.get('/api/tasks', { headers: { 'Accept-Language': 'ar' } }));
    httpTesting.expectOne('/api/tasks').flush([{ title: 'مهمة' }]);
    await expectAsync(arabic).toBeResolvedTo([{ title: 'مهمة' }]);
  });

  it('does not cache failed responses', async () => {
    const failed = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush('boom', { status: 500, statusText: 'Error' });
    await expectAsync(failed).toBeRejected();

    const retry = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([]);
    await expectAsync(retry).toBeResolvedTo([]);
  });

  it('invalidates the collection when it is written to', async () => {
    const list = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([1]);
    await list;

    const create = firstValueFrom(http.post('/api/tasks', { title: 'x' }));
    httpTesting.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 2 });
    await create;

    const fresh = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([1, 2]);
    await expectAsync(fresh).toBeResolvedTo([1, 2]);
  });

  it('invalidates the collection when one of its items is updated or deleted', async () => {
    const list = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([1]);
    await list;

    const remove = firstValueFrom(http.delete('/api/tasks/1'));
    httpTesting.expectOne({ method: 'DELETE', url: '/api/tasks/1' }).flush({});
    await remove;

    const fresh = firstValueFrom(http.get('/api/tasks'));
    httpTesting.expectOne('/api/tasks').flush([]);
    await expectAsync(fresh).toBeResolvedTo([]);
  });

  it('leaves other collections cached when one is written to', async () => {
    const users = firstValueFrom(http.get('/api/users'));
    httpTesting.expectOne('/api/users').flush(['u']);
    await users;

    const create = firstValueFrom(http.post('/api/tasks', {}));
    httpTesting.expectOne({ method: 'POST', url: '/api/tasks' }).flush({});
    await create;

    const cached = firstValueFrom(http.get('/api/users'));
    httpTesting.expectNone('/api/users');
    await expectAsync(cached).toBeResolvedTo(['u']);
  });

  it('never caches non-GET requests', async () => {
    const first = firstValueFrom(http.post('/api/tasks', {}));
    httpTesting.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 1 });
    await first;

    const second = firstValueFrom(http.post('/api/tasks', {}));
    httpTesting.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 2 });
    await expectAsync(second).toBeResolvedTo({ id: 2 });
  });
});
