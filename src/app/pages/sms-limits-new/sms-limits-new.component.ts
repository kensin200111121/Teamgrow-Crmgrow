import { Component, OnDestroy, OnInit } from '@angular/core';
import { openSettings, init } from '@wavv/messenger';
import { addOverlayVisibleListener } from '@wavv/messenger';
import { UserService } from '@app/services/user.service';
import { SspaService } from '@app/services/sspa.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SmsSubscribeComponent } from '@app/components/sms-subscribe/sms-subscribe.component';
import { PurchaseMessageComponent } from '@app/components/purchase-message/purchase-message.component';
import { ConnectService } from '@app/services/connect.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sms-limits-new',
  templateUrl: './sms-limits-new.component.html',
  styleUrls: ['./sms-limits-new.component.scss']
})
export class SmsLimitsNewComponent implements OnInit, OnDestroy {
  isLoading = false;
  isSetting = false;
  sourceFromVortex = false;
  shouldShowSetting = false;

  phoneNumber = null;
  subscriptionState = false;
  brandState = 'None';
  enable = false;
  profileSubscription: Subscription;
  queryParamSubscription: Subscription;
  isCheckingWavvId = true;
  subscriptionDialog = null;
  leftSms = 0;
  isUpgrade = false;
  user_version = 0;

  private dialer_token: string;

  get isApprovedBrand(): boolean {
    return this.brandState === 'APPROVED';
  }

  get isFailedBrand(): boolean {
    return this.brandState === 'FAILED';
  }

  get isNoneBrand(): boolean {
    return this.brandState === 'NONE';
  }

  get isAllSet(): boolean {
    return (
      !this.sourceFromVortex &&
      this.brandState === 'APPROVED' &&
      this.phoneNumber
    );
  }

  constructor(
    private userService: UserService,
    public sspaService: SspaService,
    private connectService: ConnectService,
    private dialog: MatDialog,

    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      this.isUpgrade = params['upgrade'] === 'true';
    });
    addOverlayVisibleListener(({ visible }) => {
      if (!visible) {
        this.fetchWavvState();
      }
    });

    this.profileSubscription && this.profileSubscription.unsubscribe();

    this.shouldShowSetting = false;

    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (!profile._id) {
          return;
        }
        this.user_version = profile.user_version;
        this.dialer_token = profile.dialer_token;

        this.sourceFromVortex = profile.source === 'vortex';
        if (this.sourceFromVortex) {
          this.connectService.getWavvIDForVortex().subscribe((res) => {
            if (res && res['data']) {
              this.fetchWavvState();
              this.enable = true;
            } else {
              this.enable = false;
            }
            this.isCheckingWavvId = false;
            if (this.isUpgrade) this.subscribe();
          });
        } else {
          this.fetchWavvState();
          this.enable = profile.is_primary;
          this.isCheckingWavvId = false;
          if (this.isUpgrade) this.subscribe();
          if (profile.text_info.is_limit) {
            const maxCount = profile.text_info?.max_count || 250;
            const usedCount =
              (profile.text_info?.count || 0) +
              (profile.text_info.subaccount_used_count || 0);
            const additionalCount =
              profile.text_info?.additional_credit?.amount || 0;
            if (usedCount < maxCount) {
              this.leftSms = maxCount - usedCount + additionalCount;
            } else {
              this.leftSms = additionalCount;
            }
          } else {
            this.leftSms = 0;
          }
        }
      }
    );
  }

  openWavvSettings(withInit = false): void {
    if (!withInit) {
      openSettings();
      return;
    }
    init({ token: this.dialer_token })
      .then(() => {
        console.log('succeed in messenger initialization');
        openSettings();
      })
      .catch((err) => {
        console.error('initialization is failed with error', err.message);
      });
  }

  fetchWavvState(): void {
    this.isLoading = true;
    this.connectService.getWavvState().subscribe((res) => {
      this.isLoading = false;
      const data = res['data'];
      if (data?.subscriptions) {
        this.subscriptionState = data.subscriptions.sms;
        if (this.subscriptionState && this.shouldShowSetting) {
          this.openWavvSettings(true);
        }
      }
      if (data?.brandStatus) {
        this.brandState = data.brandStatus.status || 'NONE';
      }
      if (data?.number) {
        this.phoneNumber = data.number;
      }
      this.shouldShowSetting = false;
    });
  }

  subscribe(): void {
    if (this.enable) {
      if (this.sourceFromVortex) {
        const data = {
          subscriptions: { sms: true, smsBrandRegistration: true }
        };
        this.isSetting = true;
        this.connectService.updateSubscriptionState(data).subscribe((data) => {
          this.isSetting = false;
          this.shouldShowSetting = true;
          this.fetchWavvState();
        });
      } else {
        this.subscriptionDialog = this.dialog
          .open(SmsSubscribeComponent, {
            width: '90vw',
            maxWidth: '720px',
            disableClose: true,
            data: {
              phoneNumber: this.phoneNumber,
              subscriptionState: this.subscriptionState,
              brandState: this.brandState,
              isVortex: this.sourceFromVortex,
              user_version: this.user_version
            }
          })
          .afterClosed()
          .subscribe((res) => {
            this.subscriptionDialog = null;
          });
      }
    }
  }

  purchase(): void {
    this.dialog
      .open(PurchaseMessageComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userService.loadProfile().subscribe((profile) => {
            if (profile) {
              if (profile.text_info.is_limit) {
                if (profile.text_info?.additional_credit) {
                  this.leftSms =
                    profile.text_info.max_count -
                    (profile.text_info.count +
                      (profile.text_info.subaccount_used_count || 0));
                  profile.text_info.additional_credit.amount;
                } else {
                  this.leftSms =
                    profile.text_info.max_count - profile.text_info.count;
                }
              } else {
                this.leftSms = 0;
              }
            }
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
  }
}
