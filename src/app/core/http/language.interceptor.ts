import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

/** Sends the active UI language with every API request. */
export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  const language = inject(TranslationService).language();

  return next(
    request.clone({
      setHeaders: { 'Accept-Language': language },
    }),
  );
};
