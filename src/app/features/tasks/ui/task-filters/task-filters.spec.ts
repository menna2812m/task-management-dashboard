import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskFilters } from './task-filters';

describe('TaskFilters', () => {
  let component: TaskFilters;
  let fixture: ComponentFixture<TaskFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFilters],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFilters);
    fixture.componentRef.setInput('assignees', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
