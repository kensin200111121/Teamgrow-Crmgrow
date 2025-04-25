import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { UserService } from '@services/user.service';
import { Account, User } from '@app/models/user.model';

@Component({
  selector: 'app-avatar-team-members',
  templateUrl: './avatar-team-members.component.html',
  styleUrls: ['./avatar-team-members.component.scss']
})
export class AvatarTeamMembersComponent implements OnInit {
  memberDics: any;
  isInited = false;
  private _members: string[] = [];
  @Input()
  set members(values: string[]) {
    const difference = _.difference(values, this._members);
    if (difference.length) {
      this._members = values;
      if (this.isInited) {
        this.checkAvailables();
      }
    }
  }
  get members() {
    return this._members;
  }
  @Input('isSplit') isSplit = false;
  @Input('maxCount') maxCount = 2;
  @Input('width') width = 24;
  @Input('height') height = 24;
  @Input('space') space = -8;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.initData();
  }

  checkAvailables(): void {
    this._members = this._members.filter((e) => !!this.memberDics[e]);
  }

  initData(): void {
    this.userService.accounts$.subscribe((res) => {
      const subAccounts = res?.accounts;
      if (!subAccounts?.length) {
        return;
      }
      const self = this.userService.profile.getValue();
      const members = [...subAccounts];
      members.unshift(new Account().deserialize(self));
      this.memberDics = members.reduce((acc, curr) => {
        acc[curr['_id'].toString()] = curr;
        return acc;
      }, {});
      this.isInited = true;
      this.checkAvailables();
    });
  }
}
