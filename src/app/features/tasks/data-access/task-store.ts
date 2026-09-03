import { computed, inject, Injectable, signal } from '@angular/core';
import { NewTask, Task, TaskFormValue, TaskPriority, TaskStatus } from '../models/task.models';
import { isCompletedOn, isTaskOverdue } from '../utils/task-status.utils';
import { TaskApi } from './task-api';

export type TaskStatusFilter = TaskStatus | 'all';
export type TaskPriorityFilter = TaskPriority | 'all';

export type TasksByStatus = Record<TaskStatus, Task[]>;

export interface TaskStats {
  total: number;
  completed: number;
  completedToday: number;
  inProgress: number;
  overdue: number;
}

export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done'];

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

  /** True while a create, update or delete request is in flight. */
  readonly isSaving = signal(false);

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

  /** Filtered tasks grouped into one column per status, in the order tasks arrive. */
  readonly tasksByStatus = computed<TasksByStatus>(() => {
    const columns: TasksByStatus = { todo: [], in_progress: [], done: [] };

    for (const task of this.filteredTasks()) {
      columns[task.status].push(task);
    }

    return columns;
  });

  /** Summary numbers over every task, unaffected by the active filters. */
  readonly stats = computed<TaskStats>(() => {
    const today = new Date();
    const tasks = this.tasks();

    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === 'done').length,
      completedToday: tasks.filter((task) => isCompletedOn(task, today)).length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      overdue: tasks.filter((task) => isTaskOverdue(task, today)).length,
    };
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

  /** Creates a task from the form value and refreshes the list. */
  async createTask(value: TaskFormValue): Promise<Task> {
    const now = new Date().toISOString();
    const draft: NewTask = {
      ...this.toTaskFields(value),
      completedAt: value.status === 'done' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    return this.mutate(() => this.taskApi.create(draft));
  }

  /** Applies the form value to an existing task and refreshes the list. */
  async updateTask(existing: Task, value: TaskFormValue): Promise<Task> {
    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      ...this.toTaskFields(value),
      completedAt: this.completedAtFor(existing, value.status, now),
      updatedAt: now,
    };

    return this.mutate(() => this.taskApi.update(updated));
  }

  /** Deletes a task and refreshes the list. */
  deleteTask(id: string): Promise<void> {
    return this.mutate(() => this.taskApi.remove(id));
  }

  /**
   * Runs one mutation, tracking the saving flag and reloading the list on success.
   * Errors propagate to the caller so the UI can report them.
   */
  private async mutate<T>(request: () => Promise<T>): Promise<T> {
    this.isSaving.set(true);

    try {
      const result = await request();
      this.taskApi.tasks.reload();

      return result;
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Maps the flat form value onto task fields, resolving the assignee by id. */
  private toTaskFields(value: TaskFormValue) {
    const assignee = this.assignees().find((candidate) => candidate.id === value.assigneeId);

    if (!assignee) {
      throw new Error(`Unknown assignee "${value.assigneeId}"`);
    }

    return {
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      assignee,
      tags: value.tags,
    };
  }

  /**
   * A task keeps its original completion time while it stays done, is stamped when it
   * becomes done, and loses the stamp when it is reopened.
   */
  private completedAtFor(existing: Task, status: TaskStatus, now: string): string | undefined {
    if (status !== 'done') {
      return undefined;
    }

    return existing.completedAt ?? now;
  }
}
