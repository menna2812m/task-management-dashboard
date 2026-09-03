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

  it('keeps stats independent of the active filters', async () => {
    await loadTasks([todoTask, inProgressTask, doneToday]);

    store.setStatusFilter('done');

    expect(store.stats().total).toBe(3);
  });
});
