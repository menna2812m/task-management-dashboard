import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppSidebar, SidebarNavItem } from './app-sidebar';

describe('AppSidebar', () => {
  let fixture: ComponentFixture<AppSidebar>;
  const items: SidebarNavItem[] = [
    { labelKey: 'dashboard', emoji: '📊', route: '/dashboard' },
    { labelKey: 'settings', emoji: '⚙️' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebar],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSidebar);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  it('renders links and marks unavailable sections as disabled', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/dashboard"]')).not.toBeNull();
    expect(element.querySelector('[aria-disabled="true"]')?.textContent).toContain('Settings');
  });

  it('emits the create task action', () => {
    let emitted = false;
    fixture.componentInstance.createTask.subscribe(() => (emitted = true));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toBeTrue();
  });

  it('uses a translated navigation label', () => {
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
  });
});
