import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-source',
  templateUrl: './advanced-filter-source.component.html',
  styleUrls: ['./advanced-filter-source.component.scss']
})
export class AdvancedFilterSourceComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  sourceCondition: string[] = [];
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.sourceCondition = this.taskSearchOption.sources;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.sourceCondition = this.searchOption.sourceCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        sources: this.sourceCondition
      });
    } else {
      this.filter.emit({
        includeSource: this.searchOption.includeSource,
        sourceCondition: this.sourceCondition
      });
    }
  }

  toggleInclude(): void {
    this.searchOption.includeSource = !this.searchOption.includeSource;
  }
}
