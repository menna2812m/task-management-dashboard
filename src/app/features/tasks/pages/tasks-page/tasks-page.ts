import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskApi } from '../../data-access/task-api';
import { TaskStore } from '../../data-access/task-store';
import { TaskFilters } from '../../ui/task-filters/task-filters';
@Component({
  selector: 'app-tasks-page',
  imports: [TaskFilters],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  protected readonly taskApi = inject(TaskApi);
  protected readonly taskStore = inject(TaskStore);
}
