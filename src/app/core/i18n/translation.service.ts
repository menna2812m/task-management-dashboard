import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AR_TRANSLATIONS } from './locales/ar';
import { EN_TRANSLATIONS } from './locales/en';

export type AppLanguage = 'en' | 'ar';
const LANGUAGE_STORAGE_KEY = 'task-manager-language';

const locales: Record<AppLanguage, Record<string, string>> = {
  en: EN_TRANSLATIONS,
  ar: AR_TRANSLATIONS,
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;
  readonly language = signal<AppLanguage>(this.savedLanguage());
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
      this.document.documentElement.dir = this.direction();
    });
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  translate(key: string): string {
    return locales[this.language()][key] ?? EN_TRANSLATIONS[key] ?? key;
  }

  private savedLanguage(): AppLanguage {
    const saved = this.storage?.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  }
}
