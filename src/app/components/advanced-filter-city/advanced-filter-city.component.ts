import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-advanced-filter-city',
  templateUrl: './advanced-filter-city.component.html',
  styleUrls: ['./advanced-filter-city.component.scss']
})
export class AdvancedFilterCityComponent implements OnInit {
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
      cityCondition: this.searchOption.cityCondition
    });
  }
}
