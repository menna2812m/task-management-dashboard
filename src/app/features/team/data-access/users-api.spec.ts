import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { USER_FIXTURES } from '../testing/user.fixtures';
import { UsersApi } from './users-api';

describe('UsersApi', () => {
  let api: UsersApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(UsersApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the users collection', async () => {
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush(USER_FIXTURES);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(api.users.value().map((user) => user.name)).toEqual([
      'John Doe',
      'Sarah Smith',
      'Mike Johnson',
      'Emily Davis',
    ]);
  });

  it('starts as an empty list', () => {
    expect(api.users.value()).toEqual([]);
    TestBed.tick();
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush([]);
  });
});
