import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  TemplateRef
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { User } from '@models/user.model';
import { TeamService } from '@services/team.service';
import * as _ from 'lodash';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-select-leader',
  templateUrl: './select-leader.component.html',
  styleUrls: ['./select-leader.component.scss']
})
export class SelectLeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search Team Leader';
  @Input('formPlaceholder') formPlaceholder = 'Search Team Leader';
  @Output() onSelect = new EventEmitter();
  @Input() public set leader(val: User) {
    if (val) {
      this.filteredResults.next([val]);
      this.formControl.setValue(val, { emitEvent: false });
      // this.onSelect.emit(val);
    }
  }
  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  filteredResults: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);
  teamLeaders: User[] = [];

  loadSubscription: Subscription;

  userId;
  constructor(
    private teamService: TeamService,
    private userService: UserService,
    public sspaService: SspaService
  ) {
    const profile = this.userService.profile.getValue();
    this.userId = profile._id;
  }

  ngOnInit(): void {
    this.loadLeaders();
    this.inputControl.valueChanges
      .pipe(
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) =>
          search
            ? this.teamLeaders.filter((e) => {
                if (JSON.stringify(e).indexOf(search) !== -1) {
                  return true;
                }
              })
            : this.teamLeaders
        )
      )
      .subscribe(
        (filtered) => {
          this.searching = false;
          this.filteredResults.next(filtered);
        },
        () => {
          this.searching = false;
        }
      );
    this.formControl.valueChanges.subscribe((val) => {
      this.onSelect.emit(val);
    });
  }

  ngAfterViewInit(): void {
    this.selector._positions = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  /**
   * This function loads the leaders(owners and editors) of teams that he owns or is included.
   */
  loadLeaders(): void {
    this.searching = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.teamService.loadLeaders().subscribe((data) => {
      this.searching = false;
      this.teamLeaders = data;
      this.teamLeaders = _.pullAllBy(
        this.teamLeaders,
        [{ _id: this.userId }],
        '_id'
      );
      if (this.formControl.value) {
        const val = { ...this.formControl.value };
        this.filteredResults.next(this.teamLeaders);
        const selectedValue = this.teamLeaders.filter(
          (e) => e._id === val._id
        )[0];
        this.formControl.setValue(selectedValue, { emitEvent: false });
      }
    });
  }
}
