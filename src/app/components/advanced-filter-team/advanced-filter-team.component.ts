import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Input,
  Output
} from '@angular/core';
import * as _ from 'lodash';
import { SearchOption } from '@models/searchOption.model';
import { UserService } from '@services/user.service';
import { ContactService } from '@services/contact.service';
import { Subscription } from 'rxjs';
import { TeamService } from '@services/team.service';
import { User } from '@models/user.model';

@Component({
  selector: 'app-advanced-filter-team',
  templateUrl: './advanced-filter-team.component.html',
  styleUrls: ['./advanced-filter-team.component.scss']
})
export class AdvancedFilterTeamComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();

  teamSubscription: Subscription;
  teams = [];
  teamMembers = {};
  profileSubscription: Subscription;

  teamOptions = {}; // {team_id: {flag: 1|0|-1, members: User[]}
  isShareWith = false;
  isShareBy = false;

  @Output() filter = new EventEmitter();
  constructor(
    private contactService: ContactService,
    public userService: UserService,
    private teamService: TeamService
  ) {
    this.teamService.loadAll(false);
  }

  ngOnInit() {
    this.searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    this.teamOptions = this.searchOption.teamOptions;
    if (Object.keys(this.teamOptions).length) {
      for (const team_id in this.teamOptions) {
        const teamOption = this.teamOptions[team_id];
        if (teamOption.members && teamOption.members.length) {
          const members = this.teamMembers[team_id].filter(
            (e) => teamOption.members.indexOf(e._id) !== -1
          );
          teamOption.members = members;
          if (members.length === this.teamMembers[team_id].length) {
            teamOption.flag = 1;
          }
        }
      }
    }

    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user._id) {
        this.teamSubscription = this.teamService.teams$.subscribe((teams) => {
          this.teams = teams.filter((e) => e.members.length);
          this.teams.forEach((e) => {
            const members = [...e.owner, ...e.members];
            const anotherMembers = members.filter((e) => e._id !== user._id);
            if (anotherMembers.length) {
              this.teamMembers[e._id] = [...anotherMembers];
            }
          });
        });
      }
    });
  }

  toggleTeam(team: any): void {
    const team_id = team._id;
    const teamOption = this.teamOptions[team_id];
    if (teamOption) {
      if (teamOption.flag === -1) {
        teamOption.flag = 1;
        teamOption.members = [];
      } else if (teamOption.flag === 0) {
        teamOption.flag = 1;
        teamOption.members = [];
      } else if (teamOption.flag === 1) {
        delete this.teamOptions[team_id];
      }
    } else {
      this.teamOptions[team_id] = {
        flag: 1,
        members: [],
        is_internal: team.is_internal,
        name: team.name
      };
    }
    this.changeTeamSearch();
  }

  changeTeamMemberOptions(team_id: string, event: User[]): void {
    let teamOption = this.teamOptions[team_id];
    if (teamOption) {
      if (event.length) {
        if (event.length === this.teamMembers[team_id].length) {
          this.teamOptions[team_id].flag = 1;
        } else {
          this.teamOptions[team_id].flag = 0;
        }
      } else {
        this.teamOptions[team_id].flag = -1;
      }
    } else {
      this.teamOptions[team_id] = {
        flag: 0,
        members: []
      };
      this.teamOptions[team_id].members = event;
      if (event.length) {
        if (event.length === this.teamMembers[team_id].length) {
          this.teamOptions[team_id].flag = 1;
        } else {
          this.teamOptions[team_id].flag = 0;
        }
      } else {
        this.teamOptions[team_id].flag = -1;
      }
    }
    teamOption = this.teamOptions[team_id];
    this.changeTeamSearch();
  }

  changeTeamSearch(): void {
    let teamOptions = JSON.parse(JSON.stringify(this.teamOptions));
    for (const key in teamOptions) {
      if (teamOptions[key].flag === -1) {
        delete teamOptions[key];
      } else {
        if (teamOptions[key].members && teamOptions[key].members.length) {
          const members = teamOptions[key].members.map((e) => e._id);
          teamOptions[key].name = teamOptions[key].members[0].user_name;
          teamOptions[key].members = members;
        }
      }
    }
    let isShareBy = this.isShareBy;
    let isShareWith = this.isShareWith;
    if (!(this.isShareBy || this.isShareWith)) {
      isShareBy = true;
      isShareWith = true;
    }
    if (Object.keys(teamOptions).length) {
      for (const key in teamOptions) {
        if (isShareBy) {
          if (
            !teamOptions[key].members ||
            !teamOptions[key].members.length ||
            teamOptions[key].members.length === this.teamMembers[key].length
          ) {
            teamOptions[key]['share_by'] = {
              flag: 1
            };
          } else {
            teamOptions[key]['share_by'] = {
              flag: 0,
              members: teamOptions[key].members
            };
          }
        } else {
          teamOptions[key]['share_by'] = {
            flag: -1,
            members: []
          };
        }
        if (isShareWith) {
          if (
            !teamOptions[key].members ||
            !teamOptions[key].members.length ||
            teamOptions[key].members.length === this.teamMembers[key].length
          ) {
            teamOptions[key]['share_with'] = {
              flag: 1
            };
          } else {
            teamOptions[key]['share_with'] = {
              flag: 0,
              members: teamOptions[key].members
            };
          }
        } else {
          teamOptions[key]['share_with'] = {
            flag: -1,
            members: []
          };
        }
        if (isShareWith && isShareBy) {
          teamOptions[key].flag = 1;
        } else if (isShareWith || isShareBy) {
          teamOptions[key].flag = 0;
        } else {
          teamOptions[key].flag = -1;
        }
        delete teamOptions[key].members;
      }
    } else {
      isShareBy = this.isShareBy;
      isShareWith = this.isShareWith;
      if (isShareBy || isShareWith) {
        teamOptions = JSON.parse(JSON.stringify(this.teamOptions));
        for (const key in this.teamOptions) {
          if (isShareBy) {
            teamOptions[key]['share_by'] = {
              flag: 1,
              members: []
            };
          } else {
            teamOptions[key]['share_by'] = {
              flag: -1,
              members: []
            };
          }
          if (isShareWith) {
            teamOptions[key]['share_with'] = {
              flag: 1,
              members: []
            };
          } else {
            teamOptions[key]['share_with'] = {
              flag: -1,
              members: []
            };
          }
          if (isShareBy && isShareWith) {
            teamOptions[key]['flag'] = 1;
          } else if (isShareBy || isShareWith) {
            teamOptions[key]['flag'] = 0;
          } else {
            teamOptions[key]['flag'] = -1;
          }
        }
      } else {
        teamOptions = {};
      }
    }
    this.searchOption.teamOptions = teamOptions;
  }

  enableTeamSearchOption(): boolean {
    if (Object.keys(this.searchOption.teamOptions).length) {
      return true;
    } else {
      return false;
    }
  }

  changeShareOption(option: string): void {
    if (option === 'share_with') {
      this.isShareWith = !this.isShareWith;
    } else {
      this.isShareBy = !this.isShareBy;
    }
    this.changeTeamSearch();
  }

  save(): void {
    this.filter.emit({
      teamOptions: this.searchOption.teamOptions
    });
  }
}
