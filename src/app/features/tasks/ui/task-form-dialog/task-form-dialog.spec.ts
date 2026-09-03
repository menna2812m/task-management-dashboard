import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskDialogData } from '../../models/task.models';

import { TaskFormDialog } from './task-form-dialog';

describe('TaskFormDialog', () => {
  let component: TaskFormDialog;
  let fixture: ComponentFixture<TaskFormDialog>;

  beforeEach(async () => {
    const data: TaskDialogData = { assignees: [] };

    await TestBed.configureTestingModule({
      imports: [TaskFormDialog],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: (): void => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
