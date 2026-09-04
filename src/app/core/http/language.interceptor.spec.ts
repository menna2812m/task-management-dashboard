import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';
import { languageInterceptor } from './language.interceptor';

describe('languageInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let translations: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    translations = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('task-manager-language');
  });

  it('sends the active language in Accept-Language', async () => {
    translations.setLanguage('ar');

    const response = firstValueFrom(http.get('/api/tasks'));
    const request = httpTesting.expectOne('/api/tasks');

    expect(request.request.headers.get('Accept-Language')).toBe('ar');
    request.flush([]);
    await response;
  });
});
