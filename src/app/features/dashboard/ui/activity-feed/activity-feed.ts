import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Activity, ActivityType } from '../../../tasks/models/activity.models';
import { formatRelativeTime } from '../../../tasks/utils/relative-time';

/** Presentational list of recent task changes. */
@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeed {
  readonly activities = input.required<readonly Activity[]>();
  readonly loading = input(false);

  protected readonly verbs: Record<ActivityType, string> = {
    created: 'created',
    updated: 'updated',
    completed: 'completed',
    deleted: 'deleted',
  };

  protected age(timestamp: string): string {
    return formatRelativeTime(timestamp);
  }
}
