import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CURRENT_USER } from '../../../core/auth/current-user';
import { USER_FIXTURES } from '../../team/testing/user.fixtures';
import { NewActivity } from '../models/activity.models';
import { Assignee, Task } from '../models/task.models';
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

  const activitiesUrl = `${environment.apiUrl}/activities`;

  /** Answers the task list and, unless told otherwise, empty users and activities lists. */
  async function loadTasks(tasks: Task[], users: Assignee[] = []): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush(tasks);
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush(users);
    httpTesting.expectOne(activitiesUrl).flush([]);
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /** The activity entry a mutation records once it has succeeded. */
  function expectActivity(): TestRequest {
    return httpTesting.expectOne({ method: 'POST', url: activitiesUrl });
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
    // Activity logging is best effort and not the subject of most specs; answer any pending
    // entries so `verify` only reports requests a spec forgot about.
    httpTesting
      .match((request) => request.url === activitiesUrl)
      .forEach((request) => request.flush({}));
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

  describe('assignees', () => {
    it('lists every user from the users endpoint, including those without tasks', async () => {
      await loadTasks([todoTask], USER_FIXTURES);

      expect(store.assignees().map((user) => user.name)).toEqual([
        'John Doe',
        'Sarah Smith',
        'Mike Johnson',
        'Emily Davis',
      ]);
    });

    it('falls back to the assignees found on tasks while users are unavailable', async () => {
      await loadTasks([todoTask], []);

      expect(store.assignees()).toEqual([todoTask.assignee]);
    });

    it('can assign a task to a user who has no tasks yet', async () => {
      await loadTasks([todoTask], USER_FIXTURES);
      const emily = USER_FIXTURES[3];

      const pending = store.createTask({
        title: 'Onboarding',
        description: 'Welcome pack',
        titleAr: 'تهيئة الموظف',
        descriptionAr: 'حزمة الترحيب',
        status: 'todo',
        priority: 'low',
        dueDate: isoDateFromToday(3),
        assigneeId: emily.id,
        tags: ['Admin'],
      });

      const request = httpTesting.expectOne({ method: 'POST', url: `${environment.apiUrl}/tasks` });
      expect((request.request.body as Task).assignee).toEqual(emily);
      request.flush({ ...(request.request.body as Task), id: 'task-new' });
      await pending;
      expectReload().flush([]);
    });
  });

  describe('mutations', () => {
    const tasksUrl = `${environment.apiUrl}/tasks`;
    const formValue = {
      title: 'Write release notes',
      description: 'Summarise the changes',
      titleAr: 'كتابة ملاحظات الإصدار',
      descriptionAr: 'تلخيص التغييرات',
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

    it('moves a task by updating only its status through the normal update flow', async () => {
      await loadTasks([todoTask]);

      const pending = store.moveTask(todoTask, 'done');

      const request = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/${todoTask.id}` });
      const body = request.request.body as Task;
      expect(body.status).toBe('done');
      expect(body.completedAt).toBeTruthy();
      expect(body.title).toBe(todoTask.title);
      request.flush(body);

      await pending;
      expectReload().flush([body]);
    });

    it('does not send a request when a task is dropped back into its current column', async () => {
      await loadTasks([todoTask]);

      await expectAsync(store.moveTask(todoTask, 'todo')).toBeResolvedTo(todoTask);

      httpTesting.expectNone({ method: 'PUT', url: `${tasksUrl}/${todoTask.id}` });
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

      const pending = store.deleteTask(todoTask);

      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});

      await pending;
      expectReload().flush([]);
    });

    it('tracks the saving state while a mutation is in flight', async () => {
      await loadTasks([todoTask]);
      expect(store.isSaving()).toBeFalse();

      const pending = store.deleteTask(todoTask);
      expect(store.isSaving()).toBeTrue();

      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});
      await pending;

      expect(store.isSaving()).toBeFalse();
      expectReload().flush([]);
    });

    it('resets the saving state and rethrows when the API fails', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask);
      httpTesting
        .expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` })
        .flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(pending).toBeRejected();
      expect(store.isSaving()).toBeFalse();
      httpTesting.expectNone({ method: 'GET', url: tasksUrl });
    });
  });

  describe('activity log', () => {
    const tasksUrl = `${environment.apiUrl}/tasks`;
    const formValue = {
      title: 'Write release notes',
      description: 'Summarise the changes',
      titleAr: 'كتابة ملاحظات الإصدار',
      descriptionAr: 'تلخيص التغييرات',
      status: 'todo' as const,
      priority: 'high' as const,
      dueDate: isoDateFromToday(4),
      assigneeId: 'user-001',
      tags: ['Docs'],
    };

    it('records a "created" entry attributed to the current user', async () => {
      await loadTasks([todoTask]);

      const pending = store.createTask(formValue);
      const create = httpTesting.expectOne({ method: 'POST', url: tasksUrl });
      create.flush({ ...(create.request.body as Task), id: 'task-new' });
      await pending;

      const body = expectActivity().request.body as NewActivity;
      expect(body.type).toBe('created');
      expect(body.taskId).toBe('task-new');
      expect(body.taskTitle).toBe('Write release notes');
      expect(body.actor).toEqual(CURRENT_USER);
      expect(body.timestamp).toBeTruthy();
      expectReload().flush([]);
    });

    it('records "completed" when an edit moves a task to done', async () => {
      await loadTasks([todoTask]);

      const pending = store.updateTask(todoTask, { ...formValue, status: 'done' });
      const update = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/${todoTask.id}` });
      update.flush(update.request.body);
      await pending;

      expect((expectActivity().request.body as NewActivity).type).toBe('completed');
      expectReload().flush([]);
    });

    it('records "updated" for any other edit', async () => {
      await loadTasks([todoTask]);

      const pending = store.updateTask(todoTask, { ...formValue, status: 'todo' });
      const update = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/${todoTask.id}` });
      update.flush(update.request.body);
      await pending;

      expect((expectActivity().request.body as NewActivity).type).toBe('updated');
      expectReload().flush([]);
    });

    it('records "deleted" with the title of the removed task', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask);
      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});
      await pending;

      const body = expectActivity().request.body as NewActivity;
      expect(body.type).toBe('deleted');
      expect(body.taskTitle).toBe(todoTask.title);
      expectReload().flush([]);
    });

    it('does not fail the mutation when logging fails', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask);
      httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` }).flush({});

      await expectAsync(pending).toBeResolved();
      expectActivity().flush('down', { status: 500, statusText: 'Error' });
      await new Promise((resolve) => setTimeout(resolve));
      expectReload().flush([]);
    });

    it('does not record anything when the mutation itself fails', async () => {
      await loadTasks([todoTask]);

      const pending = store.deleteTask(todoTask);
      httpTesting
        .expectOne({ method: 'DELETE', url: `${tasksUrl}/${todoTask.id}` })
        .flush('down', { status: 500, statusText: 'Error' });

      await expectAsync(pending).toBeRejected();
      httpTesting.expectNone({ method: 'POST', url: activitiesUrl });
    });
  });

  it('keeps stats independent of the active filters', async () => {
    await loadTasks([todoTask, inProgressTask, doneToday]);

    store.setStatusFilter('done');

    expect(store.stats().total).toBe(3);
  });
});
