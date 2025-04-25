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
  MatAutocomplete
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
import { searchReg } from '@app/helper';

interface Tag {
  _id: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-input-source',
  templateUrl: './input-source.component.html',
  styleUrls: ['./input-source.component.scss']
})
export class InputSourceComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;

  nullOption = { _id: null };

  @Input('placeholder') placeholder = 'Add Sources';
  @Input('onlyFromSearch') onlyFromSearch = false;
  @Input('selectedTags') selectedTags: string[] = [];
  @Input('hasNullOption') hasNullOption = true;
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<Tag[]> = new ReplaySubject<Tag[]>(1);

  constructor(private tagService: TagService) {
    this.tagService.sources$.subscribe((tags) => {
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
          return this.tagService.sources$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((tags) => {
            const selectedTags = [];
            this.selectedTags.forEach((e) => {
              selectedTags.push({ _id: e });
            });
            const remained = _.difference(tags, this.selectedTags);
            const res = _.filter(remained, (e) => {
              return searchReg(e._id, this.keyword);
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

  remove(tag: string): void {
    _.remove(this.selectedTags, (e) => {
      return e === tag;
    });
    this.onSelect.emit();
  }

  /**
   * Select the option from the autocomplete list
   * @param evt : MatAutoCompleteSelectedEvent
   */
  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const tag: Tag = evt.option.value;
    const index = _.findIndex(this.selectedTags, function (e) {
      return e === tag._id;
    });
    if (index === -1) {
      this.selectedTags.push(tag._id);
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit();
  }
}
