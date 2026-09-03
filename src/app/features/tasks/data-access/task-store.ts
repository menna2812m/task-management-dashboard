import { computed, inject, Injectable, signal } from '@angular/core';
import { CURRENT_USER } from '../../../core/auth/current-user';
import { UsersApi } from '../../team/data-access/users-api';
import { ActivityType, NewActivity } from '../models/activity.models';
import {
  Assignee,
  NewTask,
  Task,
  TaskFormValue,
  TaskPriority,
  TaskStatus,
} from '../models/task.models';
import { isCompletedOn, isTaskOverdue } from '../utils/task-status.utils';
import { ActivityApi } from './activity-api';
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
  private readonly usersApi = inject(UsersApi);
  private readonly activityApi = inject(ActivityApi);

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

  /**
   * People a task can be assigned to: the users directory when it has loaded, otherwise the
   * assignees already present on tasks so the form stays usable while users are unavailable.
   */
  readonly assignees = computed<readonly Assignee[]>(() => {
    const users = this.usersApi.users.hasValue() ? this.usersApi.users.value() : [];

    if (users.length) {
      return users;
    }

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
    this.taskApi.refresh();
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

    return this.mutate(
      () => this.taskApi.create(draft),
      (saved) => this.activityFor('created', saved),
    );
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
    const becameDone = updated.status === 'done' && existing.status !== 'done';

    return this.mutate(
      () => this.taskApi.update(updated),
      (saved) => this.activityFor(becameDone ? 'completed' : 'updated', saved),
    );
  }

  /**
   * Moves a card to another board column. Reuse the normal update path so completion
   * timestamps, activity logging and cache invalidation stay consistent with form edits.
   */
  moveTask(task: Task, status: TaskStatus): Promise<Task> {
    if (task.status === status) {
      return Promise.resolve(task);
    }

    return this.updateTask(task, {
      title: task.title,
      description: task.description,
      status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assignee.id,
      tags: task.tags,
    });
  }

  /** Deletes a task and refreshes the list. */
  deleteTask(task: Task): Promise<void> {
    return this.mutate(
      () => this.taskApi.remove(task.id),
      () => this.activityFor('deleted', task),
    );
  }

  /**
   * Runs one mutation, tracking the saving flag, reloading the list and logging an activity
   * entry on success. Errors from the mutation propagate so the UI can report them; a failed
   * activity log is swallowed because it must never undo or block a successful change.
   */
  private async mutate<T>(
    request: () => Promise<T>,
    activity: (result: T) => NewActivity,
  ): Promise<T> {
    this.isSaving.set(true);

    try {
      const result = await request();
      this.taskApi.refresh();
      void this.activityApi.record(activity(result)).catch(() => undefined);

      return result;
    } finally {
      this.isSaving.set(false);
    }
  }

  private activityFor(type: ActivityType, task: Task): NewActivity {
    return {
      type,
      taskId: task.id,
      taskTitle: task.title,
      actor: CURRENT_USER,
      timestamp: new Date().toISOString(),
    };
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
