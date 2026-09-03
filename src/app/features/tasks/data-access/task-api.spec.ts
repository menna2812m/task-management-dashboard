import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpCacheService } from '../../../core/http/http-cache.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { Task } from '../models/task.models';
import { createTask } from '../testing/task.fixtures';

import { TaskApi } from './task-api';

describe('TaskApi', () => {
  let service: TaskApi;
  let httpTesting: HttpTestingController;
  const tasksUrl = `${environment.apiUrl}/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TaskApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // The list resource issues a GET on creation; ignore it here.
    httpTesting.match(tasksUrl);
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('drops the cached task list before reloading, so a manual refresh hits the backend', () => {
    const cache = TestBed.inject(HttpCacheService);
    cache.set(tasksUrl, new HttpResponse({ body: [], status: 200 }));

    service.refresh();

    expect(cache.get(tasksUrl)).toBeUndefined();
  });

  it('creates a task with a POST and returns the saved task', async () => {
    const { id, ...draft } = createTask({ title: 'New task' });
    const saved: Task = { ...draft, id };
    const result = service.create(draft);

    const request = httpTesting.expectOne({ method: 'POST', url: tasksUrl });
    expect(request.request.body).toEqual(draft);
    request.flush(saved);

    await expectAsync(result).toBeResolvedTo(saved);
  });

  it('updates a task with a PUT to its own URL', async () => {
    const task = createTask({ id: 'task-7', title: 'Renamed' });
    const result = service.update(task);

    const request = httpTesting.expectOne({ method: 'PUT', url: `${tasksUrl}/task-7` });
    expect(request.request.body).toEqual(task);
    request.flush(task);

    await expectAsync(result).toBeResolvedTo(task);
  });

  it('removes a task with a DELETE to its own URL', async () => {
    const result = service.remove('task-9');

    httpTesting.expectOne({ method: 'DELETE', url: `${tasksUrl}/task-9` }).flush({});

    await expectAsync(result).toBeResolved();
  });
});
