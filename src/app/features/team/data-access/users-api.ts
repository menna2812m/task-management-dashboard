import { httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpCacheService } from '../../../core/http/http-cache.service';
import { TranslationService } from '../../../core/i18n/translation.service';
import { Assignee } from '../../tasks/models/task.models';

@Injectable({
  providedIn: 'root',
})
export class UsersApi {
  private readonly cache = inject(HttpCacheService);
  private readonly translations = inject(TranslationService);
  private readonly usersUrl = `${environment.apiUrl}/users`;

  /** Everyone who can be assigned a task. */
  readonly users = httpResource<Assignee[]>(
    () => {
      this.translations.language();
      return this.usersUrl;
    },
    {
      defaultValue: [],
    },
  );

  /** Re-fetches the list, bypassing any cached copy. */
  refresh(): void {
    this.cache.invalidate(this.usersUrl);
    this.users.reload();
  }
}
