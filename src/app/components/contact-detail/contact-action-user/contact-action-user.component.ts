import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SspaService } from '../../../services/sspa.service';
import { UserService } from '@app/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact-action-user',
  templateUrl: './contact-action-user.component.html',
  styleUrls: ['./contact-action-user.component.scss']
})
export class ContactActionUserComponent implements OnInit, OnDestroy {
  @Input() user = null;
  userId = '';
  private _profileSubscription: Subscription;

  constructor(
    public sspaService: SspaService,
    private userService: UserService
  ) {
    this._profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (!profile._id) {
          return;
        }
        this.userId = profile._id;
        this._profileSubscription?.unsubscribe();
      }
    );
  }
  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._profileSubscription?.unsubscribe;
  }
}
