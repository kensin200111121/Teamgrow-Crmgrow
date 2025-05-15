import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { SearchOption, TaskSearchOption, AssigneeCondition } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-assignee',
  templateUrl: './advanced-filter-assignee.component.html',
  styleUrls: ['./advanced-filter-assignee.component.scss']
})
export class AdvancedFilterAssigneeComponent implements OnInit {
  @Input() selectionType: 'dropdown' | 'checkbox' = 'dropdown';
  @Input() target: 'contact' | 'task' = 'contact';
  @Output() filter = new EventEmitter();
  contactSearchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  assignee: AssigneeCondition[] = [];

  constructor(
    private contactService: ContactService,
    private taskService: TaskService,
  ) {}

  ngOnInit(): void {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.assignee = this.taskSearchOption.assigneeCondition;
    } else if (this.target === 'contact') {
      this.contactSearchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.assignee = this.contactSearchOption.assigneeCondition;
    }
  }

  save(): void {
    this.filter.emit({
      assigneeCondition: this.assignee
    });
  }
}
