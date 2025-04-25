import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-company',
  templateUrl: './advanced-filter-company.component.html',
  styleUrls: ['./advanced-filter-company.component.scss']
})
export class AdvancedFilterCompanyComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  companies: string[] = [];
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.companies = this.taskSearchOption.companies;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.companies = this.searchOption.brokerageCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        companies: this.companies
      });
    } else {
      this.filter.emit({
        includeBrokerage: this.searchOption.includeBrokerage,
        brokerageCondition: this.companies
      });
    }
  }

  toggleInclude(): void {
    this.searchOption.includeBrokerage = !this.searchOption.includeBrokerage;
  }
}
