import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Icon } from '../../ui/icon/icon';

export interface SidebarNavItem {
  labelKey: string;
  emoji: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Icon],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar {
  readonly items = input.required<readonly SidebarNavItem[]>();
  readonly createTask = output<void>();
}
