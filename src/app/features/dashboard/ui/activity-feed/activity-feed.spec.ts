import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Activity } from '../../../tasks/models/activity.models';
import { createActivity } from '../../../tasks/testing/activity.fixtures';
import { ActivityFeed } from './activity-feed';

describe('ActivityFeed', () => {
  let fixture: ComponentFixture<ActivityFeed>;

  async function render(activities: Activity[], loading = false): Promise<HTMLElement> {
    fixture = TestBed.createComponent(ActivityFeed);
    fixture.componentRef.setInput('activities', activities);
    fixture.componentRef.setInput('loading', loading);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  const text = (node: Element | null) => node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeed],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('describes each change with actor, verb and task title', async () => {
    const element = await render([
      createActivity({ type: 'created', taskTitle: 'Write docs' }),
      createActivity({ type: 'completed', taskTitle: 'Fix login' }),
      createActivity({ type: 'deleted', taskTitle: 'Old task' }),
      createActivity({ type: 'updated', taskTitle: 'Refactor' }),
    ]);
    const items = Array.from(element.querySelectorAll('li'));

    expect(items.length).toBe(4);
    expect(text(items[0])).toContain('John Doe created "Write docs"');
    expect(text(items[1])).toContain('John Doe completed "Fix login"');
    expect(text(items[2])).toContain('John Doe deleted "Old task"');
    expect(text(items[3])).toContain('John Doe updated "Refactor"');
  });

  it('keeps activity entries in a labelled scrollable region', async () => {
    const element = await render([createActivity()]);
    const list = element.querySelector<HTMLOListElement>('[data-testid="activity-list"]')!;

    expect(list.getAttribute('aria-label')).toBe('Recent activity entries');
    expect(list.getAttribute('tabindex')).toBe('0');
    expect(list.classList).toContain('overflow-y-auto');
  });

  it('shows when each change happened', async () => {
    const element = await render([
      createActivity({ timestamp: new Date(Date.now() - 5 * 60_000).toISOString() }),
    ]);

    expect(text(element.querySelector('time'))).toBe('5 min ago');
  });

  it('shows an inviting empty state', async () => {
    const element = await render([]);

    expect(element.querySelector('li')).toBeNull();
    expect(element.textContent).toContain('No activity yet');
  });

  it('shows a loading state instead of the empty state while loading', async () => {
    const element = await render([], true);

    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.textContent).not.toContain('No activity yet');
  });
});
