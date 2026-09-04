import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { cachingInterceptor } from './core/http/caching.interceptor';
import { retryInterceptor } from './core/http/retry.interceptor';
import { languageInterceptor } from './core/http/language.interceptor';
import { mockLocalizationInterceptor } from './core/http/mock-localization.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Add the language before caching so responses are cached independently per locale.
    provideHttpClient(
      withInterceptors([
        languageInterceptor,
        cachingInterceptor,
        retryInterceptor,
        mockLocalizationInterceptor,
      ]),
    ),
  ],
};
