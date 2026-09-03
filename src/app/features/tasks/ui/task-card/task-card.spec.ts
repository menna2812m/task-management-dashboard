import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../models/task.models';
import { createTask, isoDateFromToday, isoTimestampFromToday } from '../../testing/task.fixtures';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  let fixture: ComponentFixture<TaskCard>;

  async function render(task: Task): Promise<HTMLElement> {
    fixture = TestBed.createComponent(TaskCard);
    fixture.componentRef.setInput('task', task);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders the priority, title, description and tag', async () => {
    const element = await render(
      createTask({
        priority: 'high',
        title: 'Prepare Q4 budget report',
        description: 'Compile financial data',
        tags: ['Finance'],
      }),
    );

    expect(element.textContent).toContain('High');
    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Prepare Q4 budget report');
    expect(element.textContent).toContain('Compile financial data');
    expect(element.textContent).toContain('Finance');
  });

  it('shows the assignee as an @handle built from the first name', async () => {
    const element = await render(
      createTask({
        assignee: { id: 'u1', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' },
      }),
    );

    expect(element.textContent).toContain('@Sarah');
    expect(element.textContent).not.toContain('sarah@company.com');
  });

  it('marks an overdue task and shows how late it is', async () => {
    const element = await render(createTask({ dueDate: isoDateFromToday(-3) }));

    expect(element.querySelector('article')?.getAttribute('data-due')).toBe('overdue');
    expect(element.textContent).toContain('Overdue by 3 days');
    expect(element.querySelector('p app-icon svg path')).not.toBeNull();
  });

  it('shows the completion label for done tasks', async () => {
    const element = await render(
      createTask({ status: 'done', completedAt: isoTimestampFromToday(0) }),
    );

    expect(element.querySelector('article')?.getAttribute('data-due')).toBe('completed');
    expect(element.textContent).toContain('Completed today');
  });

  it('emits edit when the edit action is chosen from the card menu', async () => {
    const task = createTask();
    const element = await render(task);
    const edited: Task[] = [];
    fixture.componentInstance.edit.subscribe((value) => edited.push(value));

    element.querySelector<HTMLButtonElement>('button[aria-label="Task actions"]')!.click();
    await fixture.whenStable();

    const editItem = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
      (item) => item.textContent?.includes('Edit task'),
    );
    editItem!.click();
    await fixture.whenStable();

    expect(edited).toEqual([task]);
  });

  it('shows the status only when asked to', async () => {
    const element = await render(createTask({ status: 'in_progress' }));
    expect(element.textContent).not.toContain('In progress');

    fixture.componentRef.setInput('showStatus', true);
    await fixture.whenStable();
    expect(element.textContent).toContain('In progress');
  });

  it('shows the due label for upcoming tasks', async () => {
    const element = await render(createTask({ dueDate: isoDateFromToday(2) }));

    expect(element.querySelector('article')?.getAttribute('data-due')).toBe('upcoming');
    expect(element.textContent).toContain('Due in 2 days');
  });
});
