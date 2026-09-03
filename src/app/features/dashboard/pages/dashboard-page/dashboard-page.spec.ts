import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../environments/environment';
import { TaskStore } from '../../../tasks/data-access/task-store';
import {
  createTask,
  isoDateFromToday,
  isoTimestampFromToday,
} from '../../../tasks/testing/task.fixtures';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let element: HTMLElement;

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
    await TestBed.inject(ApplicationRef).whenStable();
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
    await fixture.whenStable();

    const deleteItem = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
      (item) => item.textContent?.includes('Delete task'),
    );
    deleteItem!.click();
    await fixture.whenStable();

    const dialog = document.querySelector('mat-dialog-container');
    expect(dialog?.textContent).toContain('Delete task?');
    expect(dialog?.textContent).toContain(tasks[2].title);

    TestBed.inject(MatDialog).closeAll();
    await fixture.whenStable();
  });

  it('filters the board by status when a tab is selected', async () => {
    const doneTab = Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (tab) => tab.textContent?.trim() === 'Done',
    );

    doneTab?.click();
    await fixture.whenStable();

    expect(TestBed.inject(TaskStore).statusFilter()).toBe('done');
    expect(doneTab?.getAttribute('aria-selected')).toBe('true');
    expect(element.querySelectorAll('[data-column="todo"] app-task-card').length).toBe(0);
  });
});
