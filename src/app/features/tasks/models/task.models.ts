export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type Assignee = User;

export interface LocalizedTaskText {
  title: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Bilingual content supplied when a task is created or edited. */
  translations?: {
    en: LocalizedTaskText;
    ar: LocalizedTaskText;
  };
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** A task before the server has assigned it an id. */
export type NewTask = Omit<Task, 'id'>;

export interface TasksResponse {
  tasks: Task[];
  meta: {
    totalCount: number;
    lastUpdated: string;
  };
}
export interface TaskFormValue {
  title: string;
  description: string;
  titleAr: string;
  descriptionAr: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  tags: string[];
}

export interface TaskDialogData {
  task?: Task;
  assignees: readonly Assignee[];
}
import { User } from '../../../core/models/user.models';
