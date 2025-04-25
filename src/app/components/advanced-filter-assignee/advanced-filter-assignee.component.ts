import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { SearchOption, AssigneeCondition } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-advanced-filter-assignee',
  templateUrl: './advanced-filter-assignee.component.html',
  styleUrls: ['./advanced-filter-assignee.component.scss']
})
export class AdvancedFilterAssigneeComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  @Input() selectionType: 'dropdown' | 'checkbox' = 'dropdown';
  @Output() filter = new EventEmitter();
  assignee: AssigneeCondition[] = [];
  constructor(
    private contactService: ContactService,
  ) {}

  ngOnInit(): void {
    this.searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    this.assignee = this.searchOption.assigneeCondition;
  }

  save(): void {
    this.filter.emit({
      assigneeCondition: this.assignee
    });
  }

}
