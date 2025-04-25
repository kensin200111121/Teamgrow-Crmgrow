import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  TemplateRef
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
  MatAutocompleteTrigger,
  MatAutocompleteActivatedEvent
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
import { Subject, ReplaySubject, Observable, Subscription } from 'rxjs';
import * as _ from 'lodash';
import { User } from '@app/models/user.model';
import { UserService } from '@app/services/user.service';

@Component({
  selector: 'app-input-team-members',
  templateUrl: './input-team-members.component.html',
  styleUrls: ['./input-team-members.component.scss']
})
export class InputTeamMembersComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;
  optionsFocused = false;

  @Input('placeholder') placeholder = 'Add Members';
  @Input('display') display = 'email'; // Which field is enabled when display the item.
  @Input('onlyFromSearch') onlyFromSearch = false;
  private _selectedMembers: User[] = [];
  @Input('selectedMembers')
  set selectedMembers(values) {
    this._selectedMembers = values;
  }
  get selectedMembers() {
    return this._selectedMembers;
  }
  @Input('chipType') chipType = 'block';
  @Input('optionClass') optionClass = '';
  @Input('onlyOne') onlyOne = false;
  @Output() onSelect = new EventEmitter();
  @Output() onRemove = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) autoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);
  filteredMembers: User[] = [];

  members: User[] = [];

  hasMore = true;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.accounts$.subscribe((res) => {
      const memberIds = [];
      (res?.accounts || []).forEach((user) => {
        const member = new User().deserialize(user);
        this.members.push(member);
        memberIds.push(member?._id);
      });
      this._selectedMembers = this._selectedMembers.filter((member) =>
        memberIds.includes(member?._id)
      );
    });
    this.formControl.valueChanges
      .pipe(
        filter((search) => {
          if (typeof search === 'string') {
            if (search) {
              return true;
            }
            return false;
          } else {
            return false;
          }
        }),
        takeUntil(this._onDestroy),
        debounceTime(500),
        distinctUntilChanged(),
        tap((search) => {
          this.searching = true;
          this.keyword = search;
        })
      )
      .subscribe(
        (res: any) => {
          this.searching = false;
          if (this.keyword) {
            this.filteredMembers = [];
            this.members.forEach((member) => {
              if (
                member.user_name
                  ?.toLowerCase()
                  .indexOf(this.keyword.toLowerCase()) >= 0 ||
                member.nick_name
                  ?.toLowerCase()
                  .indexOf(this.keyword.toLowerCase()) >= 0 ||
                member.email?.indexOf(this.keyword) >= 0
              ) {
                this.filteredMembers.push(member);
              }
            });
            this.filteredResults.next(this.filteredMembers);
          }
        },
        (error) => {
          this.searching = false;
        }
      );
  }

  closePopups() {
    if (this.autoCompleteTrigger && this.autoCompleteTrigger.panelOpen) {
      this.autoCompleteTrigger.closePanel();
    }
  }

  remove(user: User): void {
    _.remove(this.selectedMembers, (e) => {
      if (user._id) {
        return e._id === user._id;
      } else if (this.display === 'email') {
        return e.email === user.email;
      } else if (this.display === 'cell_phone') {
        return e.cell_phone === user.cell_phone;
      }
    });
    this.onRemove.emit(user);
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const member = evt.option.value;
    let index;
    if (member._id) {
      index = _.findIndex(this.selectedMembers, function (e) {
        return e._id == member._id;
      });
    } else {
      index = _.findIndex(this.selectedMembers, (e) => {
        if (this.display === 'email') {
          return e.email == member.email;
        } else if (this.display === 'cell_phone') {
          return e.cell_phone === member.cell_phone;
        }
      });
    }
    if (index === -1) {
      if (member instanceof User) {
        if (
          (this.onlyOne && this.selectedMembers.length === 0) ||
          !this.onlyOne
        ) {
          this.selectedMembers.push(member);
        }
      } else {
        if (
          (this.onlyOne && this.selectedMembers.length === 0) ||
          !this.onlyOne
        ) {
          this.selectedMembers.push(new User().deserialize(member));
        }
      }
      this.onSelect.emit(this.selectedMembers);
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.keyword = '';
    this.optionsFocused = false;
  }

  onActiveOption(event: MatAutocompleteActivatedEvent): void {
    if (event && event.option) {
      this.optionsFocused = true;
    } else {
      this.optionsFocused = false;
    }
  }
}
