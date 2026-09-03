import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Assignee } from '../../models/task.models';
import { TaskPriorityFilter, TaskStatusFilter } from '../../data-access/task-store';

@Component({
  selector: 'app-task-filters',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './task-filters.html',
  styleUrl: './task-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilters {
  readonly assignees = input.required<readonly Assignee[]>();

  readonly searchTerm = input('');
  readonly status = input<TaskStatusFilter>('all');
  readonly priority = input<TaskPriorityFilter>('all');
  readonly assigneeId = input('all');

  readonly searchTermChange = output<string>();
  readonly statusChange = output<TaskStatusFilter>();
  readonly priorityChange = output<TaskPriorityFilter>();
  readonly assigneeChange = output<string>();
  readonly clearFilters = output<void>();

  protected onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchTermChange.emit(inputElement.value);
  }
}
