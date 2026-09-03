import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Icon } from '../../../../core/ui/icon/icon';
import { Task, TaskPriority, TaskStatus } from '../../models/task.models';
import { DueKind, getDueInfo } from '../../utils/task-status.utils';

@Component({
  selector: 'app-task-card',
  imports: [MatMenuModule, Icon],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  /** Show the status pill; off by default because board columns already convey it. */
  readonly showStatus = input(false);

  readonly edit = output<Task>();
  readonly delete = output<Task>();

  protected readonly dueInfo = computed(() => getDueInfo(this.task()));
  protected readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);

  protected readonly priorityLabels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  protected readonly priorityClasses: Record<TaskPriority, string> = {
    low: 'bg-priority-low-bg text-priority-low',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-600',
  };

  protected readonly statusLabels: Record<TaskStatus, string> = {
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
  };

  /** Emoji glyphs, matching the design; hidden from assistive tech since the label carries meaning. */
  protected readonly dueEmoji: Record<DueKind, string> = {
    overdue: '⚠️',
    upcoming: '📅',
    completed: '✅',
  };

  protected readonly dueClasses: Record<DueKind, string> = {
    overdue: 'text-red-600',
    upcoming: 'text-slate-500',
    completed: 'text-emerald-600',
  };
}
