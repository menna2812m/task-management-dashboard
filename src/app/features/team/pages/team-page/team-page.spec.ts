import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { createTask } from '../../../tasks/testing/task.fixtures';
import { USER_FIXTURES } from '../../testing/user.fixtures';
import { TeamPage } from './team-page';

describe('TeamPage', () => {
  let fixture: ComponentFixture<TeamPage>;
  let element: HTMLElement;
  let httpTesting: HttpTestingController;

  const [john, sarah] = USER_FIXTURES;
  const tasks = [
    createTask({ assignee: john, status: 'todo' }),
    createTask({ assignee: john, status: 'in_progress' }),
    createTask({ assignee: john, status: 'done' }),
    createTask({ assignee: sarah, status: 'done' }),
  ];

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  function rows(): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('[data-testid="team-member"]'));
  }

  function text(node: Element | null | undefined): string {
    return node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamPage);
    element = fixture.nativeElement as HTMLElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('lists every user with name, email and avatar initials', async () => {
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush(USER_FIXTURES);
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush(tasks);
    await settle();

    expect(rows().length).toBe(4);
    expect(text(rows()[3])).toContain('Emily Davis');
    expect(text(rows()[3])).toContain('emily.davis@company.com');
    expect(text(rows()[3].querySelector('[data-testid="avatar"]'))).toBe('ED');
  });

  it('shows open and completed task counts per user', async () => {
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush(USER_FIXTURES);
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush(tasks);
    await settle();

    expect(text(rows()[0].querySelector('[data-testid="open-count"]'))).toBe('2');
    expect(text(rows()[0].querySelector('[data-testid="done-count"]'))).toBe('1');
    expect(text(rows()[1].querySelector('[data-testid="open-count"]'))).toBe('0');
    expect(text(rows()[3].querySelector('[data-testid="open-count"]'))).toBe('0');
  });

  it('shows a loading state until users arrive', () => {
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush([]);
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush([]);
  });

  it('shows an error with a retry action when users cannot be loaded', async () => {
    httpTesting
      .expectOne(`${environment.apiUrl}/users`)
      .flush('down', { status: 500, statusText: 'Server Error' });
    httpTesting.expectOne(`${environment.apiUrl}/tasks`).flush([]);
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');

    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await settle();
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush(USER_FIXTURES);
    await settle();

    expect(rows().length).toBe(4);
  });
});
