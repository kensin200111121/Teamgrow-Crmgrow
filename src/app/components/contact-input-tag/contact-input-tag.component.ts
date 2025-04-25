import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  HostListener,
  ElementRef
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
  MatAutocompleteActivatedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { UntypedFormControl } from '@angular/forms';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { TagService } from '@services/tag.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { searchReg } from '@app/helper';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

interface Tag {
  _id: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-contact-input-tag',
  templateUrl: './contact-input-tag.component.html',
  styleUrls: ['./contact-input-tag.component.scss']
})
export class ContactInputTagComponent implements OnInit {
  showTags = false;
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;
  optionsFocused = false;
  nullTag = { _id: null };

  private _isDefaultOpened = false; // the variable for the default focus

  @Input('placeholder') placeholder = 'Add Tags';
  @Input('onlyFromSearch') onlyFromSearch = false;
  @Input('onlySelect') onlySelect = false;
  @Input('selectedTags') selectedTags: string[] = [];
  @Input('hasNoTag') hasNoTag = false;

  // default focus handle logic (Open the tag selector by default)
  @Input('isDefaultOpen')
  set isDefaultOpen(val: boolean) {
    if (val && !this._isDefaultOpened) {
      this._isDefaultOpened = true;
      setTimeout(() => {
        this.tagDropPanel?.open();
        setTimeout(() => {
          this.inputField?.openPanel();
          this.inputFieldRef?.nativeElement.focus();
        }, 10);
      }, 500);
    }
  }

  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) inputField: MatAutocompleteTrigger;
  @ViewChild('inputField') inputFieldRef: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;
  @ViewChild('tagDrops') tagDropPanel: NgbDropdown;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<Tag[]> = new ReplaySubject<Tag[]>(1);

  constructor(private tagService: TagService, private elementRef: ElementRef) {
    this.tagService.getAllTags(false);
    this.tagService.tags$.subscribe((tags) => {
      this.filteredResults.next(tags);
    });
  }

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
          return this.tagService.tags$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((tags) => {
            const selectedTags = [];
            if (!this.selectedTags) {
              this.selectedTags = [];
            }
            this.selectedTags.forEach((e) => {
              selectedTags.push({ _id: e });
            });
            const remained = _.difference(tags, this.selectedTags);
            const res = _.filter(remained, (e) => {
              return searchReg(e._id, this.keyword || '');
            });
            this.searching = false;
            if (res.length) {
              this.filteredResults.next(res);
            } else if (this.keyword && !this.onlyFromSearch) {
              this.filteredResults.next([{ _id: this.keyword, isNew: true }]);
            }
          });
        },
        () => {
          this.searching = false;
        }
      );
  }

  triggerSelectContent() {
    this.showTags = true;
    setTimeout(() => {
      // Focus the input when the component is initialized
      this.inputFieldRef.nativeElement.focus();
      // Manually dispatch an input event to trigger the dropdown
      this.inputFieldRef.nativeElement.dispatchEvent(new Event('input'));
    }, 300);
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
      return e === tag._id;
    });
    if (index === -1) {
      this.selectedTags.push(tag._id);
    }
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit(this.selectedTags);
    this.showTags = false;
  }

  focusField(): void {
    // Focus The field
    console.log('focus field');
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
    const tag: Tag = { _id: event.value };
    const index = _.findIndex(this.selectedTags, function (e) {
      return e === tag._id;
    });
    if (index === -1) {
      if (!this.onlySelect) {
        this.selectedTags.push(tag._id);
      }
    }
    this.inputField.closePanel();
    this.inputFieldRef.nativeElement.value = '';
    this.optionsFocused = false;
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit(this.selectedTags);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.showTags = false;
    }
  }
}
