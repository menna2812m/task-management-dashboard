import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TaskStore } from '../../../features/tasks/data-access/task-store';
import { TaskDialogService } from '../../../features/tasks/ui/task-form-dialog/task-dialog.service';
import { Icon } from '../../ui/icon/icon';

interface NavItem {
  label: string;
  /** The design uses emoji glyphs for navigation, so they are rendered as text. */
  emoji: string;
  /** Omitted for sections that exist in the design but have no route yet. */
  route?: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly taskStore = inject(TaskStore);
  protected readonly taskDialog = inject(TaskDialogService);

  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', emoji: '📊', route: '/dashboard' },
    { label: 'Tasks', emoji: '✅', route: '/tasks' },
    { label: 'Calendar', emoji: '📅' },
    { label: 'Analytics', emoji: '📈' },
    { label: 'Team', emoji: '👥' },
    { label: 'Settings', emoji: '⚙️' },
  ];

  // There is no authentication yet; this mirrors the signed-in user shown in the design.
  protected readonly currentUser = { name: 'John Doe', initials: 'JD' };

  protected onSearch(event: Event): void {
    this.taskStore.setSearchTerm((event.target as HTMLInputElement).value);
  }
}
