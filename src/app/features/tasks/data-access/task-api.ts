import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpCacheService } from '../../../core/http/http-cache.service';
import { TranslationService } from '../../../core/i18n/translation.service';
import { NewTask, Task } from '../models/task.models';

@Injectable({
  providedIn: 'root',
})
export class TaskApi {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(HttpCacheService);
  private readonly translations = inject(TranslationService);
  private readonly tasksUrl = `${environment.apiUrl}/tasks`;

  /** The task list, kept as a resource so callers get loading and error state for free. */
  readonly tasks = httpResource<Task[]>(
    () => {
      this.translations.language();
      return this.tasksUrl;
    },
    {
      defaultValue: [],
    },
  );

  /** Re-fetches the list from the backend, bypassing any cached copy. */
  refresh(): void {
    this.cache.invalidate(this.tasksUrl);
    this.tasks.reload();
  }

  /** Persists a new task. The server assigns the id and returns the stored record. */
  create(task: NewTask): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(this.tasksUrl, task));
  }

  /** Replaces an existing task wholesale. */
  update(task: Task): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`${this.tasksUrl}/${task.id}`, task));
  }

  /** Deletes a task by id. */
  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.tasksUrl}/${id}`));
  }
}
