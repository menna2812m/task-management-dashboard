import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders the path for a known icon and hides it from assistive tech', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'search');
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('renders filled icons with their own viewBox and no stroke', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'warning');
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 20');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.getAttribute('stroke')).toBe('none');
  });

  it('renders stroke icons with the default viewBox', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'plus');
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('sizes the host from the size input', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'plus');
    fixture.componentRef.setInput('size', 14);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).style.width).toBe('14px');
  });
});
