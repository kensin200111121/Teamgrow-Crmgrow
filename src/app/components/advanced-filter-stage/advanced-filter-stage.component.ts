import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-advanced-filter-stage',
  templateUrl: './advanced-filter-stage.component.html',
  styleUrls: ['./advanced-filter-stage.component.scss']
})
export class AdvancedFilterStageComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  @Output() filter = new EventEmitter();
  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
  }

  save(): void {
    this.filter.emit({
      includeStage: this.searchOption.includeStage,
      stagesCondition: this.searchOption.stagesCondition
    });
  }

  toggleInclude(): void {
    this.searchOption.includeStage = !this.searchOption.includeStage;
  }
}
