import { createTask, isoDateFromToday, isoTimestampFromToday } from '../testing/task.fixtures';
import { getDueInfo, isTaskOverdue } from './task-status.utils';

describe('isTaskOverdue', () => {
  it('is true for an open task whose due date has passed', () => {
    expect(isTaskOverdue(createTask({ dueDate: isoDateFromToday(-1) }))).toBeTrue();
  });

  it('is false for a done task even when the due date has passed', () => {
    expect(
      isTaskOverdue(createTask({ status: 'done', dueDate: isoDateFromToday(-1) })),
    ).toBeFalse();
  });

  it('is false for a task due today', () => {
    expect(isTaskOverdue(createTask({ dueDate: isoDateFromToday(0) }))).toBeFalse();
  });
});

describe('getDueInfo', () => {
  it('labels an overdue task with the number of days late', () => {
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(-3) }))).toEqual({
      kind: 'overdue',
      label: 'Overdue by 3 days',
    });
  });

  it('uses the singular form when overdue by one day', () => {
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(-1) })).label).toBe(
      'Overdue by 1 day',
    );
  });

  it('labels a task due today', () => {
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(0) }))).toEqual({
      kind: 'upcoming',
      label: 'Due today',
    });
  });

  it('labels upcoming tasks in days', () => {
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(1) })).label).toBe('Due in 1 day');
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(5) })).label).toBe('Due in 5 days');
  });

  it('labels whole weeks as weeks', () => {
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(7) })).label).toBe('Due in 1 week');
    expect(getDueInfo(createTask({ dueDate: isoDateFromToday(14) })).label).toBe('Due in 2 weeks');
  });

  it('labels a task completed today', () => {
    const task = createTask({ status: 'done', completedAt: isoTimestampFromToday(0) });

    expect(getDueInfo(task)).toEqual({ kind: 'completed', label: 'Completed today' });
  });

  it('labels a task completed yesterday', () => {
    const task = createTask({ status: 'done', completedAt: isoTimestampFromToday(-1) });

    expect(getDueInfo(task).label).toBe('Completed yesterday');
  });

  it('labels older completions in days ago', () => {
    const task = createTask({ status: 'done', completedAt: isoTimestampFromToday(-4) });

    expect(getDueInfo(task).label).toBe('Completed 4 days ago');
  });

  it('falls back to a plain label when a done task has no completion date', () => {
    const task = createTask({ status: 'done', completedAt: undefined });

    expect(getDueInfo(task)).toEqual({ kind: 'completed', label: 'Completed' });
  });
});
