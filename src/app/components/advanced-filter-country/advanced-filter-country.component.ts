import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';
@Component({
  selector: 'app-advanced-filter-country',
  templateUrl: './advanced-filter-country.component.html',
  styleUrls: ['./advanced-filter-country.component.scss']
})
export class AdvancedFilterCountryComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  countries: string[] = [];
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.countries = this.taskSearchOption.countries;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.countries = this.searchOption.countryCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        countries: this.countries
      });
    } else {
      this.filter.emit({
        countryCondition: this.countries
      });
    }
  }
}
