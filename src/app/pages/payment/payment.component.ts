import { SspaService } from '../../services/sspa.service';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PaymentCardComponent } from '@components/payment-card/payment-card.component';
import {
  PACKAGE_LEVEL,
  CANCEL_ACCOUNT_REASON
} from '@constants/variable.constants';
import { getUserLevel } from '@utils/functions';
import { Payment } from '@models/payment.model';
import { HandlerService } from '@services/handler.service';
import { Router } from '@angular/router';
import { Cookie } from '@utils/cookie';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ERROR_STRINGS } from '@constants/strings.constant';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  user: User = new User();
  // UI Variables;
  loadingPayment = false;
  loadingInvoice = false;
  // New Card Information
  card = {
    card_name: '',
    number: '',
    cvc: '',
    exp_year: '',
    exp_month: '',
    card_brand: '',
    last4: '',
    plan_id: '',
    card_id: '',
    token: ''
  };

  @Input('selectedStep') selectedStep = 1;
  invoices = [];
  saving = false;

  profileSubscription: Subscription;
  currentPackage = PACKAGE_LEVEL.PRO;
  selectedPackage = PACKAGE_LEVEL.PRO;
  litePackage = PACKAGE_LEVEL.LITE;
  proPackage = PACKAGE_LEVEL.PRO;
  elitePackage = PACKAGE_LEVEL.ELITE;
  customPackage = PACKAGE_LEVEL.CUSTOM;
  evoProPackage = PACKAGE_LEVEL.EVO_PRO;
  evoElitePackage = PACKAGE_LEVEL.EVO_ELITE;

  packageLevel = '';
  step = 1;
  isShowAll = false;

  previewCardNumber = '';
  reasonButtons = CANCEL_ACCOUNT_REASON;
  selectedReason = this.reasonButtons[0];
  reasonFeedback = '';

  cancelAccountSubscription: Subscription;
  updatePackageSubscription: Subscription;
  downgradeSubscription: Subscription;
  loadingCancelAccount = false;
  loadingUpdatePackage = false;
  isSuspended = false;
  isV1User = false;
  isOverflow = false;
  overflowMessage = [];
  loadingCheckDowngrade = false;
  error_messages;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    public handlerService: HandlerService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.step = this.selectedStep;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          if (profile.payment) {
            this.packageLevel = profile.package_level;
            this.isSuspended = profile.subscription?.is_failed;
            this.isV1User = profile.user_version == 1;
            this.currentPackage =
              PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
            this.selectedPackage =
              PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
            // this.currentPackage = PACKAGE_LEVEL['EVO_PRO'];
            // this.selectedPackage = PACKAGE_LEVEL['EVO_PRO'];
            if (this.user.is_primary) {
              this.loadingPayment = true;
              this.userService.loadPayment(profile.payment);
              this.userService.payment$.subscribe(
                (res) => {
                  this.loadingPayment = false;
                  if (res) {
                    this.card = {
                      ...res,
                      number: res.last4
                    };
                    this.previewCardNumber =
                      '•••• •••• •••• ' + this.card.number;
                  }
                },
                () => {
                  this.loadingPayment = false;
                }
              );
            }
          } else {
            this.loadingPayment = false;
          }
        }
      }
    );
    this.getInvoice();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  getUserLevel(): string {
    return getUserLevel(this.packageLevel);
  }

  getInvoice(): void {
    this.loadingInvoice = true;
    this.userService.loadInvoice({});
    this.userService.invoice$.subscribe(
      (res) => {
        this.loadingInvoice = false;
        if (res && res['status']) {
          this.invoices = res['data'];
        }
      },
      () => {
        this.loadingInvoice = false;
      }
    );
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

          this.previewCardNumber = '•••• •••• •••• ' + this.card.number;
          if (this.isSuspended) {
            location.reload();
          }
        }
      });
  }

  changePlan(): void {
    this.step = 2;
  }

  onBack(): void {
    this.step -= 1;
  }

  onBackFirst(): void {
    this.step = 1;
  }

  cancelAccount(): void {
    this.step = 4;
  }

  selectPlan(level): void {
    this.selectedPackage = level;
    if (this.currentPackage.package === this.selectedPackage.package) {
      return;
    }
    this.downgradeSubscription && this.downgradeSubscription.unsubscribe();
    this.loadingCheckDowngrade = true;
    this.downgradeSubscription = this.userService
      .checkDowngrade(this.selectedPackage.package)
      .subscribe((res) => {
        this.loadingCheckDowngrade = false;
        if (res && res.status === false) {
          if (res.type && res.type === 'other') {
            this.isOverflow = true;
            this.overflowMessage = res.data;
            res.data.forEach((error) => {
              if (this.selectedPackage.package.includes('PRO')) {
                this.error_messages = ERROR_STRINGS.PRO;
                this.error_messages[error.type] = this.error_messages[
                  error.type
                ].replace('{{PRO}}', error.limit);
              } else {
                this.error_messages = ERROR_STRINGS.LITE;
                this.error_messages[error.type] = this.error_messages[
                  error.type
                ].replace('{{LITE}}', error.limit);
              }
            });
          } else if (res.type && res.type === 'sms') {
            this.error_messages = ERROR_STRINGS.LITE;
            const confirmDialog = this.dialog.open(ConfirmComponent, {
              position: { top: '100px' },
              width: '100vw',
              maxWidth: '450px',
              disableClose: true,
              data: {
                title: 'Confirm Downgrade',
                message: this.error_messages[res.data[0].type],
                confirmLabel: 'Downgrade'
              }
            });
            confirmDialog.afterClosed().subscribe((result) => {
              if (result) {
                this.step = 3;
              }
            });
          }
        } else {
          this.isOverflow = false;
          this.overflowMessage = [];
          this.step = 3;
        }
      });
  }

  clickPackage(level): void {
    this.selectedPackage = level;
  }

  planButtonLabel(level): string {
    if (level === this.currentPackage.package) {
      return 'Your Plan';
    } else {
      if (level === PACKAGE_LEVEL.LITE.package) {
        if (this.currentPackage.package === PACKAGE_LEVEL.CUSTOM.package) {
          return 'Get Lite';
        } else {
          return 'Downgrade';
        }
      } else if (level === PACKAGE_LEVEL.PRO.package) {
        if (
          this.currentPackage.package === PACKAGE_LEVEL.LITE.package ||
          this.currentPackage.package === PACKAGE_LEVEL.CUSTOM.package
        ) {
          return 'Get Pro';
        } else {
          return 'Downgrade';
        }
      } else if (level === PACKAGE_LEVEL.ELITE.package) {
        return 'Get Elite';
      } else if (level === PACKAGE_LEVEL.CUSTOM.package) {
        return 'Contact us';
      } else if (level === PACKAGE_LEVEL.EVO_PRO.package) {
        return 'Downgrade';
      } else if (level === PACKAGE_LEVEL.EVO_ELITE.package) {
        return 'Get EVO Elite';
      }
    }
  }

  showAllFeatures(): void {
    this.isShowAll = !this.isShowAll;
  }

  selectReason(reason): void {
    this.selectedReason = reason;
    this.step = 5;
  }

  getPackageLabel(): string {
    if (this.currentPackage.package === 'LITE') {
      return 'Lite';
    } else if (this.currentPackage.package === 'PRO') {
      return 'Professional';
    } else if (this.currentPackage.package === 'ELITE') {
      return 'Elite';
    } else if (this.currentPackage.package === 'EVO_PRO') {
      return 'EVO Professional';
    } else if (this.currentPackage.package === 'EVO_ELITE') {
      return 'EVO Elite';
    }
    return 'Custom';
  }

  sendFeedback(): void {
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

  updatePackage(): void {
    let level = '';
    if (this.selectedPackage.package === 'lite') {
      level = 'BASIC';
    } else {
      level = this.selectedPackage.package.toUpperCase();
    }
    const data = {
      level
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

  getPackageType(): string {
    if (this.currentPackage && this.currentPackage.package) {
      if (this.currentPackage.package.indexOf('EVO') >= 0) {
        return 'EVO';
      }
    }
    return 'CRMGROW';
  }

  getRecordingDuration(time: number): string {
    const duration = Math.floor(time / 60000);
    return duration + ' min';
  }
}
