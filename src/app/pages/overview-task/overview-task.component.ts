import { Component, OnInit } from '@angular/core';
import { TaskService } from '@app/services/task.service';
import { UserService } from '@app/services/user.service';
import { environment } from '@environments/environment';
import { replaceToken } from '@app/helper';
import { TemplateToken } from '@app/utils/data.types';
import { TaskDetail } from '@app/models/task.model';
import { MatDialog } from '@angular/material/dialog';
import { TaskEditComponent } from '@app/components/task-edit/task-edit.component';
import { DialogSettings } from '@constants/variable.constants';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-overview-task',
  templateUrl: './overview-task.component.html',
  styleUrls: ['./overview-task.component.scss']
})
export class OverviewTaskComponent implements OnInit {
  loading = false;
  todayTasks = [];
  TASK_ICONS = {
    task: 'i-task',
    call: 'i-phone',
    meeting: 'i-lunch',
    email: 'i-message',
    material: 'i-video',
    text: 'i-sms-sent'
  };
  templateTokens: TemplateToken[] = [];
  taskSubscription: Subscription;
  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private dialog: MatDialog
  ) {
    this.taskSubscription && this.taskSubscription.unsubscribe();
    this.taskSubscription = this.taskService.created$.subscribe((_data) => {
      if (_data) {
        this.loadTodayTasks();
      }
    });
  }

  ngOnInit(): void {
    this.loadTodayTasks();
  }

  loadTodayTasks() {
    this.loading = true;
    this.taskService.getTodayTasks().subscribe((res) => {
      if (res) {
        const tasks = res;
        tasks.sort((a, b) => (a.due_date > b.due_date ? 1 : -1));
        const last_tasks = tasks.slice(0, 5);
        this.todayTasks = last_tasks.map((e) =>
          new TaskDetail().deserialize(e)
        );
      }
      this.loading = false;
    });
  }

  replaceContent(contact: any, content: string): string {
    const user = this.userService.profile.getValue();
    return replaceToken(
      user,
      contact,
      this.templateTokens,
      content,
      '',
      null,
      null
    );
  }

  openEdit(element: TaskDetail): void {
    this.dialog
      .open(TaskEditComponent, {
        ...DialogSettings.TASK,
        data: {
          task: element,
          contact: element.contact._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.loadTodayTasks();
        }
      });
  }
}
