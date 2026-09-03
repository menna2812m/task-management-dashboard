import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { STATISTIC_FIXTURES } from '../../testing/statistic.fixtures';
import { environment } from '../../../../../environments/environment';
import { TaskStore } from '../../../tasks/data-access/task-store';
import { createActivity } from '../../../tasks/testing/activity.fixtures';
import {
  createTask,
  isoDateFromToday,
  isoTimestampFromToday,
} from '../../../tasks/testing/task.fixtures';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let element: HTMLElement;

  /**
   * The page owns two resources (tasks, statistics); a spec may leave one pending, so wait
   * for a macrotask and run change detection instead of relying on app stability.
   */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  const tasks = [
    createTask({ status: 'todo', dueDate: isoDateFromToday(-1) }),
    createTask({ status: 'todo' }),
    createTask({ status: 'in_progress' }),
    createTask({ status: 'done', completedAt: isoTimestampFromToday(0) }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/tasks`).flush(tasks);
    await settle();
  });

  const statisticsUrl = `${environment.apiUrl}/statistics`;

  async function answerStatistics(respond: (request: TestRequest) => void): Promise<void> {
    respond(TestBed.inject(HttpTestingController).expectOne(statisticsUrl));
    await settle();
  }

  it('shows the trend from the statistics endpoint next to the live count', async () => {
    await answerStatistics((request) => request.flush(STATISTIC_FIXTURES));

    expect(text('[data-testid="stat-total"]')).toContain('4');
    expect(text('[data-testid="stat-total"]')).not.toContain('156');
    expect(text('[data-testid="stat-total"]')).toContain('+12 this week');
    expect(text('[data-testid="stat-overdue"]')).toContain('+3 today');
  });

  it('shows the most recent activity beside the board', async () => {
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/activities`)
      .flush([
        createActivity({
          type: 'completed',
          taskTitle: 'Fix login',
          timestamp: new Date().toISOString(),
        }),
      ]);
    await settle();

    const feed = element.querySelector('[data-testid="activity-feed"]');
    expect(feed?.textContent).toContain('Recent activity');
    expect(feed?.textContent).toContain('John Doe completed "Fix login"');
  });

  it('charts the task distribution by status and by priority', () => {
    const charts = Array.from(element.querySelectorAll('app-distribution-chart'));
    const breakdown = (chart: Element) =>
      Array.from(chart.querySelectorAll('li')).map((item) =>
        item.textContent?.replace(/\s+/g, ' ').trim(),
      );

    expect(charts.length).toBe(2);
    expect(charts[0].textContent).toContain('Tasks by status');
    expect(breakdown(charts[0])).toEqual(['To do 2', 'In progress 1', 'Done 1']);
    expect(charts[1].textContent).toContain('Tasks by priority');
    expect(breakdown(charts[1])).toEqual(['High 0', 'Medium 4', 'Low 0']);
  });

  it('still renders the four cards when the statistics endpoint fails', async () => {
    await answerStatistics((request) =>
      request.flush('down', { status: 500, statusText: 'Server Error' }),
    );

    expect(element.querySelectorAll('app-stat-card').length).toBe(4);
    expect(text('[data-testid="stat-overdue"]')).toContain('Overdue');
    expect(text('[data-testid="stat-overdue"]')).toContain('1');
  });

  function text(selector: string): string {
    return element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  it('shows summary stats', () => {
    expect(text('[data-testid="stat-total"]')).toContain('4');
    expect(text('[data-testid="stat-completed"]')).toContain('1');
    expect(text('[data-testid="stat-in-progress"]')).toContain('1');
    expect(text('[data-testid="stat-overdue"]')).toContain('1');
  });

  it('renders one column per status with a count', () => {
    const columns = element.querySelectorAll('[data-testid="board-column"]');

    expect(columns.length).toBe(3);
    expect(text('[data-column="todo"] [data-testid="column-count"]')).toBe('2');
    expect(text('[data-column="in_progress"] [data-testid="column-count"]')).toBe('1');
    expect(text('[data-column="done"] [data-testid="column-count"]')).toBe('1');
  });

  it('places each task card in its status column', () => {
    expect(element.querySelectorAll('[data-column="todo"] app-task-card').length).toBe(2);
    expect(element.querySelectorAll('[data-column="done"] app-task-card').length).toBe(1);
  });

  it('asks for confirmation when a card requests deletion', async () => {
    const card = element.querySelector('[data-column="in_progress"] app-task-card')!;
    card.querySelector<HTMLButtonElement>('button[aria-label="Task actions"]')!.click();
    await settle();

    const deleteItem = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
      (item) => item.textContent?.includes('Delete task'),
    );
    deleteItem!.click();
    await settle();

    const dialog = document.querySelector('mat-dialog-container');
    expect(dialog?.textContent).toContain('Delete task?');
    expect(dialog?.textContent).toContain(tasks[2].title);

    TestBed.inject(MatDialog).closeAll();
    await settle();
  });

  it('filters the board by status when a tab is selected', async () => {
    const doneTab = Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (tab) => tab.textContent?.trim() === 'Done',
    );

    doneTab?.click();
    await settle();

    expect(TestBed.inject(TaskStore).statusFilter()).toBe('done');
    expect(doneTab?.getAttribute('aria-selected')).toBe('true');
    expect(element.querySelectorAll('[data-column="todo"] app-task-card').length).toBe(0);
  });
});
