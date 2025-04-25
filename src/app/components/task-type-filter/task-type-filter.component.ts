import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';

export const TYPES = [
  { id: 'task', label: 'General', icon: 'i-task' },
  { id: 'call', label: 'Call', icon: 'i-phone' },
  { id: 'meeting', label: 'Meeting', icon: 'i-lunch' },
  { id: 'email', label: 'Email', icon: 'i-message' },
  { id: 'text', label: 'Text', icon: 'i-sms-sent' }
];

@Component({
  selector: 'app-task-type-filter',
  templateUrl: './task-type-filter.component.html',
  styleUrls: ['./task-type-filter.component.scss']
})
export class TaskTypeFilterComponent implements OnInit {
  searchOption: TaskSearchOption = new TaskSearchOption();

  selectedTypes: string[] = [];
  types = TYPES;
  @Output() filter = new EventEmitter();
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.searchOption = new TaskSearchOption().deserialize(
      JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
    );
    this.selectedTypes = this.searchOption.types || [];
  }

  toggleLabels(type: string): void {
    const pos = this.selectedTypes.indexOf(type);
    if (pos !== -1) {
      this.selectedTypes.splice(pos, 1);
    } else {
      this.selectedTypes.push(type);
    }
  }

  save(): void {
    this.filter.emit({
      types: this.selectedTypes
    });
  }
}
