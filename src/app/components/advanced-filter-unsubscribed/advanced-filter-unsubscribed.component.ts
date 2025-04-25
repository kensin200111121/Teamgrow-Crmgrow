import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchOption } from '@app/models/searchOption.model';
import { ContactService } from '@app/services/contact.service';

@Component({
  selector: 'app-advanced-filter-unsubscribed',
  templateUrl: './advanced-filter-unsubscribed.component.html',
  styleUrls: ['./advanced-filter-unsubscribed.component.scss']
})
export class AdvancedFilterUnsubscribedComponent implements OnInit {
  option = {
    email: false,
    text: false
  };
  includeUnsubscribed = true;
  selectedUnsubscribedActions = '';
  @Output() filter = new EventEmitter();

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    const searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    this.option = searchOption.unsubscribed || {
      email: false,
      text: false
    };
    this.includeUnsubscribed = searchOption.includeUnsubscribed;
    if (this.option['email']) this.selectedUnsubscribedActions = 'email';
    else if (this.option['text']) this.selectedUnsubscribedActions = 'text';
  }

  toggleOption(option: string): void {
    if (option === 'email') {
      this.option['email'] = !this.option['email'];
    } else if (option === 'text') {
      this.option['text'] = !this.option['text'];
    }
  }

  save(): void {
    this.filter.emit({
      unsubscribed: this.option,
      includeUnsubscribed: this.includeUnsubscribed
    });
  }

  toggleInclude(): void {
    this.includeUnsubscribed = !this.includeUnsubscribed;
  }
}
