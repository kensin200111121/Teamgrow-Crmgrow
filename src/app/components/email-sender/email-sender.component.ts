import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Alias } from '@utils/data.types';
import { initData } from '@utils/functions';

@Component({
  selector: 'app-email-sender',
  templateUrl: './email-sender.component.html',
  styleUrls: ['./email-sender.component.scss']
})
export class EmailSenderComponent implements OnInit, OnDestroy {
  primary: Alias;
  list: Alias[] = [];
  profileSubscription: Subscription;

  @Output() onChange = new EventEmitter();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (!user?._id) return;
      const defaultAlias = {
        email: user.connected_email,
        name: user.user_name
      };
      const aliasList = user.email_alias;
      const { list, primary } = initData(defaultAlias, aliasList);
      this.list = list;
      this.change(primary);
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  /**
   * Emit the event on init and change
   * @param alias: Selected primary alias
   */
  change(alias: Alias): void {
    this.primary = alias;
    this.onChange.emit(alias);
  }
}
