import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';
import { TabOption } from '@utils/data.types';
import { TaskStatus } from '@constants/variable.constants';
@Component({
  selector: 'app-task-status-filter',
  templateUrl: './task-status-filter.component.html',
  styleUrls: ['./task-status-filter.component.scss']
})
export class TaskStatusFilterComponent implements OnInit {
  searchOption: TaskSearchOption = new TaskSearchOption();
  STATUS_OPTIONS: TabOption[] = [
    { label: 'TO DO', value: TaskStatus.TODO },
    { label: 'ALL', value: TaskStatus.ALL },
    { label: 'COMPLETED', value: TaskStatus.COMPLETED }
  ];
  status = this.STATUS_OPTIONS[1];
  @Output() filter = new EventEmitter();
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.searchOption = new TaskSearchOption().deserialize(
      JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
    );
    const option = this.searchOption;
    switch (option.status) {
      case 0:
        this.status = this.STATUS_OPTIONS[0];
        break;
      case 1:
        this.status = this.STATUS_OPTIONS[2];
        break;
      default:
        this.status = this.STATUS_OPTIONS[1];
    }
  }

  changeOption(option: TabOption): void {
    let status;
    if (option.value === TaskStatus.TODO) {
      status = 0;
    } else if (option.value == TaskStatus.COMPLETED) {
      status = 1;
    } else {
      status = [0, 1, 2];
    }
    this.status = option;
    this.searchOption.status = status;
  }

  save(): void {
    this.filter.emit({
      status: this.searchOption.status
    });
  }
}
