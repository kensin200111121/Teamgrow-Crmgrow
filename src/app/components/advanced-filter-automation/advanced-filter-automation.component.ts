import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ContactService } from '@app/services/contact.service';
import { SearchOption } from '@models/searchOption.model';
@Component({
  selector: 'app-advanced-filter-automation',
  templateUrl: './advanced-filter-automation.component.html',
  styleUrls: ['./advanced-filter-automation.component.scss']
})
export class AdvancedFilterAutomationComponent implements OnInit {
  option = '';

  @Output() filter = new EventEmitter();

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    var searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    this.option = searchOption.analyticsConditions[0]?.id || 'on_automation';
  }

  toggleOption(value: string) {
    this.option = value;
  }

  save(): void {
    this.filter.emit({
      analyticsConditions: [{ id: this.option, range: 125 }]
    });
  }
}
