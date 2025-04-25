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
import { Subject, ReplaySubject } from 'rxjs';
import { User } from '@models/user.model';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-select-member',
  templateUrl: './select-member.component.html',
  styleUrls: ['./select-member.component.scss']
})
export class SelectMemberComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search member';
  @Input('formPlaceholder') formPlaceholder = 'Search members';
  @Input('mustField') mustField = '';
  @Input('role') role = 'viewer';
  @Input('type') type = 'normal';
  @Input()
  public set members(value: User[]) {
    if (value) {
      this._members = value;
      this.filteredResults.next(this._members);
      this.cancelSelect();
    }
  }

  @Output() onSelect = new EventEmitter();

  _members: User[] = [];
  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search;
  searching = false;
  filteredResults: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);

  constructor(
    private teamService: TeamService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.filteredResults.next(this._members);
    this.inputControl.valueChanges.subscribe((search) => {
      if (search) {
        const members = [];
        for (const member of this._members) {
          if (
            (member.user_name && member.user_name.indexOf(search) >= 0) ||
            (member.email && member.email.indexOf(search) >= 0)
          ) {
            const index = members.findIndex((item) => item._id === member._id);
            if (index < 0) {
              members.push(member);
            }
          }
        }
        this.filteredResults.next(members);
      } else {
        this.filteredResults.next(this._members);
      }
    });

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

  ngOnDestroy(): void {}

  getAvatarName(user): any {
    if (user.user_name) {
      const names = user.user_name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UC';
  }

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  setSelectedMember(member): void {
    this.formControl.setValue(member, { emitEvent: false });
  }
}
