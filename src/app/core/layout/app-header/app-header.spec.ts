import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { User } from '../../models/user.models';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  let fixture: ComponentFixture<AppHeader>;
  const user: User = {
    id: 'user-1',
    name: 'John Doe',
    avatar: 'JD',
    email: 'john@example.com',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('currentUser', user);
    fixture.detectChanges();
  });

  it('emits search text from the input', () => {
    let value = '';
    fixture.componentInstance.searchChange.subscribe((search) => (value = search));
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'budget';
    input.dispatchEvent(new Event('input'));

    expect(value).toBe('budget');
  });

  it('emits the opposite language', () => {
    let language = '';
    fixture.componentInstance.languageChange.subscribe((value) => (language = value));

    (fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement).click();

    expect(language).toBe('ar');
  });

  it('provides a descriptive label for the current user', () => {
    const avatar = fixture.nativeElement.querySelector('[role="img"]') as HTMLElement;

    expect(avatar.getAttribute('aria-label')).toBe('Signed in as John Doe');
  });
});
