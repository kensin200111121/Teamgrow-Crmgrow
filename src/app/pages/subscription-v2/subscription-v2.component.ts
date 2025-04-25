import { SspaService } from '../../services/sspa.service';
import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  CANCEL_ACCOUNT_REASON,
  PACKAGE_LEVEL
} from '@constants/variable.constants';
import { PACKAGE } from '@constants/package.constant';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { getUserLevel } from '@utils/functions';
import { ERROR_STRINGS } from '@constants/strings.constant';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { PaymentCardComponent } from '@components/payment-card/payment-card.component';
import { Cookie } from '@utils/cookie';
import { HandlerService } from '@services/handler.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription-v2',
  templateUrl: './subscription-v2.component.html',
  styleUrls: ['./subscription-v2.component.scss']
})
export class SubscriptionV2Component implements OnInit {
  readonly PACKAGE_LEVEL = PACKAGE_LEVEL;
  readonly PACKAGE = PACKAGE;
  user: User = new User();
  planDuration = 'monthly';
  currentPackage = PACKAGE_LEVEL.GROWTH;
  selectedPackage = PACKAGE_LEVEL.GROWTH;
  growthPackage = PACKAGE_LEVEL.GROWTH;
  growthPlusTextPackage = PACKAGE_LEVEL.GROWTH_PLUS_TEXT;
  reasonButtons = CANCEL_ACCOUNT_REASON;
  constPackage = PACKAGE;
  selectedReason = this.reasonButtons[0];
  reasonFeedback = '';

