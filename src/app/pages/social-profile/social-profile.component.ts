import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-social-profile',
  templateUrl: './social-profile.component.html',
  styleUrls: ['./social-profile.component.scss']
})
export class SocialProfileComponent implements OnInit, OnDestroy {
  user: User = new User();
  socialProfileSaving = false;
  saveSocialProfileSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    private userService: UserService,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  saveChange(): void {
    const social_link = this.user.social_link;
    this.socialProfileSaving = true;
    this.saveSocialProfileSubscription &&
      this.saveSocialProfileSubscription.unsubscribe();
    this.saveSocialProfileSubscription = this.userService
      .updateProfile({ social_link })
      .subscribe(
        () => {
          this.socialProfileSaving = false;
          // this.toast.success('Social Profile successfully updated.');
          this.userService.updateProfileImpl({ social_link });
        },
        () => {
          this.socialProfileSaving = false;
        }
      );
  }
}
