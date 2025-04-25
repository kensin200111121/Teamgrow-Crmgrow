import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
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

interface Tag {
  _id: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-input-tag',
  templateUrl: './input-tag.component.html',
  styleUrls: ['./input-tag.component.scss']
})
export class InputTagComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;
  optionsFocused = false;

  nullTag = { _id: null };

  @Input('isHideLabel') isHideLabel = true;
  @Input('title') title = 'Tags';
  @Input('placeholder') placeholder = 'Add Tags';
  @Input('onlyFromSearch') onlyFromSearch = false;
  @Input('onlySelect') onlySelect = false;
  @Input('selectedTags') selectedTags: string[] = [];
  @Input('hasNoTag') hasNoTag = false;
  @Input('includeTeam') includeTeam = false;
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) inputField: MatAutocompleteTrigger;
  @ViewChild('inputField') inputFieldRef: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<Tag[]> = new ReplaySubject<Tag[]>(1);

  constructor(private tagService: TagService) {}

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

    if (this.includeTeam) {
      this.tagService.getAllTagsForTeam().subscribe((tags) => {
        this.filteredResults.next(tags);
      });
    } else {
      this.tagService.getAllTags(false);
      this.tagService.tags$.subscribe((tags) => {
        this.filteredResults.next(tags);
      });
    }
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
}
