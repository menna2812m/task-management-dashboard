import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TaskStore } from '../../../features/tasks/data-access/task-store';
import { TaskDialogService } from '../../../features/tasks/ui/task-form-dialog/task-dialog.service';
import { CURRENT_USER } from '../../auth/current-user';
import { TranslationService } from '../../i18n/translation.service';
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
  protected readonly translations = inject(TranslationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', emoji: '📊', route: '/dashboard' },
    { label: 'Tasks', emoji: '✅', route: '/tasks' },
    { label: 'Calendar', emoji: '📅' },
    { label: 'Analytics', emoji: '📈' },
    { label: 'Team', emoji: '👥', route: '/team' },
    { label: 'Settings', emoji: '⚙️' },
  ];

  protected readonly currentUser = CURRENT_USER;

  protected onSearch(event: Event): void {
    this.taskStore.setSearchTerm((event.target as HTMLInputElement).value);
    queueMicrotask(() => this.scrollToTaskResults());
  }

  protected showNotifications(): void {
    this.snackBar.open(this.translations.translate('notificationsSoon'), undefined, {
      duration: 3000,
    });
  }

  private scrollToTaskResults(): void {
    this.document
      .querySelector<HTMLElement>('[data-task-results]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
