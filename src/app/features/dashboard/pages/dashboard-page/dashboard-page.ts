import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Icon } from '../../../../core/ui/icon/icon';
import {
  TaskPriorityFilter,
  TaskStats,
  TaskStatusFilter,
  TaskStore,
} from '../../../tasks/data-access/task-store';
import { TaskPriority, TaskStatus } from '../../../tasks/models/task.models';
import { ActivityApi } from '../../../tasks/data-access/activity-api';
import { TaskCard } from '../../../tasks/ui/task-card/task-card';
import { TaskDialogService } from '../../../tasks/ui/task-form-dialog/task-dialog.service';
import { DEFAULT_STATISTICS, StatisticsApi } from '../../data-access/statistics-api';
import { Statistic } from '../../models/statistic.models';
import { ActivityFeed } from '../../ui/activity-feed/activity-feed';
import { ChartSlice, DistributionChart } from '../../ui/distribution-chart/distribution-chart';
import { StatCard } from '../../ui/stat-card/stat-card';

interface StatusTab {
  value: TaskStatusFilter;
  label: string;
}

interface BoardColumn {
  status: TaskStatus;
  label: string;
  emptyMessage: string;
}

/**
 * Which live count backs each backend statistic, plus a stable slug for styling and tests.
 * The backend value is a snapshot; showing the store's count keeps cards and board consistent.
 */
const STATISTIC_SLOTS: Record<string, { slug: string; stat: keyof TaskStats }> = {
  'stat-001': { slug: 'total', stat: 'total' },
  'stat-002': { slug: 'completed', stat: 'completed' },
  'stat-003': { slug: 'in-progress', stat: 'inProgress' },
  'stat-004': { slug: 'overdue', stat: 'overdue' },
};

@Component({
  selector: 'app-dashboard-page',
  imports: [DragDropModule, TaskCard, StatCard, ActivityFeed, DistributionChart, Icon],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  protected readonly taskStore = inject(TaskStore);
  protected readonly taskDialog = inject(TaskDialogService);
  private readonly statisticsApi = inject(StatisticsApi);
  protected readonly activityApi = inject(ActivityApi);
  private readonly snackBar = inject(MatSnackBar);

  /** Cards from the backend, or the built-in set while loading or when the request failed. */
  protected readonly statistics = computed<readonly Statistic[]>(() => {
    const loaded = this.statisticsApi.statistics.hasValue()
      ? this.statisticsApi.statistics.value()
      : [];

    return loaded.length ? loaded : DEFAULT_STATISTICS;
  });

  /** Distribution of every task by status, for the doughnut chart. */
  protected readonly statusSlices = computed<ChartSlice[]>(() => {
    const tasks = this.taskStore.tasks();
    const count = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;

    return [
      { label: 'To do', value: count('todo'), color: '#64B5F6' },
      { label: 'In progress', value: count('in_progress'), color: '#FF6F00' },
      { label: 'Done', value: count('done'), color: '#388E3C' },
    ];
  });

  /** Distribution of every task by priority, matching the pill colours. */
  protected readonly prioritySlices = computed<ChartSlice[]>(() => {
    const tasks = this.taskStore.tasks();
    const count = (priority: TaskPriority) =>
      tasks.filter((task) => task.priority === priority).length;

    return [
      { label: 'High', value: count('high'), color: '#D32F2F' },
      { label: 'Medium', value: count('medium'), color: '#FF6F00' },
      { label: 'Low', value: count('low'), color: '#388E3C' },
    ];
  });

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

  /** The store's count for a statistic, or undefined for cards we do not compute locally. */
  protected liveValue(statistic: Statistic): number | undefined {
    const slot = STATISTIC_SLOTS[statistic.id];

    return slot ? this.taskStore.stats()[slot.stat] : undefined;
  }

  protected slotFor(statistic: Statistic): string {
    return STATISTIC_SLOTS[statistic.id]?.slug ?? statistic.id;
  }

  protected onPriorityChange(event: Event): void {
    this.taskStore.setPriorityFilter(
      (event.target as HTMLSelectElement).value as TaskPriorityFilter,
    );
  }

  /** Persists a cross-column card move; dropping back into the same column is a no-op. */
  protected onTaskDrop(event: CdkDragDrop<TaskStatus>): void {
    const task = event.item.data;
    const status = event.container.data;

    if (task.status === status) {
      return;
    }

    void this.taskStore.moveTask(task, status).catch(() => {
      this.snackBar.open('Task status could not be updated', 'Dismiss', { duration: 4000 });
    });
  }
}
