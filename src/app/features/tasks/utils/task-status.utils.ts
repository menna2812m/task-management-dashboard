import { Task } from '../models/task.models';

export type DueKind = 'overdue' | 'upcoming' | 'completed';

export interface DueInfo {
  kind: DueKind;
  label: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy;
}

/** Whole days from `from` to `to`, both truncated to local midnight. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

function parseDueDate(dueDate: string): Date {
  return new Date(`${dueDate}T00:00:00`);
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

export function isTaskOverdue(task: Task, today = new Date()): boolean {
  if (task.status === 'done') {
    return false;
  }

  return daysBetween(today, parseDueDate(task.dueDate)) < 0;
}

export function isCompletedOn(task: Task, day: Date): boolean {
  if (task.status !== 'done' || !task.completedAt) {
    return false;
  }

  return daysBetween(new Date(task.completedAt), day) === 0;
}

export function getDueInfo(task: Task, today = new Date()): DueInfo {
  if (task.status === 'done') {
    if (!task.completedAt) {
      return { kind: 'completed', label: 'Completed' };
    }

    const daysAgo = daysBetween(new Date(task.completedAt), today);

    if (daysAgo <= 0) {
      return { kind: 'completed', label: 'Completed today' };
    }

    if (daysAgo === 1) {
      return { kind: 'completed', label: 'Completed yesterday' };
    }

    return { kind: 'completed', label: `Completed ${plural(daysAgo, 'day')} ago` };
  }

  const daysUntilDue = daysBetween(today, parseDueDate(task.dueDate));

  if (daysUntilDue < 0) {
    return { kind: 'overdue', label: `Overdue by ${plural(-daysUntilDue, 'day')}` };
  }

  if (daysUntilDue === 0) {
    return { kind: 'upcoming', label: 'Due today' };
  }

  if (daysUntilDue >= 7 && daysUntilDue % 7 === 0) {
    return { kind: 'upcoming', label: `Due in ${plural(daysUntilDue / 7, 'week')}` };
  }

  return { kind: 'upcoming', label: `Due in ${plural(daysUntilDue, 'day')}` };
}
