import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Task, TaskFormValue } from '../../models/task.models';
import { createTask, isoDateFromToday } from '../../testing/task.fixtures';
import { TaskDialogService } from './task-dialog.service';

describe('TaskDialogService', () => {
  let service: TaskDialogService;
  let httpTesting: HttpTestingController;
  const tasksUrl = `${environment.apiUrl}/tasks`;

  const existing = createTask({ id: 'task-1', title: 'Ship the board' });
  const formValue: TaskFormValue = {
    title: 'Ship the board',
    description: 'Finish the kanban view',
    status: 'in_progress',
    priority: 'high',
    dueDate: isoDateFromToday(2),
    assigneeId: existing.assignee.id,
    tags: ['Frontend'],
  };

  async function loadTasks(tasks: Task[]): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne({ method: 'GET', url: tasksUrl }).flush(tasks);
    httpTesting.expectOne({ method: 'GET', url: `${environment.apiUrl}/users` }).flush([]);
    await settle();
  }

  /** Activity logging is incidental here; answer whatever the store has sent so far. */
  function flushActivities(): void {
    httpTesting
      .match((request) => request.url === `${environment.apiUrl}/activities`)
      .forEach((request) => request.flush(request.request.method === 'GET' ? [] : {}));
  }

  /**
   * Dialogs report `afterClosed` only once their exit animation ends, which the app's
   * stability signal does not cover. Wait for Material to see no open dialogs, then settle.
   */
  async function settle(): Promise<void> {
    flushActivities();
    await firstValueFrom(TestBed.inject(MatDialog).afterAllClosed);
    flushActivities();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /**
   * After a mutation succeeds the store reloads the list. Let the promise chain run, flush
   * the resource effect so the GET is issued, answer it, then settle.
   */
  async function flushReload(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    httpTesting.expectOne({ method: 'GET', url: tasksUrl }).flush([]);
    await settle();
  }

  function dialogText(): string {
    return document.querySelector('mat-dialog-container')?.textContent ?? '';
  }

  function snackbarText(): string {
    return document.querySelector('.mat-mdc-snack-bar-label')?.textContent?.trim() ?? '';
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TaskDialogService);
    httpTesting = TestBed.inject(HttpTestingController);
    await loadTasks([existing]);
  });

  afterEach(() => {
    service.closeAll();
    TestBed.tick();
  });

  it('opens the form in create mode when no task is given', async () => {
    await service.openCreate();
    TestBed.tick();

    expect(dialogText()).toContain('Create task');
  });

  it('opens the form in edit mode for an existing task', async () => {
    await service.openEdit(existing);
    TestBed.tick();

    expect(dialogText()).toContain('Edit task');
    expect(document.querySelector<HTMLInputElement>('input[formcontrolname="title"]')?.value).toBe(
      'Ship the board',
    );
  });

  it('saves a new task when the create form is submitted and confirms it', async () => {
    const ref = await service.openCreate();
    TestBed.tick();

    ref.close(formValue);
    await settle();

    const request = httpTesting.expectOne({ method: 'POST', url: tasksUrl });
    request.flush({ ...request.request.body, id: 'task-new' });
    await flushReload();

    expect(snackbarText()).toBe('Task created');
  });

  it('updates the task when the edit form is submitted', async () => {
    const ref = await service.openEdit(existing);
    TestBed.tick();

    ref.close({ ...formValue, title: 'Renamed' });
    await settle();

    const request = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/task-1` });
    expect((request.request.body as Task).title).toBe('Renamed');
    request.flush(request.request.body);
    await flushReload();

    expect(snackbarText()).toBe('Task updated');
  });

  it('does nothing when the form is dismissed', async () => {
    const ref = await service.openCreate();
    TestBed.tick();

    ref.close(undefined);
    await settle();

    httpTesting.expectNone({ method: 'POST', url: tasksUrl });
    expect(snackbarText()).toBe('');
  });

  it('asks for confirmation before deleting and deletes on confirm', async () => {
    const pending = service.confirmDelete(existing);
    TestBed.tick();

    expect(dialogText()).toContain('Delete task?');
    expect(dialogText()).toContain('Ship the board');

    const confirm = Array.from(
      document.querySelectorAll<HTMLButtonElement>('mat-dialog-container button'),
    ).find((button) => button.textContent?.trim() === 'Delete');
    confirm!.click();
    await settle();

    httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/task-1` }).flush({});
    await pending;
    TestBed.tick();
    httpTesting.expectOne({ method: 'GET', url: tasksUrl }).flush([]);

    expect(snackbarText()).toBe('Task deleted');
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const pending = service.confirmDelete(existing);
    TestBed.tick();

    const cancel = Array.from(
      document.querySelectorAll<HTMLButtonElement>('mat-dialog-container button'),
    ).find((button) => button.textContent?.trim() === 'Cancel');
    cancel!.click();
    await pending;

    httpTesting.expectNone({ method: 'DELETE', url: `${tasksUrl}/task-1` });
  });

  it('reports a failed save in the snackbar', async () => {
    const ref = await service.openCreate();
    TestBed.tick();

    ref.close(formValue);
    await settle();

    httpTesting
      .expectOne({ method: 'POST', url: tasksUrl })
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await settle();
    TestBed.tick();

    expect(snackbarText()).toContain('could not be saved');
  });
});
