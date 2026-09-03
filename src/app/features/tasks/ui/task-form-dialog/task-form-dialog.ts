import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormArray,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskDialogData, TaskFormValue } from '../../models/task.models';
import { noWhitespaceValidator } from '../../validators/no-whitespace.validator';

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject<MatDialogRef<TaskFormDialog, TaskFormValue>>(MatDialogRef);

  protected readonly data = inject<TaskDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.formBuilder.group({
    title: [
      this.data.task?.title ?? '',
      [
        Validators.required,
        noWhitespaceValidator,
        Validators.minLength(3),
        Validators.maxLength(100),
      ],
    ],
    description: [
      this.data.task?.description ?? '',
      [Validators.required, noWhitespaceValidator, Validators.maxLength(500)],
    ],
    status: this.formBuilder.control(this.data.task?.status ?? 'todo'),
    priority: this.formBuilder.control(this.data.task?.priority ?? 'medium'),
    dueDate: [this.data.task?.dueDate ?? '', Validators.required],
    assigneeId: [this.data.task?.assignee.id ?? '', Validators.required],
    tags: this.formBuilder.array(
      this.data.task?.tags.length
        ? this.data.task.tags.map((tag) =>
            this.formBuilder.control(tag, [Validators.required, noWhitespaceValidator]),
          )
        : [this.formBuilder.control('', [Validators.required, noWhitespaceValidator])],
    ),
  });

  protected get tags(): FormArray<FormControl<string>> {
    return this.form.controls.tags;
  }

  protected addTag(): void {
    this.tags.push(this.formBuilder.control('', [Validators.required, noWhitespaceValidator]));
  }

  protected removeTag(index: number): void {
    if (this.tags.length > 1) {
      this.tags.removeAt(index);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.dialogRef.close({
      ...value,
      title: value.title.trim(),
      description: value.description.trim(),
      tags: value.tags.map((tag) => tag.trim()),
    });
  }
}
