import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RETRY_BASE_DELAY_MS, retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  /** Let the retry timer (0ms in tests) fire before expecting the next attempt. */
  const nextTick = () => new Promise((resolve) => setTimeout(resolve, 5));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
        { provide: RETRY_BASE_DELAY_MS, useValue: 0 },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  /**
   * Attaches a handler immediately so a rejection that lands while the test is still
   * flushing requests is not reported as unhandled.
   */
  const settled = (promise: Promise<unknown>) =>
    promise.then(
      () => 'resolved',
      () => 'rejected',
    );

  afterEach(() => httpTesting.verify());

  it('retries a GET that fails with a server error and returns the eventual success', async () => {
    const result = firstValueFrom(http.get('/api/tasks'));

    httpTesting.expectOne('/api/tasks').flush('down', { status: 503, statusText: 'Unavailable' });
    await nextTick();
    httpTesting.expectOne('/api/tasks').flush('down', { status: 500, statusText: 'Error' });
    await nextTick();
    httpTesting.expectOne('/api/tasks').flush([1]);

    await expectAsync(result).toBeResolvedTo([1]);
  });

  it('gives up after two retries and surfaces the last error', async () => {
    const outcome = settled(firstValueFrom(http.get('/api/tasks')));

    for (let attempt = 0; attempt < 3; attempt++) {
      httpTesting.expectOne('/api/tasks').flush('down', { status: 500, statusText: 'Error' });
      await nextTick();
    }

    await expectAsync(outcome).toBeResolvedTo('rejected');
    httpTesting.expectNone('/api/tasks');
  });

  it('retries network failures', async () => {
    const result = firstValueFrom(http.get('/api/tasks'));

    httpTesting.expectOne('/api/tasks').error(new ProgressEvent('error'));
    await nextTick();
    httpTesting.expectOne('/api/tasks').flush([1]);

    await expectAsync(result).toBeResolvedTo([1]);
  });

  it('does not retry client errors', async () => {
    const outcome = settled(firstValueFrom(http.get('/api/tasks/404')));

    httpTesting
      .expectOne('/api/tasks/404')
      .flush('missing', { status: 404, statusText: 'Not Found' });
    await nextTick();

    await expectAsync(outcome).toBeResolvedTo('rejected');
    httpTesting.expectNone('/api/tasks/404');
  });

  it('does not retry writes, which may not be idempotent', async () => {
    const outcome = settled(firstValueFrom(http.post('/api/tasks', {})));

    httpTesting.expectOne('/api/tasks').flush('down', { status: 500, statusText: 'Error' });
    await nextTick();

    await expectAsync(outcome).toBeResolvedTo('rejected');
    httpTesting.expectNone('/api/tasks');
  });
});
