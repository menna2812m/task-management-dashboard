import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../core/ui/confirm-dialog/confirm-dialog';
import { TaskStore } from '../../data-access/task-store';
import { Task, TaskDialogData, TaskFormValue } from '../../models/task.models';
import type { TaskFormDialog } from './task-form-dialog';

type FormDialogRef = MatDialogRef<TaskFormDialog, TaskFormValue>;

/**
 * Owns every task dialog flow: create, edit and delete-with-confirmation. Each flow persists
 * through the store and reports the outcome in a snackbar, so pages only call one method.
 * The form component is imported lazily so the shell does not carry the form bundle.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly taskStore = inject(TaskStore);

  /** Opens the create form; saves when it closes with a value. */
  async openCreate(): Promise<FormDialogRef> {
    const ref = await this.openForm();

    ref.afterClosed().subscribe((value) => {
      if (value) {
        void this.run(() => this.taskStore.createTask(value), 'Task created');
      }
    });

    return ref;
  }

  /** Opens the edit form for `task`; saves when it closes with a value. */
  async openEdit(task: Task): Promise<FormDialogRef> {
    const ref = await this.openForm(task);

    ref.afterClosed().subscribe((value) => {
      if (value) {
        void this.run(() => this.taskStore.updateTask(task, value), 'Task updated');
      }
    });

    return ref;
  }

  /** Asks before deleting. Resolves true only when the task was deleted. */
  async confirmDelete(task: Task): Promise<boolean> {
    const data: ConfirmDialogData = {
      title: 'Delete task?',
      message: `"${task.title}" will be removed for everyone. This cannot be undone.`,
      confirmLabel: 'Delete',
    };
    const confirmed = await firstValueFrom(
      this.dialog
        .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
        .afterClosed(),
    );

    if (!confirmed) {
      return false;
    }

    return this.run(
      () => this.taskStore.deleteTask(task),
      'Task deleted',
      'Task could not be deleted. Try again.',
    );
  }

  closeAll(): void {
    this.dialog.closeAll();
  }

  private async openForm(task?: Task): Promise<FormDialogRef> {
    const { TaskFormDialog } = await import('./task-form-dialog');

    return this.dialog.open<TaskFormDialog, TaskDialogData, TaskFormValue>(TaskFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: 'calc(100dvh - 2rem)',
      data: {
        task,
        assignees: this.taskStore.assignees(),
      },
    });
  }

  /** Runs a mutation and reports success or failure. Resolves true on success. */
  private async run(
    mutation: () => Promise<unknown>,
    successMessage: string,
    failureMessage = 'Task could not be saved. Try again.',
  ): Promise<boolean> {
    try {
      await mutation();
      this.snackBar.open(successMessage, undefined, { duration: 3000 });

      return true;
    } catch {
      this.snackBar.open(failureMessage, 'Dismiss', { duration: 6000 });

      return false;
    }
  }
}
