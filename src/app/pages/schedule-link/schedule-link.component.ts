import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { SCHEDULE_DEMO } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule-link',
  templateUrl: './schedule-link.component.html',
  styleUrls: ['./schedule-link.component.scss']
})
export class ScheduleLinkComponent implements OnInit {
  profileSubscription: Subscription;
  isSaving = false;
  orgLink = '';
  initiated = false;
  myLink = '';
  constructor(public userService: UserService) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.orgLink = profile.nick_name;
          if (!this.initiated) {
            this.myLink = this.orgLink;
            this.initiated = true;
          }
        }
      }
    );
  }

  ngOnInit(): void {}

  onSaveMyLink(): void {
    this.isSaving = true;
    this.userService.onUpdateMyLink(this.myLink).subscribe((res) => {
      this.isSaving = false;
      if (res.status) {
        const profile = this.userService.profile.getValue();
        profile.nick_name = this.myLink;
        this.userService.profile.next(profile);
      }
    });
  }
}
