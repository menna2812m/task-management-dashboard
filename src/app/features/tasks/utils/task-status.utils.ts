import { Task } from '../models/task.models';

export function isTaskOverdue(task: Task, today = new Date()): boolean {
  if (task.status === 'done') {
    return false;
  }

  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);

  return dueDate < currentDate;
}
