import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import type { Chart } from 'chart.js';

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

let nextHeadingId = 0;

/**
 * Doughnut chart with an accessible breakdown list. Chart.js is imported on first use so it
 * only ships to browsers that reach the dashboard, and the list carries the numbers for
 * assistive technology, which cannot read the canvas.
 */
@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionChart implements OnDestroy {
  readonly title = input.required<string>();
  readonly slices = input.required<readonly ChartSlice[]>();

  protected readonly headingId = `distribution-chart-${nextHeadingId++}`;
  protected readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart<'doughnut'> | undefined;
  private destroyed = false;

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const slices = this.slices();

      if (!canvas) {
        this.chart?.destroy();
        this.chart = undefined;

        return;
      }

      void this.draw(canvas, slices);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.chart?.destroy();
  }

  private async draw(canvas: HTMLCanvasElement, slices: readonly ChartSlice[]): Promise<void> {
    const { Chart, ArcElement, DoughnutController, Tooltip } = await import('chart.js');

    if (this.destroyed) {
      return;
    }

    Chart.register(ArcElement, DoughnutController, Tooltip);

    const data = {
      labels: slices.map((slice) => slice.label),
      datasets: [
        {
          data: slices.map((slice) => slice.value),
          backgroundColor: slices.map((slice) => slice.color),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };

    if (this.chart && this.chart.canvas === canvas) {
      this.chart.data = data;
      this.chart.update();

      return;
    }

    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data,
      options: {
        cutout: '68%',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false } },
      },
    });
  }
}
