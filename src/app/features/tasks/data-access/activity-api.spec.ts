import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CURRENT_USER } from '../../../core/auth/current-user';
import { NewActivity } from '../models/activity.models';
import { createActivity } from '../testing/activity.fixtures';
import { ActivityApi } from './activity-api';

describe('ActivityApi', () => {
  let api: ActivityApi;
  let httpTesting: HttpTestingController;
  const activitiesUrl = `${environment.apiUrl}/activities`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ActivityApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('exposes the most recent activities first, capped to ten', async () => {
    const entries = Array.from({ length: 12 }, (_, index) =>
      createActivity({
        id: `activity-${index}`,
        timestamp: new Date(2026, 8, 1, 12, index).toISOString(),
      }),
    );

    TestBed.tick();
    httpTesting.expectOne(activitiesUrl).flush(entries);
    await TestBed.inject(ApplicationRef).whenStable();

    const recent = api.recent();
    expect(recent.length).toBe(10);
    expect(recent[0].id).toBe('activity-11');
    expect(recent[9].id).toBe('activity-2');
  });

  it('records an activity with a POST and shows it first without refetching', async () => {
    const older = createActivity({ id: 'older', timestamp: new Date(2026, 0, 1).toISOString() });
    TestBed.tick();
    httpTesting.expectOne(activitiesUrl).flush([older]);
    await TestBed.inject(ApplicationRef).whenStable();

    const entry: NewActivity = {
      type: 'created',
      taskId: 'task-1',
      taskTitle: 'Ship it',
      actor: CURRENT_USER,
      timestamp: new Date().toISOString(),
    };
    const pending = api.record(entry);

    const request = httpTesting.expectOne({ method: 'POST', url: activitiesUrl });
    expect(request.request.body).toEqual(entry);
    request.flush({ ...entry, id: 'activity-new' });
    await pending;

    expect(api.recent().map((activity) => activity.id)).toEqual(['activity-new', 'older']);
    httpTesting.expectNone({ method: 'GET', url: activitiesUrl });
  });

  it('survives a failed record so callers can treat logging as best effort', async () => {
    TestBed.tick();
    httpTesting.expectOne(activitiesUrl).flush([]);
    await TestBed.inject(ApplicationRef).whenStable();

    const pending = api.record({
      type: 'deleted',
      taskId: 'task-1',
      taskTitle: 'Gone',
      actor: CURRENT_USER,
      timestamp: new Date().toISOString(),
    });
    httpTesting
      .expectOne({ method: 'POST', url: activitiesUrl })
      .flush('down', { status: 500, statusText: 'Error' });

    await expectAsync(pending).toBeRejected();
    expect(api.recent()).toEqual([]);
  });
});
