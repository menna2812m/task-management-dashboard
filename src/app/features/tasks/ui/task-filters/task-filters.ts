import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { Assignee } from '../../models/task.models';
import { TaskPriorityFilter, TaskStatusFilter } from '../../data-access/task-store';

@Component({
  selector: 'app-task-filters',
  imports: [ReactiveFormsModule, MatButtonModule, TranslatePipe],
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

  protected readonly filtersForm = new FormGroup({
    searchTerm: new FormControl('', { nonNullable: true }),
    status: new FormControl<TaskStatusFilter>('all', { nonNullable: true }),
    priority: new FormControl<TaskPriorityFilter>('all', { nonNullable: true }),
    assigneeId: new FormControl('all', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      this.filtersForm.setValue(
        {
          searchTerm: this.searchTerm(),
          status: this.status(),
          priority: this.priority(),
          assigneeId: this.assigneeId(),
        },
        { emitEvent: false },
      );
    });

    this.filtersForm.controls.searchTerm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((searchTerm) => this.searchTermChange.emit(searchTerm));
    this.filtersForm.controls.status.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((status) => this.statusChange.emit(status));
    this.filtersForm.controls.priority.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((priority) => this.priorityChange.emit(priority));
    this.filtersForm.controls.assigneeId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((assigneeId) => this.assigneeChange.emit(assigneeId));
  }

  protected resetFilters(): void {
    this.filtersForm.reset(
      { searchTerm: '', status: 'all', priority: 'all', assigneeId: 'all' },
      { emitEvent: false },
    );
    this.clearFilters.emit();
  }
}
