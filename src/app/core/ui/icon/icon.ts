import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface IconDefinition {
  /** Single SVG path so the component renders no text and stays out of the a11y tree. */
  d: string;
  /** Defaults to the 24x24 stroke grid. */
  viewBox?: string;
  /** Filled glyphs paint with `currentColor` instead of stroking. */
  filled?: boolean;
}

/**
 * Stroke icons for controls (24x24 grid, 2px stroke) plus the filled glyphs exported from
 * the design. Content glyphs the design draws as emoji are rendered as text instead.
 */
const ICONS = {
  plus: { d: 'M12 5v14M5 12h14' },
  search: { d: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
  'more-vertical': { d: 'M12 5v.01M12 12v.01M12 19v.01' },
  'chevron-down': { d: 'M6 9l6 6 6-6' },
  pencil: { d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z' },
  refresh: { d: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6' },
  /** Overdue warning triangle, exported from the Figma file. */
  warning: {
    viewBox: '0 0 24 20',
    filled: true,
    d: 'M0 19.6365L11.5568 0.0001L23.1136 19.6365H0ZM11.5568 17.4376C11.9943 17.4376 12.3665 17.2842 12.6733 16.9774C12.9858 16.6649 13.142 16.2899 13.142 15.8524C13.142 15.4149 12.9858 15.0427 12.6733 14.7359C12.3665 14.4234 11.9943 14.2672 11.5568 14.2672C11.1193 14.2672 10.7443 14.4234 10.4318 14.7359C10.125 15.0427 9.97157 15.4149 9.97157 15.8524C9.97157 16.2899 10.125 16.6649 10.4318 16.9774C10.7443 17.2842 11.1193 17.4376 11.5568 17.4376ZM10.517 12.341H12.5966L12.75 6.54557H10.3636L10.517 12.341Z',
  },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  template: `
    @let icon = definition();
    <svg
      [attr.viewBox]="icon.viewBox ?? '0 0 24 24'"
      [attr.fill]="icon.filled ? 'currentColor' : 'none'"
      [attr.stroke]="icon.filled ? 'none' : 'currentColor'"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="icon.d" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
      line-height: 0;
      vertical-align: middle;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  protected readonly definition = computed<IconDefinition>(() => ICONS[this.name()]);
}
