import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task, TaskPriority, TaskStatus } from '../../models/task.models';
import { isTaskOverdue } from '../../utils/task-status.utils';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();

  protected readonly isOverdue = computed(() => isTaskOverdue(this.task()));

  protected readonly statusLabels: Record<TaskStatus, string> = {
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
  };

  protected readonly priorityClasses: Record<TaskPriority, string> = {
    low: 'bg-emerald-50 text-emerald-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
  };

  protected readonly statusClasses: Record<TaskStatus, string> = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-50 text-blue-700',
    done: 'bg-emerald-50 text-emerald-700',
  };
}
