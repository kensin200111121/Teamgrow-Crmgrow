import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '@app/services/user.service';
import { Router } from '@angular/router';
import { TaskService } from '@app/services/task.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-overview-report',
  templateUrl: './overview-report.component.html',
  styleUrls: ['./overview-report.component.scss']
})
export class OverviewReportComponent implements OnInit {
  @Output() onChangeTab = new EventEmitter();
  tab = { label: 'Activity', id: 'activities', icon: '' };

  VIEW_OPTIONS = [
    { id: 'last_month', label: 'Last Month', days: 30 },
    { id: 'last_week', label: 'Last Week', days: 7 },
    { id: 'last_day', label: 'Last Day', days: 1 }
  ];
  viewOption = this.VIEW_OPTIONS[0];
  calls = 0;
  texts = 0;
  emails = 0;
  tasks = 0;
  appointments = 0;
  loading = false;
  taskSubscription: Subscription;
  smsCountSubscription: Subscription;

  constructor(
    private router: Router,
    private userService: UserService,
    private taskService: TaskService
  ) {
    this.taskSubscription && this.taskSubscription.unsubscribe();
    this.taskSubscription = this.taskService.created$.subscribe((_data) => {
      if (_data) {
        this.getReports();
      }
    });

    this.smsCountSubscription && this.smsCountSubscription.unsubscribe();
    this.smsCountSubscription = this.userService.sentSMS$.subscribe((_data) => {
      if (_data) {
        this.getReports();
      }
    });
  }

  ngOnInit(): void {
    this.getReports();
  }

  changeOption(type: any): void {
    this.viewOption = type;
    this.getReports();
  }


  getReports() {
    const duration = this.viewOption.days;
    this.loading = true;
    this.userService.reports(duration).subscribe((res) => {
      if (res) {
        this.calls = res.calls;
        this.texts = res.texts;
        this.emails = res.emails;
        this.tasks = res.tasks;
        this.appointments = res.appointments;
      }
      this.loading = false;
    });
  }

  gotoActivities() {
    this.onChangeTab.emit(this.tab);
  }

}
