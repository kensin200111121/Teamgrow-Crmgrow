import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-task-global-filter',
  templateUrl: './task-global-filter.component.html',
  styleUrls: ['./task-global-filter.component.scss']
})
export class TaskGlobalFilterComponent implements OnInit {
  searchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.searchOption = new TaskSearchOption().deserialize(
      JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
    );
  }
  save(): void {
    this.filter.emit({
      str: this.searchOption.str
    });
  }
}
