import { Task } from '../models/task.models';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Returns a `YYYY-MM-DD` string `offset` days from today (negative = past). */
export function isoDateFromToday(offset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  return toLocalIsoDate(date);
}

/** Returns an ISO timestamp `offset` days from now (negative = past). */
export function isoTimestampFromToday(offset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  return date.toISOString();
}

let sequence = 0;

export function createTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;

  return {
    id: `task-${sequence}`,
    title: `Task ${sequence}`,
    description: 'Description',
    status: 'todo',
    priority: 'medium',
    dueDate: isoDateFromToday(3),
    assignee: {
      id: 'user-001',
      name: 'John Doe',
      avatar: 'JD',
      email: 'john.doe@company.com',
    },
    tags: ['Design'],
    createdAt: isoTimestampFromToday(-5),
    updatedAt: isoTimestampFromToday(-1),
    ...overrides,
  };
}
