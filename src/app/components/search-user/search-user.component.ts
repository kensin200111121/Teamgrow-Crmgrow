import { SspaService } from '../../services/sspa.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { User } from '@models/user.model';
import { TeamService } from '@services/team.service';
import { validateEmail } from '@utils/functions';

@Component({
  selector: 'app-search-user',
  templateUrl: './search-user.component.html',
  styleUrls: ['./search-user.component.scss']
})
export class SearchUserComponent implements OnInit, OnDestroy {
  separatorKeyCodes: number[] = [ENTER, COMMA];

  @Input('placeholder') placeholder = 'Team or user';
  @Input('isNewAvailable') isNewAvailable = true;
  @Input('primaryField') primaryField = 'email';
  @Output() onSelect = new EventEmitter<User>();

  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredUsers: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);
  searching = false;
  keyword = '';
  addOnBlur = false;

  apiSubscription: Subscription;
  hasMore = true;
  loadingMore = false;
  skip = 0;
  loadMoreSubscription: Subscription;
  users: User[] = [];

  constructor(
    private teamService: TeamService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter((search) => {
          if (typeof search === 'string') {
            return !!search;
          } else {
            return false;
          }
        }),
        takeUntil(this._onDestroy),
        debounceTime(50),
        distinctUntilChanged(),
        tap((search) => {
          this.keyword = search;
          this.searching = true;
        }),
        map((search) => {
          return this.teamService.searchUser(search);
        })
      )
      .subscribe((api) => {
        this.apiSubscription && this.apiSubscription.unsubscribe();
        this.apiSubscription = api.subscribe(
          (res) => {
            this.searching = false;
            this.skip += res.length;

            if (this.isNewAvailable) {
              if (res && res.length == 8) {
                this.hasMore = true;
              } else {
                this.hasMore = false;
              }

              if (res && res.length > 0) {
                this.users = res;
                this.filteredUsers.next(res);
              } else {
                // Email primary field
                if (
                  this.primaryField === 'email' &&
                  validateEmail(this.keyword)
                ) {
                  const user_name = this.keyword.split('@')[0];
                  const email = this.keyword;
                  res.push(
                    new User().deserialize({
                      user_name,
                      email
                    })
                  );
                }
                // TODO: phone primary field
                // emit the result to filtered users
                this.filteredUsers.next(res);
              }
            } else {
              this.filteredUsers.next(res);
            }
          },
          () => {
            this.searching = false;
          }
        );
      });
  }
  ngOnDestroy(): void {}

  /**
   * Selected value and emit to parent
   * @param event : Autocomplete Select event
   */
  onSelectOption(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    this.onSelect.emit(value);
    this.inputField.nativeElement.value = '';
  }

  loadMore(): void {
    this.loadingMore = true;
    this.loadMoreSubscription && this.loadMoreSubscription.unsubscribe();
    this.loadMoreSubscription = this.teamService
      .searchUser(this.keyword, this.skip)
      .subscribe((res) => {
        this.loadingMore = false;
        this.skip += res.length;
        if (res && res.length === 8) {
          this.hasMore = true;
        } else {
          this.hasMore = false;
        }
        this.users = [...this.users, ...res];
        this.filteredUsers.next(this.users);
      });
  }
}
