import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../../../../core/ui/icon/icon';
import { TaskStore } from '../../../tasks/data-access/task-store';
import { Assignee } from '../../../tasks/models/task.models';
import { UsersApi } from '../../data-access/users-api';

interface TeamMember {
  user: Assignee;
  /** Tasks not yet done. */
  open: number;
  done: number;
}

@Component({
  selector: 'app-team-page',
  imports: [Icon],
  templateUrl: './team-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  protected readonly usersApi = inject(UsersApi);
  private readonly taskStore = inject(TaskStore);

  /** Each user with their workload, derived from the live task list. */
  protected readonly members = computed<TeamMember[]>(() => {
    const tasks = this.taskStore.tasks();

    return this.usersApi.users.value().map((user) => {
      const own = tasks.filter((task) => task.assignee.id === user.id);
      const done = own.filter((task) => task.status === 'done').length;

      return { user, open: own.length - done, done };
    });
  });
}
