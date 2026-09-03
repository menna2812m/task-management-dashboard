import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Statistic } from '../models/statistic.models';

/**
 * Cards to show when `/statistics` is unavailable, so the dashboard degrades to plain counts.
 * Ids match the backend so live values map the same way.
 */
export const DEFAULT_STATISTICS: readonly Statistic[] = [
  { id: 'stat-001', title: 'Total Tasks', icon: '📊', value: 0, ...noTrend('#1976D2') },
  { id: 'stat-002', title: 'Completed', icon: '✅', value: 0, ...noTrend('#388E3C') },
  { id: 'stat-003', title: 'In Progress', icon: '🔄', value: 0, ...noTrend('#FF6F00') },
  { id: 'stat-004', title: 'Overdue', icon: '⚠️', value: 0, ...noTrend('#D32F2F') },
];

function noTrend(
  color: string,
): Pick<Statistic, 'change' | 'changeLabel' | 'changeType' | 'color'> {
  return { change: '', changeLabel: '', changeType: 'neutral', color };
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsApi {
  /** Summary card definitions and trends. Values are snapshots; counts come from the task store. */
  readonly statistics = httpResource<Statistic[]>(() => `${environment.apiUrl}/statistics`, {
    defaultValue: [],
  });
}
