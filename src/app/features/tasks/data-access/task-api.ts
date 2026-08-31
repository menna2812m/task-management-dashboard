import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Task } from '../models/task.models';

@Injectable({
  providedIn: 'root',
})
export class TaskApi {
  readonly tasks = httpResource<Task[]>(() => `${environment.apiUrl}/tasks`, {
    defaultValue: [],
  });
}
