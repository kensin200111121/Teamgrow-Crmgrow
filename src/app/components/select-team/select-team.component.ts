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
import { TeamService } from '@services/team.service';
import { Team } from '@models/team.model';
import { User } from '@models/user.model';
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-select-team',
  templateUrl: './select-team.component.html',
  styleUrls: ['./select-team.component.scss']
})
export class SelectTeamComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Select community';
  @Input('formPlaceholder') formPlaceholder = 'Search community';
  @Input('mustField') mustField = '';
  @Input('target') target = '';
  private _internalOnly = true;
  @Input() set internalOnly(val: boolean) {
    this._internalOnly = val;
  }

  get internalOnly(): boolean {
    return this._internalOnly;
  }

  @Input()
  public set selectedTeam(val: any) {
    if (!val) {
      this.formControl.setValue(null, { emitEvent: false });
    } else {
      this.teamService.teams$.subscribe((res) => {
        const teams = !this.internalOnly
          ? [...res]
          : res.filter((e) => e.is_internal);
        const index = teams.findIndex((item) => item._id === val._id);
        if (index >= 0) {
          this.filteredResults.next(teams);
          setTimeout(() => {
            this.formControl.setValue(teams[index], { emitEvent: false });
          }, 1000);
        }
      });
    }
  }

  @Output() onSelect = new EventEmitter();
  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  filteredResults: ReplaySubject<Team[]> = new ReplaySubject<Team[]>(1);
  teams;
  profileSubscription: Subscription;
  currentUser: User;
  internalTeamCount = 0;
  communityCount = 0;
  constructor(
    private teamService: TeamService,
    private userService: UserService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
      if (this.currentUser.team_info) {
        this.load();
      }
    });

    this.inputControl.valueChanges.subscribe((search) => {
      if (search) {
        const teams = [];
        for (const team of this.teams) {
          if (team.name && team.name.indexOf(search) >= 0) {
            const index = this.teams.findIndex((item) => item._id === team._id);
            if (index >= 0) {
              teams.push(team);
            }
          }
        }
        this.filteredResults.next(teams);
      } else {
        this.filteredResults.next(this.teams);
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

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  clear(): void {
    this.formControl.setValue(null, { emitEvent: false });
  }

  load(): void {
    this.teamService.loadAll(true);
    this.teamService.loadInvites(true);
    this.teamService.loadRequests(true);
    this.teamService.teams$.subscribe((res) => {
      const teams = this.teamService.teams.getValue();
      if (teams) {
        const internalTeam = teams.filter((e) => e.is_internal);
        if (internalTeam.length) {
          this.formControl.setValue(internalTeam[0], { emitEvent: false });
        }
        this.filteredResults.next(this.internalOnly ? internalTeam : teams);
        this.teams = this.internalOnly ? internalTeam : teams;
      }
    });
  }
}
