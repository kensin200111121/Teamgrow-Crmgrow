import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-state',
  templateUrl: './advanced-filter-state.component.html',
  styleUrls: ['./advanced-filter-state.component.scss']
})
export class AdvancedFilterStateComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}
  selectedCountry = [];
  states: string[] = [];
  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      if (this.taskSearchOption.countries.length == 0) {
        this.selectedCountry.push('US');
      } else {
        this.selectedCountry = this.taskSearchOption.countries;
      }
      this.states = this.taskSearchOption.states;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      if (this.searchOption.countryCondition.length == 0) {
        this.selectedCountry.push('US');
      } else {
        this.selectedCountry = this.searchOption.countryCondition;
      }
      this.states = this.searchOption.regionCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        states: this.states
      });
    } else {
      this.filter.emit({
        regionCondition: this.states
      });
    }
  }
}
