import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../../../../core/ui/icon/icon';
import {
  TaskPriorityFilter,
  TaskStatusFilter,
  TaskStore,
} from '../../../tasks/data-access/task-store';
import { TaskStatus } from '../../../tasks/models/task.models';
import { TaskCard } from '../../../tasks/ui/task-card/task-card';
import { TaskDialogService } from '../../../tasks/ui/task-form-dialog/task-dialog.service';

interface StatusTab {
  value: TaskStatusFilter;
  label: string;
}

interface BoardColumn {
  status: TaskStatus;
  label: string;
  emptyMessage: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [TaskCard, Icon],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  protected readonly taskStore = inject(TaskStore);
  protected readonly taskDialog = inject(TaskDialogService);

  protected readonly statusTabs: readonly StatusTab[] = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  protected readonly columns: readonly BoardColumn[] = [
    { status: 'todo', label: 'To Do', emptyMessage: 'Nothing to do' },
    { status: 'in_progress', label: 'In Progress', emptyMessage: 'Nothing in progress' },
    { status: 'done', label: 'Done', emptyMessage: 'Nothing done yet' },
  ];

  protected onPriorityChange(event: Event): void {
    this.taskStore.setPriorityFilter(
      (event.target as HTMLSelectElement).value as TaskPriorityFilter,
    );
  }
}
