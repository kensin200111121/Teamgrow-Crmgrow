import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CustomFieldCondition, SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';
import * as _ from 'lodash';
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
  MatAutocompleteActivatedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { UntypedFormControl } from '@angular/forms';

interface columnSetting {
  id: string;
  type: string;
  name: string;
  placeholder: string;
  format: string;
  status: boolean;
  options: { value: string; label: string }[];
}

@Component({
  selector: 'app-advanced-filter-custom-field',
  templateUrl: './advanced-filter-custom-field.component.html',
  styleUrls: ['./advanced-filter-custom-field.component.scss']
})
export class AdvancedFilterCustomFieldComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  @Output() filter = new EventEmitter();
  @Input() column: string;
  garbageSubscription: Subscription;
  custome_fields: any[] = [];
  selectedColumn: columnSetting;
  optionsFocused = false;
  keyword = '';
  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) inputField: MatAutocompleteTrigger;
  @ViewChild('inputField') inputFieldRef: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;
  customFieldCondition: CustomFieldCondition[] = [];
  selectedColumnFilter: CustomFieldCondition = {
    column: '',
    type: '',
    include: true,
    condition: '',
    options: [],
    start: null,
    end: null
  };
  constructor(
    private contactService: ContactService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    this.customFieldCondition = this.searchOption.customFieldCondition;
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.custome_fields = _garbage.additional_fields.map((e) => e);
        this.selectedColumn = this.custome_fields.find(
          (e) => e.name === this.column
        );
        const index = this.customFieldCondition.findIndex(
          (e) => e.column === this.selectedColumn.name
        );
        if (index !== -1)
          this.selectedColumnFilter = this.customFieldCondition[index];
      }
    );
  }

  toggleInclude(): void {
    this.selectedColumnFilter.include = !this.selectedColumnFilter.include;
  }

  onAdd(event: MatChipInputEvent): void {
    if (this.optionsFocused || !event.value) {
      return;
    }
    const value = event.value;
    const index = _.findIndex(this.selectedColumnFilter.options, function (e) {
      return e === value;
    });
    if (index === -1) {
      this.selectedColumnFilter.options.push(value);
    }
    this.inputField.closePanel();
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const value = evt.option.value;
    const index = _.findIndex(this.selectedColumnFilter.options, function (e) {
      return e === value;
    });
    if (index === -1) {
      this.selectedColumnFilter.options.push(value);
    }
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
  }

  getStage(value: string): string {
    for (let i = 0; i < this.selectedColumn.options.length; i++) {
      if (value == this.selectedColumn.options[i].value) {
        return this.selectedColumn.options[i].label;
      }
    }
  }

  remove(option: string): void {
    _.remove(this.selectedColumnFilter.options, (e) => {
      return e === option;
    });
  }

  save(): void {
    if (
      this.selectedColumnFilter.condition ||
      this.selectedColumnFilter.options.length ||
      this.selectedColumnFilter.start ||
      this.selectedColumnFilter.end
    ) {
      this.selectedColumnFilter.column = this.selectedColumn.name;
      this.selectedColumnFilter.type = this.selectedColumn.type;
      const index = this.customFieldCondition.findIndex(
        (e) => e.column === this.selectedColumn.name
      );
      if (index === -1) {
        this.customFieldCondition.push(this.selectedColumnFilter);
      } else {
        this.customFieldCondition[index] = { ...this.selectedColumnFilter };
      }
    } else {
      this.customFieldCondition = this.customFieldCondition.filter(
        (e) => e.column !== this.selectedColumn.name
      );
    }

    this.filter.emit({
      customFieldCondition: this.customFieldCondition
    });
  }
}
