import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { toggle } from '@utils/functions';
import { TeamService } from '@services/team.service';
import { FilterMode } from '@core/enums/resources.enum';

enum TeamMemberRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  EDITOR = 'editor'
}

interface TeamOption {
  name: string;
  _id: string;
}

interface UserOption {
  _id: string;
  name: string;
  role: TeamMemberRole;
}

@Component({
  selector: 'app-resource-filters',
  templateUrl: './resource-filters.component.html',
  styleUrls: ['./resource-filters.component.scss']
})
export class ResourceFilters {
  readonly FilterMode = FilterMode;
  private _teamOptions: string[] = [];
  private _typeOptions: string[] = [];

  get typeOptions(): string[] {
    return this._typeOptions || [];
  }

  @Input()
  set typeOptions(options: string[]) {
    this._typeOptions = options || [];
  }

  get teamOptions(): string[] {
    return this._teamOptions || [];
  }

  @Input()
  set teamOptions(options: string[]) {
    this._teamOptions = options || [];
  }

  private _userOptions: string[] = [];

  get userOptions(): string[] {
    return this._userOptions || [];
  }

  @Input()
  set userOptions(options: string[]) {
    this._userOptions = options || [];
  }

  @Input() mode: FilterMode = FilterMode.ALL;
  @Input() resourTypes;

  @Output() onChangeTeamOptions: EventEmitter<string[]> = new EventEmitter();

  @Output() onChangeUserOptions: EventEmitter<string[]> = new EventEmitter();

  @Output() onChangeTypeOptions: EventEmitter<string[]> = new EventEmitter();

  teams: TeamOption[] = [];
  users: UserOption[] = [];

  constructor(private teamService: TeamService) {
    this.teamService.loadAll(false);
    this.initData();
  }

  initData(): void {
    this.teamService.teams$.subscribe((_teams) => {
      this.teams = _teams;
      const users = _teams.reduce(
        (users, _team) => [...users, ..._team.owner, ..._team.editors],
        []
      );
      this.users = _.uniqBy(users, (e) => e._id);
    });
  }

  toggleTeamOption(option: string): void {
    this._teamOptions = toggle(this._teamOptions, option);
    this.onChangeTeamOptions.emit(this._teamOptions);
  }

  toggleTypeOption(type: string): void {
    this._typeOptions = toggle(this._typeOptions, type);
    this.onChangeTypeOptions.emit(this._typeOptions);
  }

  toggleUserOption(option: string): void {
    this._userOptions = toggle(this._userOptions, option);
    this.onChangeUserOptions.emit(this._userOptions);
  }
}
