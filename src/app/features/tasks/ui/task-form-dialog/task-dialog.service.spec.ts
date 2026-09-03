import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { createTask } from '../../testing/task.fixtures';
import { TaskDialogService } from './task-dialog.service';

describe('TaskDialogService', () => {
  let service: TaskDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TaskDialogService);
  });

  afterEach(() => {
    service.closeAll();
    TestBed.tick();
  });

  it('opens the form in create mode when no task is given', async () => {
    await service.openCreate();
    TestBed.tick();

    const dialog = document.querySelector('mat-dialog-container');
    expect(dialog?.textContent).toContain('Create task');
  });

  it('opens the form in edit mode for an existing task', async () => {
    await service.openEdit(createTask({ title: 'Ship the board' }));
    TestBed.tick();

    const dialog = document.querySelector('mat-dialog-container');
    expect(dialog?.textContent).toContain('Edit task');
    expect(dialog?.querySelector<HTMLInputElement>('input[formcontrolname="title"]')?.value).toBe(
      'Ship the board',
    );
  });
});
