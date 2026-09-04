import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';
import { mockLocalizationInterceptor } from './mock-localization.interceptor';

describe('mockLocalizationInterceptor', () => {
  it('localizes mock task data when Arabic is active', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([mockLocalizationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(TranslationService).setLanguage('ar');

    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    const response = firstValueFrom(
      http.get<{ title: string; assignee: { name: string } }[]>('/api/tasks'),
    );

    httpTesting.expectOne('/api/tasks').flush([
      {
        id: 'task-001',
        title: 'Design new homepage layout',
        description: 'English description',
        assignee: { id: 'user-001', name: 'John Doe' },
      },
    ]);

    await expectAsync(response).toBeResolvedTo([
      jasmine.objectContaining({
        title: 'تصميم تخطيط جديد للصفحة الرئيسية',
        assignee: jasmine.objectContaining({ name: 'جون دو' }),
      }),
    ]);
    httpTesting.verify();
  });
});
