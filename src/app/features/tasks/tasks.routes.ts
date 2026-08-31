import { Routes } from '@angular/router';
import { TasksPage } from './pages/tasks-page/tasks-page';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksPage,
  },
];
