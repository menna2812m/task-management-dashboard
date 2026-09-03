import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartSlice, DistributionChart } from './distribution-chart';

describe('DistributionChart', () => {
  let fixture: ComponentFixture<DistributionChart>;

  const slices: ChartSlice[] = [
    { label: 'To do', value: 6, color: '#64B5F6' },
    { label: 'In progress', value: 5, color: '#FF6F00' },
    { label: 'Done', value: 6, color: '#388E3C' },
  ];

  async function render(title: string, data: ChartSlice[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(DistributionChart);
    fixture.componentRef.setInput('title', title);
    fixture.componentRef.setInput('slices', data);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  const text = (node: Element | null) => node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributionChart],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('shows the title and an accessible breakdown of every slice', async () => {
    const element = await render('Tasks by status', slices);
    const items = Array.from(element.querySelectorAll('li'));

    expect(text(element.querySelector('h2'))).toBe('Tasks by status');
    expect(items.map((item) => text(item))).toEqual(['To do 6', 'In progress 5', 'Done 6']);
  });

  it('draws onto a canvas that is hidden from assistive technology', async () => {
    const element = await render('Tasks by priority', slices);
    const canvas = element.querySelector('canvas');

    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows an empty state instead of a chart when there is nothing to plot', async () => {
    const element = await render(
      'Tasks by status',
      slices.map((slice) => ({ ...slice, value: 0 })),
    );

    expect(element.querySelector('canvas')).toBeNull();
    expect(element.textContent).toContain('No tasks to chart yet');
  });

  it('reports the total in the heading area', async () => {
    const element = await render('Tasks by status', slices);

    expect(text(element.querySelector('[data-testid="chart-total"]'))).toBe('17 tasks');
  });
});
