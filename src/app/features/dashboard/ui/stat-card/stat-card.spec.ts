import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistic } from '../../models/statistic.models';
import { STATISTIC_FIXTURES } from '../../testing/statistic.fixtures';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  let fixture: ComponentFixture<StatCard>;

  async function render(statistic: Statistic, value?: number): Promise<HTMLElement> {
    fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('statistic', statistic);
    if (value !== undefined) {
      fixture.componentRef.setInput('value', value);
    }
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  const text = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCard],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('shows the title, the live value and the trend from the statistic', async () => {
    const element = await render(STATISTIC_FIXTURES[0], 17);

    expect(text(element.querySelector('[data-testid="stat-title"]'))).toBe('Total Tasks');
    expect(text(element.querySelector('[data-testid="stat-value"]'))).toBe('17');
    expect(text(element.querySelector('[data-testid="stat-change"]'))).toBe('+12 this week');
  });

  it('falls back to the snapshot value when no live value is given', async () => {
    const element = await render(STATISTIC_FIXTURES[1]);

    expect(text(element.querySelector('[data-testid="stat-value"]'))).toBe('89');
  });

  it('shows only the label for a neutral change and marks the trend type', async () => {
    const element = await render(STATISTIC_FIXTURES[2], 5);
    const change = element.querySelector('[data-testid="stat-change"]');

    expect(text(change)).toBe('Same as yesterday');
    expect(change?.getAttribute('data-change')).toBe('neutral');
  });

  it('marks negative trends so they can be coloured', async () => {
    const element = await render(STATISTIC_FIXTURES[3], 3);

    expect(element.querySelector('[data-testid="stat-change"]')?.getAttribute('data-change')).toBe(
      'negative',
    );
  });

  it('renders the emoji icon from the statistic', async () => {
    const element = await render(STATISTIC_FIXTURES[1], 1);

    expect(element.querySelector('.emoji')?.textContent?.trim()).toBe('✅');
  });

  it('uses the vector warning glyph instead of the emoji for the overdue card', async () => {
    const element = await render(STATISTIC_FIXTURES[3], 3);

    expect(element.querySelector('.emoji')).toBeNull();
    expect(element.querySelector('app-icon svg')).not.toBeNull();
  });
});
