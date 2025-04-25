import { SspaService } from '../../services/sspa.service';
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
import { Subject, ReplaySubject } from 'rxjs';
import * as _ from 'lodash';
import { User } from '@models/user.model';
import { searchReg } from '@app/helper';

@Component({
  selector: 'app-member-selector',
  templateUrl: './member-selector.component.html',
  styleUrls: ['./member-selector.component.scss']
})
export class MemberSelectorComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;

  @Input('placeholder') placeholder = 'Select Members';
  @Input('selected') selectedMembers: User[] = [];
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);
  listSource: User[] = [];
  @Input()
  public set dataSource(val: User[]) {
    const sourceVal = val || [];
    this.filteredResults.next([...sourceVal]);
    this.listSource = [...sourceVal];
  }

  constructor(public sspaService: SspaService) {}

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
          return this.listSource;
        })
      )
      .subscribe(
        (data) => {
          this.searching = false;
          if (typeof this.keyword === 'object') {
            this.filteredResults.next([...data]);
          } else {
            const res = _.filter(data, (e) => {
              if (
                searchReg(e.user_name, this.keyword) ||
                searchReg(e.email, this.keyword) ||
                searchReg(e.cell_phone, this.keyword)
              ) {
                return true;
              }
            });
            this.filteredResults.next(res);
          }
        },
        () => {
          this.searching = false;
        }
      );
  }

  remove(_id: string): void {
    _.remove(this.selectedMembers, (e) => {
      return e._id === _id;
    });
    this.onSelect.emit(this.selectedMembers);
  }

  /**
   * Select the option from the autocomplete list
   * @param evt : MatAutoCompleteSelectedEvent
   */
  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const user: User = evt.option.value;
    const index = _.findIndex(this.selectedMembers, function (e) {
      return e._id === user._id;
    });
    if (index === -1) {
      this.selectedMembers.push(user);
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.keyword = '';
    this.onSelect.emit(this.selectedMembers);
  }
}
