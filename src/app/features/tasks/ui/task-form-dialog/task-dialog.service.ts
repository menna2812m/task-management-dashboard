import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TaskStore } from '../../data-access/task-store';
import { Task, TaskDialogData, TaskFormValue } from '../../models/task.models';
import type { TaskFormDialog } from './task-form-dialog';

/**
 * Single place that knows how to open the task form, so every "New Task" button behaves alike.
 * The dialog component is imported lazily so the shell does not carry the form bundle.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly taskStore = inject(TaskStore);

  openCreate(): Promise<MatDialogRef<TaskFormDialog, TaskFormValue>> {
    return this.open();
  }

  openEdit(task: Task): Promise<MatDialogRef<TaskFormDialog, TaskFormValue>> {
    return this.open(task);
  }

  closeAll(): void {
    this.dialog.closeAll();
  }

  private async open(task?: Task): Promise<MatDialogRef<TaskFormDialog, TaskFormValue>> {
    const { TaskFormDialog } = await import('./task-form-dialog');

    return this.dialog.open<TaskFormDialog, TaskDialogData, TaskFormValue>(TaskFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      data: {
        task,
        assignees: this.taskStore.assignees(),
      },
    });
  }
}
