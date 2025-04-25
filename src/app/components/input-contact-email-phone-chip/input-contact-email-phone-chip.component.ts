import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { ReplaySubject, Subject } from 'rxjs';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import * as _ from 'lodash';
import { MatChipInputEvent } from '@angular/material/chips';
import { searchReg } from '@app/helper';

interface Tag {
  value: string;
  type: string;
  isPrimary: boolean;
}
@Component({
  selector: 'app-input-contact-email-phone-chip',
  templateUrl: './input-contact-email-phone-chip.component.html',
  styleUrls: ['./input-contact-email-phone-chip.component.scss']
})
export class InputContactEmailPhoneChipComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;
  optionsFocused = false;

  nullTag = { _id: null };

  @Input('placeholder') placeholder = 'Select Email Or Phone Number';
  @Input('shouldFromSearch') onlyFromSearch = false;
  @Input('onlySelect') onlySelect = false;
  @Input('isUniqueSelect') isUniqueSelect? = false;
  @Input('selectedTags') selectedTags: string[] = [];
  @Input('hasNoTag') hasNoTag = false;
  @Input('infoList') infoList: Tag[] = [];
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) inputField: MatAutocompleteTrigger;
  @ViewChild('inputField') inputFieldRef: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<Tag[]> = new ReplaySubject<Tag[]>(1);

  constructor() {}

  ngOnInit(): void {
    this.formControl.valueChanges
      .pipe(
        filter(() => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.keyword = search;
          return this.infoList;
        })
      )
      .subscribe(
        (tags) => {
          const selectedTags = [];
          if (!this.selectedTags) {
            this.selectedTags = [];
          }
          this.selectedTags.forEach((e) => {
            selectedTags.push({ value: e });
          });

          const remained = _.differenceBy(tags, selectedTags, 'value');
          const res = _.filter(remained, (e) => {
            return searchReg(e.value, this.keyword || '');
          });
          this.searching = false;
          if (res) {
            this.filteredResults.next(res);
          }
        },
        () => {
          this.searching = false;
        }
      );
  }

  remove(tag: string): void {
    _.remove(this.selectedTags, (e) => {
      return e === tag;
    });
    this.onSelect.emit(this.selectedTags);
  }

  /**
   * Select the option from the autocomplete list
   * @param evt : MatAutoCompleteSelectedEvent
   */
  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    if (!this.selectedTags) {
      this.selectedTags = [];
    }
    const tag: Tag = evt.option.value;
    const index = _.findIndex(this.selectedTags, function (e) {
      return e === tag.value;
    });
    if (index === -1) {
      this.selectedTags.push(tag.value);
    }
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit(this.selectedTags);
  }

  focusField(): void {
    this.inputFieldRef.nativeElement.focus();
    this.formControl.setValue(' ');
  }

  onActiveOption(event: MatAutocompleteActivatedEvent): void {
    if (event && event.option) {
      this.optionsFocused = true;
    } else {
      this.optionsFocused = false;
    }
  }
  onAdd(event: MatChipInputEvent): void {
    if (this.optionsFocused || !event.value.trim()) {
      return;
    }
    const index = _.findIndex(this.selectedTags, function (e) {
      return e === event.value;
    });
    if (index === -1) {
      if (!this.onlySelect) {
        this.selectedTags.push(event.value);
      }
    }
    this.inputField.closePanel();
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit(this.selectedTags);
  }
}
