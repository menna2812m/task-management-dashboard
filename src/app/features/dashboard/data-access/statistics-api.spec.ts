import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { STATISTIC_FIXTURES } from '../testing/statistic.fixtures';
import { StatisticsApi } from './statistics-api';

describe('StatisticsApi', () => {
  let api: StatisticsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(StatisticsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the statistics collection', async () => {
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/statistics`).flush(STATISTIC_FIXTURES);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(api.statistics.value().map((statistic) => statistic.title)).toEqual([
      'Total Tasks',
      'Completed',
      'In Progress',
      'Overdue',
    ]);
  });

  it('starts empty rather than undefined so consumers can iterate immediately', () => {
    expect(api.statistics.value()).toEqual([]);
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/statistics`).flush([]);
  });
});
