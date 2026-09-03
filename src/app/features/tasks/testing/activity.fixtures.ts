import { CURRENT_USER } from '../../../core/auth/current-user';
import { Activity } from '../models/activity.models';

let sequence = 0;

export function createActivity(overrides: Partial<Activity> = {}): Activity {
  sequence += 1;

  return {
    id: `activity-${sequence}`,
    type: 'created',
    taskId: `task-${sequence}`,
    taskTitle: `Task ${sequence}`,
    actor: CURRENT_USER,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
