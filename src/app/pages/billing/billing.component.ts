import { SspaService } from '../../services/sspa.service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { PACKAGE_LEVEL } from '@constants/variable.constants';
import { getUserLevel } from '@utils/functions';
import { CardComponent } from '@components/card/card.component';
import { PaymentCardComponent } from '@components/payment-card/payment-card.component';
import { SubscriptionCancelReasonComponent } from '@components/subscription-cancel-reason/subscription-cancel-reason.component';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { TabItem } from '@utils/data.types';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import moment from 'moment-timezone';
import { async } from '@angular/core/testing';

const INTERVALS = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  year: 'yearly'
};

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  user: User = new User();
  loadingPayment = false;
  loadingInvoice = false;
  cards = [];
  invoices = [];
  firstInvoice = null;
  pageSize = 20;
  hasNextPage = false;
  tabs: TabItem[] = [
    { label: 'Payment methods', id: 'methods', icon: '' },
    { label: 'Invoices', id: 'invoices', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  currentPackage = PACKAGE_LEVEL.PRO;
  packageLevel = '';
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
  previewCardNumber = '';
  profileSubscription: Subscription;

  currentPeriodStartAt: string;
  currentPeriodEndAt: string;

  amount = 0;
  currency = 'usd';
  interval = 'monthly';

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    public sspaService: SspaService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.getCards().subscribe((res) => {
      this.cards = res.cards;
    });
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          if (profile.payment) {
            this.loadingPayment = true;
            this.packageLevel = profile.package_level;
            this.currentPackage =
              PACKAGE_LEVEL[getUserLevel(profile.package_level)];
            this.userService.loadPayment(profile.payment);
            this.userService.payment$.subscribe(
              (res) => {
                this.loadingPayment = false;
                if (res) {
                  this.currentPeriodStartAt = moment
                    .unix(res.data.subscription.current_period_start)
                    .format('MMMM Do YYYY, h:mm a');
                  this.currentPeriodEndAt = moment
                    .unix(res.data.subscription.current_period_end)
                    .format('MMMM Do YYYY, h:mm a');
                  this.amount = res.data.subscription.amount / 100.0;
                  this.currency = res.data.subscripition.currency;
                  this.interval = INTERVALS[res.data.subscription.interval];
                }
              },
              () => {
                this.loadingPayment = false;
              }
            );
          } else {
            this.loadingPayment = false;
          }
        }
      }
    );
    this.getInvoice();
  }

  cancelAccount(): void {
    // this.step = 4;
    const allAccounts = this.userService.accounts.getValue();
    if (this.user.is_primary && allAccounts.accounts.length > 1) {
      this.dialog.open(ConfirmComponent, {
        maxWidth: '400px',
        width: '96vw',
        position: { top: '100px' },
        data: {
          title: 'Warning',
          message:
            'You can not cancel this primary account until you close your sub-accounts <a href="https://app.crmgrow.com/profile/account">here</a>.',
          hideCancel: true
        }
      });
    } else {
      const messageDialog = this.dialog.open(
        SubscriptionCancelReasonComponent,
        {
          width: '800px',
          maxWidth: '800px',
          disableClose: true,
          data: {}
        }
      );
      messageDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
      messageDialog.afterClosed().subscribe((res) => {
        if (res) {
        }
      });
    }
  }

  getInvoice(): void {
    // this.userService.invoice$.subscribe(
    //   (res) => {
    //     this.loadingInvoice = false;
    //     if (res && res['status']) {
    //       this.invoices = res['data'];
    //     }
    //   },
    //   () => {
    //     this.loadingInvoice = false;
    //   }
    // );
    this.loadInvoice();
  }

  loadInvoice(mode = ''): void {
    if (this.loadingInvoice) {
      return;
    }
    const req = {};
    if (mode === 'PREV') {
      req['ending_before'] = this.invoices[0]['id'];
    } else if (mode === 'NEXT') {
      req['starting_after'] = this.invoices.slice(-1)[0]['id'];
    }
    this.loadingInvoice = true;
    this.userService.loadInvoiceImpl(req).subscribe((res) => {
      this.loadingInvoice = false;
      const list = res['data'] || [];
      if (list.length) {
        this.invoices = res['data'] || [];
        this.hasNextPage = true;
      } else {
        this.hasNextPage = false;
      }
      if (!mode) {
        this.firstInvoice = this.invoices[0];
      }
    });
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  addCard(): void {
    this.dialog
      .open(CardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        data: {
          card: null,
          is_add: true
        }
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res && res.card) {
          this.cards.push(res.card);
          if (this.cards.length === 1) {
            location.reload();
          }
        }
      });
  }

  setPrimary(card): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '400px',
        width: '96vw',
        position: { top: '100px' },
        data: {
          title: 'Confirm',
          message: 'Do want to set this card as the primary one?',
          hideCancel: false
        }
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          await this.userService
            .setPrimaryCard(card.card_id)
            .toPromise()
            .then((res) => {
              this.cards.forEach((c) => {
                c._id !== card._id && c.is_primary && (c.is_primary = false);
                c._id === card._id && (c.is_primary = true);
              });
            });
        }
      });
  }

  deleteCard(card): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '400px',
        position: { top: '100px' },
        data: {
          title: 'Confirm',
          message: 'Do you want to delete this card?',
          hideCancel: false
        }
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          await this.userService
            .deleteCard(card.card_id)
            .toPromise()
            .then((res) => {
              const index = this.cards.findIndex((c) => c._id === card._id);
              this.cards.splice(index, 1);
            });
        }
      });
  }

  updateCard(card): void {
    this.dialog
      .open(CardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        data: {
          card,
          is_add: false
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.cards.forEach((c) => {
            if (c._id === card._id) {
              c.exp_year = res.exp_year;
              c.exp_month = res.exp_month;
            }
          });
        }
      });
  }
}
