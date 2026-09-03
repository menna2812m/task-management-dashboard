import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TaskStore } from '../../../features/tasks/data-access/task-store';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('links to the dashboard and tasks routes from the sidebar', () => {
    const hrefs = Array.from(element.querySelectorAll('nav a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/tasks');
  });

  it('lists sections that are not built yet as disabled', () => {
    const disabled = Array.from(
      element.querySelectorAll('nav [aria-disabled="true"] .nav-link__label'),
    ).map((item) => item.textContent?.trim());

    expect(disabled).toEqual(['Calendar', 'Analytics', 'Team', 'Settings']);
  });

  it('renders the exported logo and notification glyphs as decorative images', () => {
    const logo = element.querySelector<HTMLImageElement>('img[src$="clipboard.png"]');
    const bell = element.querySelector<HTMLImageElement>('img[src$="bell.png"]');

    expect(logo?.getAttribute('alt')).toBe('');
    expect(bell?.getAttribute('alt')).toBe('');
  });

  it('feeds the header search into the task store', async () => {
    const search = element.querySelector<HTMLInputElement>('input[type="search"]');

    expect(search).not.toBeNull();
    search!.value = 'budget';
    search!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(TestBed.inject(TaskStore).searchTerm()).toBe('budget');
  });
});
