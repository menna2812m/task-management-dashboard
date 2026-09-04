import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterOutlet } from '@angular/router';
import { TaskStore } from '../../../features/tasks/data-access/task-store';
import { TaskDialogService } from '../../../features/tasks/ui/task-form-dialog/task-dialog.service';
import { CURRENT_USER } from '../../auth/current-user';
import { TranslationService } from '../../i18n/translation.service';
import { AppHeader } from '../app-header/app-header';
import { AppSidebar, SidebarNavItem } from '../app-sidebar/app-sidebar';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, AppHeader, AppSidebar],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly taskStore = inject(TaskStore);
  protected readonly taskDialog = inject(TaskDialogService);
  protected readonly translations = inject(TranslationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  protected readonly navItems: readonly SidebarNavItem[] = [
    { labelKey: 'dashboard', emoji: '📊', route: '/dashboard' },
    { labelKey: 'tasks', emoji: '✅', route: '/tasks' },
    { labelKey: 'calendar', emoji: '📅' },
    { labelKey: 'analytics', emoji: '📈' },
    { labelKey: 'team', emoji: '👥', route: '/team' },
    { labelKey: 'settings', emoji: '⚙️' },
  ];

  protected readonly currentUser = CURRENT_USER;

  protected onSearch(value: string): void {
    this.taskStore.setSearchTerm(value);
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
