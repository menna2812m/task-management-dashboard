import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TaskStore } from '../../data-access/task-store';
import { TaskFilters } from '../../ui/task-filters/task-filters';
import { TaskCard } from '../../ui/task-card/task-card';
import { TaskDialogService } from '../../ui/task-form-dialog/task-dialog.service';

@Component({
  selector: 'app-tasks-page',
  imports: [MatButtonModule, TaskFilters, TaskCard],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  protected readonly taskStore = inject(TaskStore);
  protected readonly taskDialog = inject(TaskDialogService);
}
