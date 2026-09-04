import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../core/i18n/translation.service';
import { Activity, NewActivity } from '../models/activity.models';

const FEED_SIZE = 10;

/**
 * Recent-activity log. Entries recorded in this session are merged into the fetched list
 * immediately, so the feed updates without another round trip after every change.
 */
@Injectable({
  providedIn: 'root',
})
export class ActivityApi {
  private readonly http = inject(HttpClient);
  private readonly translations = inject(TranslationService);
  private readonly activitiesUrl = `${environment.apiUrl}/activities`;

  private readonly stored = httpResource<Activity[]>(
    () => {
      this.translations.language();
      return this.activitiesUrl;
    },
    {
      defaultValue: [],
    },
  );
  private readonly recorded = signal<Activity[]>([]);

  readonly isLoading = this.stored.isLoading;

  /** Newest first, capped to the feed size. */
  readonly recent = computed<Activity[]>(() => {
    const fetched = this.stored.hasValue() ? this.stored.value() : [];
    const byId = new Map<string, Activity>();

    for (const activity of [...fetched, ...this.recorded()]) {
      byId.set(activity.id, activity);
    }

    return [...byId.values()]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, FEED_SIZE);
  });

  /** Persists one entry and shows it right away. Rejects if the backend refuses it. */
  async record(entry: NewActivity): Promise<Activity> {
    const saved = await firstValueFrom(this.http.post<Activity>(this.activitiesUrl, entry));
    this.recorded.update((list) => [saved, ...list]);

    return saved;
  }
}