  profileSubscription: Subscription;
  downgradeSubscription: Subscription;
  updatePackageSubscription: Subscription;
  cancelAccountSubscription: Subscription;
  packageLevel = '';
  isSuspended = false;
  isV1User = false;
  loadingCheckDowngrade = false;
  loadingUpdatePackage = false;
  loadingCancelAccount = false;
  isOverflow = false;
  overflowMessage = [];
  error_messages;
  statistics = {
    contact: {
      count: 0
    },
    material: {
      count: 0,
      record_duration: 0
    },
    automation: {
      count: 0
    },
    scheduler: {
      count: 0
    },
    assistant: {
      count: 0
    },
    calendar: {
      count: 0
    },
    landing_page: {
      count: 0
    }
  };
  card = null;
  step = 1;
  builer_token = '';
  pages = [];
  loadSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private myElement: ElementRef,
    public handlerService: HandlerService,
    private toastService: ToastrService,
    private router: Router,
    public sspaService: SspaService
  ) {
    this.userService.getPrimaryCard().subscribe((res) => {
      if (res && res.card) {
        this.card = res.card;
      }
    });

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          this.packageLevel = profile.package_level;
          this.isSuspended = profile.subscription?.is_failed;
          this.isV1User = profile.user_version == 1;
          this.currentPackage = PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
          this.selectedPackage = PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
        }
      }
    );
    this.userService.getUserStatistics().subscribe((res) => {
      if (res['status']) {
        this.statistics = res['data'];
      }
    });
  }

  ngOnInit(): void {
    this.builer_token = Cookie.get('_pages_session');
    if (this.builer_token) {
      this.userService.loadPages(this.builer_token, true);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.userService.pages$.subscribe((res) => {
        if (res['errors']) {
          this.toastService.error(
            res['errors'][0]?.message ||
              res['errors']?.message ||
              res['errors'] ||
              'Unknown third party error.'
          );
          return;
        } else {
          this.pages = res || [];
          this.statistics['landing_page']['count'] = this.pages.length;
        }
      });
    }
  }

  getUserLevel(): string {
    return getUserLevel(this.packageLevel);
  }

  editCard(): void {
    this.dialog
      .open(PaymentCardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        data: {
          card: this.card
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.data) {
          const card = res.data.card;
          this.card = {
            ...this.card,
            card_brand: card.brand,
            card_id: card.id,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            last4: card.last4,
            token: res.data.id,
            number: card.last4
          };

          if (this.isSuspended) {
            location.reload();
          }
        }
      });
  }

  selectPlan(level): void {
    this.selectedPackage = level;
    if (this.currentPackage.package === this.selectedPackage.package) {
      return;
    }

    if (this.selectedPackage === PACKAGE_LEVEL.GROWTH_PLUS_TEXT) {
      this.router.navigate([`/settings/sms`], {
        queryParams: { upgrade: 'true' }
      });
      return;
    }
    this.step = 2;
  }

  updatePackage(): void {
    const data = {
      level: this.selectedPackage.package.toUpperCase()
    };

    this.loadingUpdatePackage = true;
    this.updatePackageSubscription &&
      this.updatePackageSubscription.unsubscribe();
    this.updatePackageSubscription = this.userService
      .updatePackage(data)
      .subscribe((res) => {
        this.loadingUpdatePackage = false;
        if (res) {
          window.location.reload();
        }
      });
  }

  getPackageLabel(): string {
    if (this.currentPackage.package === 'GROWTH') {
      return 'Growth';
    } else if (this.currentPackage.package === 'GROWTH_PLUS_TEXT') {
      return 'Growth + Texting';
    }
    return 'Custom';
  }

  setDuration(): void {
    if (this.planDuration == 'monthly') {
      this.planDuration = 'annually';
    } else {
      this.planDuration = 'monthly';
    }
  }

  getTime(time: number): any {
    if (time) {
      return Math.ceil(time / 1000 / 60);
    } else {
      return 0;
    }
  }

  getExpireTime(): any {
    const createTime = new Date(this.user.created_at).getTime();
    const nowTime = Date.now();
    return Math.ceil(Math.abs(createTime - nowTime) / (1000 * 60 * 60 * 24));
  }

  getPackageType(): string {
    if (this.currentPackage && this.currentPackage.package) {
      if (this.currentPackage.package.indexOf('EVO') >= 0) {
        return 'EVO';
      }
    }
    return 'CRMGROW';
  }

  onBack(): void {
    this.step = 1;
  }

  cancelAccount(): void {
    this.step = 4;
    // const messageDialog = this.dialog.open(SubscriptionCancelReasonComponent, {
    //   width: '800px',
    //   maxWidth: '800px',
    //   data: {}
    // });
    // messageDialog['_overlayRef']['_host'].classList.add('top-dialog');
    // messageDialog.afterClosed().subscribe((res) => {
    //   if (res) {
    //   }
    // });
  }

  selectReason(reason): void {
    this.selectedReason = reason;
    this.step = 5;
  }

  sendFeedback(): void {
    const confirmDialog = this.dialog.open(ConfirmComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '450px',
      disableClose: true,
      data: {
        title: 'Confirm Cancel',
        message:
          'Cancelling your account pauses billing for 60 days. After 60 days all data will be deleted.',
        confirmLabel: 'Yes',
        cancelLabel: 'No'
      }
    });
    confirmDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingCancelAccount = true;
        const data = {
          close_reason: this.selectedReason,
          close_feedback: this.reasonFeedback
        };
        this.cancelAccountSubscription &&
          this.cancelAccountSubscription.unsubscribe();
        this.cancelAccountSubscription = this.userService
          .cancelAccount(data)
          .subscribe(
            (res) => {
              this.loadingCancelAccount = false;
              if (res) {
                Cookie.setLogout();
                localStorage.removeCrmItem('token');
                location.href = 'https://crmgrow.com/pricing.html';
                this.userService.logoutImpl();
                this.handlerService.clearData();
              }
            },
            (err) => {
              this.loadingCancelAccount = false;
            }
          );
      }
    });
  }

  getButtonLabel(): any {
    if (
      this.currentPackage.package == 'SLEEP' ||
      this.currentPackage.package == 'EVO_PRO' ||
      this.currentPackage.package == 'LITE'
    ) {
      return 'Upgrade plan';
    }
    if (
      this.currentPackage.package == 'EVO_ELITE' ||
      this.currentPackage.package == 'ELITE'
    ) {
      return 'Downgrade plan';
    }
    if (this.currentPackage.package == 'PRO') {
      if (this.selectedPackage.package == 'ELITE') {
        return 'Upgrade plan';
      } else {
        return 'Downgrade plan';
      }
    }
  }

  gotoBilling(): void {
    this.router.navigate([`/profile/billing`]);
  }
}
