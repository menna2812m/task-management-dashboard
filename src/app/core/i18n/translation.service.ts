import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AR_TRANSLATIONS } from './locales/ar';
import { EN_TRANSLATIONS } from './locales/en';

export type AppLanguage = 'en' | 'ar';

const locales: Record<AppLanguage, Record<string, string>> = {
  en: EN_TRANSLATIONS,
  ar: AR_TRANSLATIONS,
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<AppLanguage>('en');
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
      this.document.documentElement.dir = this.direction();
    });
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
  }

  translate(key: string): string {
    return locales[this.language()][key] ?? EN_TRANSLATIONS[key] ?? key;
  }
}
