import { Assignee, Task } from './task.models';

export type ActivityType = 'created' | 'updated' | 'completed' | 'deleted';

/** One entry in the recent activity feed, as stored at `/activities`. */
export interface Activity {
  id: string;
  type: ActivityType;
  taskId: string;
  /** Captured at the time of the change so the entry survives the task being deleted. */
  taskTitle: string;
  taskTranslations?: Task['translations'];
  actor: Assignee;
  timestamp: string;
}

export type NewActivity = Omit<Activity, 'id'>;
