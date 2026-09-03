export type ChangeType = 'positive' | 'negative' | 'neutral';

/** One summary card as served by `/statistics`. */
export interface Statistic {
  id: string;
  title: string;
  /** Emoji glyph shown next to the title. */
  icon: string;
  /** Snapshot value from the backend; the dashboard prefers the live count when it has one. */
  value: number;
  /** Trend delta, e.g. "+12" or "0". */
  change: string;
  /** Period or context for the delta, e.g. "this week". */
  changeLabel: string;
  changeType: ChangeType;
  /** Accent colour for the card's icon. */
  color: string;
}
