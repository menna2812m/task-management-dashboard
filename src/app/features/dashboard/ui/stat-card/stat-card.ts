import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, IconName } from '../../../../core/ui/icon/icon';
import { Statistic } from '../../models/statistic.models';

/** Emoji the design replaces with a vector glyph exported from Figma. */
const VECTOR_GLYPHS: Record<string, IconName> = {
  '⚠️': 'warning',
};

/** Presentational summary card. Knows nothing about where the numbers come from. */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly statistic = input.required<Statistic>();
  /** Live count to show instead of the statistic's snapshot value. */
  readonly value = input<number | undefined>(undefined);

  protected readonly displayValue = computed(() => this.value() ?? this.statistic().value);

  /** "+12 this week" for a delta, or just the label when nothing changed. */
  protected readonly changeText = computed(() => {
    const { change, changeLabel, changeType } = this.statistic();

    if (changeType === 'neutral' || !change) {
      return changeLabel;
    }

    return `${change} ${changeLabel}`.trim();
  });

  protected readonly vectorIcon = computed<IconName | null>(
    () => VECTOR_GLYPHS[this.statistic().icon] ?? null,
  );
}
