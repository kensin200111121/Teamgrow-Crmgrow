import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {
  SearchOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-tag',
  templateUrl: './advanced-filter-tag.component.html',
  styleUrls: ['./advanced-filter-tag.component.scss']
})
export class AdvancedFilterTagComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  tags: string[] = [];
  constructor(
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.tags = this.taskSearchOption.tags;
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.tags = this.searchOption.tagsCondition;
    }
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        tags: this.tags
      });
    } else {
      this.filter.emit({
        includeTag: this.searchOption.includeTag,
        orTag: this.searchOption.orTag,
        tagsCondition: this.tags
      });
    }
  }

  toggleInclude(): void {
    this.searchOption.includeTag = !this.searchOption.includeTag;
  }

  toggleAndOr(): void {
    this.searchOption.orTag = !this.searchOption.orTag;
  }
}
