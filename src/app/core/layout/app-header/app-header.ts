import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppLanguage } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { User } from '../../models/user.models';
import { Icon } from '../../ui/icon/icon';

@Component({
  selector: 'app-header',
  imports: [TranslatePipe, Icon],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  readonly searchTerm = input('');
  readonly language = input.required<AppLanguage>();
  readonly currentUser = input.required<User>();

  readonly searchChange = output<string>();
  readonly languageChange = output<AppLanguage>();
  readonly notificationsClick = output<void>();

  protected onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }

  protected toggleLanguage(): void {
    this.languageChange.emit(this.language() === 'en' ? 'ar' : 'en');
  }
}
