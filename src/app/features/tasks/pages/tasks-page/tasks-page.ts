import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskApi } from '../../data-access/task-api';
import { TaskStore } from '../../data-access/task-store';
import { TaskFilters } from '../../ui/task-filters/task-filters';
import { TaskCard } from '../../ui/task-card/task-card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TaskFormDialog } from '../../ui/task-form-dialog/task-form-dialog';
@Component({
  selector: 'app-tasks-page',
  imports: [MatButtonModule, TaskFilters, TaskCard],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  protected readonly taskApi = inject(TaskApi);
  protected readonly taskStore = inject(TaskStore);
  private readonly dialog = inject(MatDialog);

  protected openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      data: {
        assignees: this.taskStore.assignees(),
      },
    });

    dialogRef.afterClosed().subscribe((formValue) => {
      if (!formValue) {
        return;
      }

      // سنرسل formValue إلى TaskStore في الخطوة التالية.
      console.log(formValue);
    });
  }
}
