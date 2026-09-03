import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { Task } from '../models/task.models';
import { createTask, isoDateFromToday, isoTimestampFromToday } from '../testing/task.fixtures';
import { TaskStore } from './task-store';

describe('TaskStore', () => {
  let store: TaskStore;
  let httpTesting: HttpTestingController;

  const todoTask = createTask({ id: 'todo-1', status: 'todo', dueDate: isoDateFromToday(2) });
  const overdueTodo = createTask({ id: 'todo-2', status: 'todo', dueDate: isoDateFromToday(-2) });
  const inProgressTask = createTask({ id: 'progress-1', status: 'in_progress' });
  const doneToday = createTask({
    id: 'done-1',
    status: 'done',
    completedAt: isoTimestampFromToday(0),
  });
  const doneEarlier = createTask({
    id: 'done-2',
    status: 'done',
    completedAt: isoTimestampFromToday(-3),
  });

  async function loadTasks(tasks: Task[]): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush(tasks);
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /** The resource re-fetches inside an effect, so flush effects before expecting the GET. */
  function expectReload() {
    TestBed.tick();

    return httpTesting.expectOne({ method: 'GET', url: `${environment.apiUrl}/tasks` });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(TaskStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('groups tasks into a column per status', async () => {
    await loadTasks([todoTask, overdueTodo, inProgressTask, doneToday, doneEarlier]);

    const columns = store.tasksByStatus();

    expect(columns.todo.map((task) => task.id)).toEqual(['todo-1', 'todo-2']);
    expect(columns.in_progress.map((task) => task.id)).toEqual(['progress-1']);
    expect(columns.done.map((task) => task.id)).toEqual(['done-1', 'done-2']);
  });

  it('always exposes every column, even when empty', async () => {
    await loadTasks([todoTask]);

    expect(store.tasksByStatus().in_progress).toEqual([]);
    expect(store.tasksByStatus().done).toEqual([]);
  });

  it('applies the active filters to the grouped columns', async () => {
    await loadTasks([todoTask, overdueTodo, inProgressTask, doneToday]);

    store.setStatusFilter('todo');

    expect(store.tasksByStatus().todo.length).toBe(2);
    expect(store.tasksByStatus().in_progress).toEqual([]);
    expect(store.tasksByStatus().done).toEqual([]);
  });

  it('computes summary stats over all tasks', async () => {
    await loadTasks([todoTask, overdueTodo, inProgressTask, doneToday, doneEarlier]);

    expect(store.stats()).toEqual({
      total: 5,
      completed: 2,
      completedToday: 1,
      inProgress: 1,
      overdue: 1,
    });
  });

  describe('mutations', () => {
    const tasksUrl = `${environment.apiUrl}/tasks`;
    const formValue = {
      title: 'Write release notes',
      description: 'Summarise the changes',
      status: 'todo' as const,
      priority: 'high' as const,
      dueDate: isoDateFromToday(4),
      assigneeId: 'user-001',
      tags: ['Docs'],
    };

    it('creates a task with the resolved assignee and timestamps, then reloads', async () => {
      await loadTasks([todoTask]);

      const pending = store.createTask(formValue);

      const request = httpTesting.expectOne({ method: 'POST', url: tasksUrl });
      const body = request.request.body as Task;
      expect(body.title).toBe('Write release notes');
      expect(body.assignee).toEqual(todoTask.assignee);
      expect(body.completedAt).toBeUndefined();
      expect(body.createdAt).toBeTruthy();
      expect(body.updatedAt).toBe(body.createdAt);
      expect(body.id).toBeUndefined();
      request.flush({ ...body, id: 'task-new' });

      await pending;
      expectReload().flush([todoTask]);
    });

    it('stamps completedAt when a task is created as done', async () => {
      await loadTasks([todoTask]);

      const pending = store.createTask({ ...formValue, status: 'done' });

      const request = httpTesting.expectOne({ method: 'POST', url: tasksUrl });
      expect((request.request.body as Task).completedAt).toBeTruthy();
      request.flush({ ...(request.request.body as Task), id: 'task-new' });

      await pending;
      expectReload().flush([]);
    });

    it('rejects an unknown assignee without calling the API', async () => {
      await loadTasks([todoTask]);

      await expectAsync(
        store.createTask({ ...formValue, assigneeId: 'nobody' }),
      ).toBeRejectedWithError(/assignee/i);

      httpTesting.expectNone({ method: 'POST', url: tasksUrl });
    });

    it('updates a task in place, keeping its id and createdAt', async () => {
      await loadTasks([todoTask]);

      const pending = store.updateTask(todoTask, { ...formValue, status: 'done' });

      const request = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/${todoTask.id}` });
      const body = request.request.body as Task;
      expect(body.id).toBe(todoTask.id);
      expect(body.createdAt).toBe(todoTask.createdAt);
      expect(body.status).toBe('done');
      expect(body.completedAt).toBeTruthy();
      request.flush(body);

      await pending;
      expectReload().flush([body]);
    });

    it('clears completedAt when a done task is reopened', async () => {
      await loadTasks([doneToday]);

      const pending = store.updateTask(doneToday, { ...formValue, status: 'in_progress' });

      const request = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/${doneToday.id}` });
      expect((request.request.body as Task).completedAt).toBeUndefined();
      request.flush(request.request.body);

      await pending;
      expectReload().flush([]);
    });

    it('deletes a task and reloads', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask.id);

      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});

      await pending;
      expectReload().flush([]);
    });

    it('tracks the saving state while a mutation is in flight', async () => {
      await loadTasks([todoTask]);
      expect(store.isSaving()).toBeFalse();

      const pending = store.deleteTask(todoTask.id);
      expect(store.isSaving()).toBeTrue();

      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});
      await pending;

      expect(store.isSaving()).toBeFalse();
      expectReload().flush([]);
    });

    it('resets the saving state and rethrows when the API fails', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask.id);
      httpTesting
        .expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` })
        .flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(pending).toBeRejected();
      expect(store.isSaving()).toBeFalse();
      httpTesting.expectNone({ method: 'GET', url: tasksUrl });
    });
  });

  it('keeps stats independent of the active filters', async () => {
    await loadTasks([todoTask, inProgressTask, doneToday]);

    store.setStatusFilter('done');

    expect(store.stats().total).toBe(3);
  });
});
