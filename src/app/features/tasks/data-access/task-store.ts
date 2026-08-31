import { computed, inject, Injectable, signal } from '@angular/core';
import { TaskPriority, TaskStatus } from '../models/task.models';
import { TaskApi } from './task-api';

export type TaskStatusFilter = TaskStatus | 'all';
export type TaskPriorityFilter = TaskPriority | 'all';

@Injectable({
  providedIn: 'root',
})
export class TaskStore {
  private readonly taskApi = inject(TaskApi);

  readonly searchTerm = signal('');
  readonly statusFilter = signal<TaskStatusFilter>('all');
  readonly priorityFilter = signal<TaskPriorityFilter>('all');
  readonly assigneeFilter = signal<string>('all');

  readonly tasks = computed(() =>
    this.taskApi.tasks.hasValue() ? this.taskApi.tasks.value() : [],
  );

  readonly isLoading = this.taskApi.tasks.isLoading;
  readonly error = this.taskApi.tasks.error;

  readonly filteredTasks = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const assigneeId = this.assigneeFilter();

    return this.tasks().filter((task) => {
      const matchesSearch =
        !searchTerm ||
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm);

      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const matchesAssignee = assigneeId === 'all' || task.assignee.id === assigneeId;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  });

  readonly assignees = computed(() => {
    const uniqueAssignees = new Map(this.tasks().map((task) => [task.assignee.id, task.assignee]));

    return [...uniqueAssignees.values()];
  });

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setStatusFilter(value: TaskStatusFilter): void {
    this.statusFilter.set(value);
  }

  setPriorityFilter(value: TaskPriorityFilter): void {
    this.priorityFilter.set(value);
  }

  setAssigneeFilter(value: string): void {
    this.assigneeFilter.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.assigneeFilter.set('all');
  }

  reload(): void {
    this.taskApi.tasks.reload();
  }
}
