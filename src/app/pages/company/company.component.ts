import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddUserComponent } from '@components/add-user/add-user.component';
import { Account, User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogSettings,
  TIME_ZONE_NAMES,
  VOLUME
} from '@constants/variable.constants';
import * as _ from 'lodash';
import { BuyAccountComponent } from '@components/buy-account/buy-account.component';
import { Router } from '@angular/router';
import { navigateToUrl } from 'single-spa';
import { FormatProfileComponent } from '@components/format-profile/format-profile.component';
import { AccountSettingComponent } from '@components/account-setting/account-setting.component';
import { AccountPasswordComponent } from '@components/account-password/account-password.component';
import { EditUserComponent } from '@components/edit-user/edit-user.component';
import { environment } from '@environments/environment';
import { TeamService } from '@app/services/team.service';
import { Team } from '@app/models/team.model';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit, OnDestroy {
  readonly isSspa = environment.isSspa;
  readonly TIME_ZONE_NAMES = TIME_ZONE_NAMES;
  VOLUME = VOLUME;
  ACTIONS = [
    {
      label: 'Merge Accounts',
      loadingLabel: '',
      type: 'button',
      icon: 'i-merge',
      command: 'merge',
      loading: false
    }
  ];
  DISPLAY_COLUMNS = [
    'account_name',
    'account_company',
    'account_email',
    'account_phone',
    'account_timezone',
    'account_seat',
    'action'
  ];
  seatLimit = 0;
  hasSeat = false;
  userList: Account[] = [];
  defaultUser: User = new User();
  profileSubscription: Subscription;
  accountSubscription: Subscription;
  primaryAccountSubscription: Subscription;
  queryParamSubscription: Subscription;
  preloadSubscription: Subscription;

  loading = false;
  userLoading = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,

    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.userLoading = true;
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.defaultUser = profile;
          this.userLoading = false;
          if (!profile.organization_info?.is_owner) {
            this.isSspa
              ? navigateToUrl('/account/profile')
              : this.router.navigate(['/profile/general']);
            return;
          }
          this.initPreload();

          if (profile['is_primary']) {
            this.getUserList();
          } else {
            this.isSspa
              ? navigateToUrl('/account/profile')
              : this.router.navigate(['/profile/general']);
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.preloadSubscription && this.preloadSubscription.unsubscribe();
  }

  initPreload(): void {
    this.preloadSubscription && this.preloadSubscription.unsubscribe();
    this.preloadSubscription = this.userService.accounts$.subscribe(
      (accountInfo) => {
        if (!accountInfo) {
          this.userList = [];
          return;
        }
        const { accounts, limit } = accountInfo;
        if (accounts && accounts.length) {
          this.userList = [];
          this.seatLimit = limit || 0;
          let used_seat = 0;
          accounts.forEach((e) => {
            this.userList.push(new Account().deserialize(e));
            used_seat += e.equal_account || 1;
          });

          this.preloadSubscription && this.preloadSubscription.unsubscribe();
          this.sortAccounts(false);
        }
      }
    );
  }

  getUserList(): void {
    this.loading = true;
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountSubscription = this.userService
      .getSubAccount()
      .subscribe((res) => {
        this.loading = false;
        this.userList = [new Account().deserialize({ ...this.defaultUser })];
        let accountCount = 1;
        this.seatLimit = 1;

        if (res && res['status'] && res['data']) {
          if (res['data']['users'] && res['data']['users'].length) {
            res['data']['users'].forEach((user) => {
              const account = new Account().deserialize(user);
              this.userList.push(account);
              accountCount += 1;
            });
          }
          this.sortAccounts();
        }
      });
  }

  getAvatarName(name: any): any {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UC';
  }

  newAccount(): void {
    this.dialog
      .open(AddUserComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['profile']) {
          const profile = res.profile;

          console.log(this.userList.length);
          this.dialog
            .open(BuyAccountComponent, {
              width: '480px',
              data: profile
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                const newAccount = new Account().deserialize(res['user']);
                const accountsData = this.userService.accounts.getValue();
                this.userService.accounts.next({
                  accounts: [...accountsData.accounts, newAccount],
                  limit: accountsData.limit + 1
                });
                this.userList.push(newAccount);
              }
            });
        }
      });
  }

  deleteAccount(user: Account): void {
    let dialog;
    if (!user?.can_restore_seat) {
      dialog = this.dialog.open(FormatProfileComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'format_profile_title_1',
          message: 'format_profile_message_2',
          confirmLabel: 'Confirm',
          account: user
        }
      });
    } else {
      dialog = this.dialog.open(FormatProfileComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'format_profile_title_1',
          message: 'format_profile_message_1',
          confirmLabel: 'Confirm',
          account: user
        }
      });
    }
    dialog.afterClosed().subscribe((res) => {
      if (res && res['status']) {
        const idx = this.userList.findIndex((e) => {
          e._id === user._id;
        });
        this.userList.splice(idx, 1);
        this.userService.accounts.next({
          accounts: [...this.userList],
          limit: this.userList.length + 1
        });
      }
    });
  }

  editAccount(user): void {
    // Changed AddUserComponent to EditUserComponent by sylla
    this.dialog
      .open(EditUserComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          editUser: user,
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userList.some((e, index) => {
            if (e._id === user._id) {
              this.userList.splice(
                index,
                1,
                new Account().deserialize({ ...user, ...res, _id: user._id })
              );
              return true;
            }
          });
          this.userList = [...this.userList];
          this.sortAccounts();
          this.userService.accounts.next({
            accounts: [...this.userList],
            limit: this.userList.length + 1
          });
        }
      });
  }

  async settingAccount(user): Promise<void> {
    this.dialog
      .open(AccountSettingComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          is_team: false,
          user
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          user = res;
        }
      });
  }

  async settingTeam(): Promise<void> {
    this.dialog
      .open(AccountSettingComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          is_team: true
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          //user = res;
        }
      });
  }

  sortAccounts(emit = true): void {
    this.userList.sort((a, b) => {
      if (a.is_primary) {
        return -1;
      } else if (a.is_seat) {
        return 1;
      }
      if (b.is_primary) {
        return 1;
      }
      if (a._id > b._id) {
        return -1;
      }
      return 1;
    });

    const accounts = this.userList.filter((e) => !e.is_seat);
    if (emit) {
      this.userService.accounts.next({ accounts, limit: this.seatLimit });
    }

    let usedAccount = 0;
    accounts.forEach((e) => {
      usedAccount += 1;
    });
    this.hasSeat = this.seatLimit - usedAccount ? true : false;
  }

  async changePassword(user): Promise<void> {
    this.dialog
      .open(AccountPasswordComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '300px',
        disableClose: true,
        data: {
          user
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          user = res;
        }
      });
  }

  getRecordingDuration(time: number): string {
    const duration = Math.floor(time / 60000);
    return duration + ' min';
  }
}
