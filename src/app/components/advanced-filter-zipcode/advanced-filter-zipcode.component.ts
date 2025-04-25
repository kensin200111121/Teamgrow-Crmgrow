import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-zipcode',
  templateUrl: './advanced-filter-zipcode.component.html',
  styleUrls: ['./advanced-filter-zipcode.component.scss']
})
export class AdvancedFilterZipcodeComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  zipcodeCondition: string;
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.zipcodeCondition = this.taskSearchOption.zipcode;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.zipcodeCondition = this.searchOption.zipcodeCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        zipcode: this.zipcodeCondition
      });
    } else {
      this.filter.emit({
        zipcodeCondition: this.zipcodeCondition
      });
    }
  }
}
