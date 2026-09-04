import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  const storageKey = 'task-manager-language';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => localStorage.removeItem(storageKey));

  it('restores a supported saved language', () => {
    localStorage.setItem(storageKey, 'ar');

    const service = TestBed.runInInjectionContext(() => new TranslationService());

    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
  });

  it('falls back to English when the saved value is unsupported', () => {
    localStorage.setItem(storageKey, 'fr');

    const service = TestBed.runInInjectionContext(() => new TranslationService());

    expect(service.language()).toBe('en');
    expect(service.direction()).toBe('ltr');
  });

  it('persists language changes', () => {
    const service = TestBed.runInInjectionContext(() => new TranslationService());

    service.setLanguage('ar');

    expect(localStorage.getItem(storageKey)).toBe('ar');
    expect(service.translate('tasks')).toBe('المهام');
  });
});
