import { SspaService } from '../../services/sspa.service';
import { Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MONTH, STRIPE_KEY, YEAR } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { StripeScriptTag, StripeCard } from 'stripe-angular';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-payment-card',
  templateUrl: './payment-card.component.html',
  styleUrls: ['./payment-card.component.scss']
})
export class PaymentCardComponent implements OnInit {
  saving = false;
  proceedLoading = false;
  planId = '';
  isStep = 1;
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
  sleep_mode = false;
  previewCardNumber = '';

  invalidError = 'require';
  @ViewChild('stripeCard') stripeCard: StripeCard;
  stripeOptions = {
    classes: {
      base: 'stripe-card form-control',
      complete: '',
      empty: '',
      focus: '',
      invalid: '',
      webkitAutofill: ''
    },
    hidePostalCode: true,
    hideIcon: false,
    iconStyle: 'solid',
    style: {},
    value: {
      postalCode: ''
    },
    disabled: false
  };

  profile;
  fprInfo;
  sleepAccountSubscription: Subscription;
  constructor(
    private dialogRef: MatDialogRef<PaymentCardComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private userService: UserService,
    private stripeScriptTag: StripeScriptTag,
    private ngZone: NgZone,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {
    if (!this.stripeScriptTag.StripeInstance) {
      this.stripeScriptTag.setPublishableKey(STRIPE_KEY);
    }
    if (this.data && this.data.card) {
      this.planId = this.data.card.plan_id;
    }
    if (this.data && this.data.sleep_mode) {
      this.sleep_mode = this.data.sleep_mode;
    }
    this.profile = this.userService.profile.getValue();
    // this.userService.profile$.subscribe((profile) => {
    //   if (profile && profile._id) {
    //   }
    // });
    this.userService.loadPayment(this.profile.payment);
    this.userService.payment$.subscribe((payment) => {
      if (payment && payment._id) {
        this.card = {
          ...payment,
          number: payment.last4
        };
        this.previewCardNumber = '•••• •••• •••• ' + this.card.number;
        this.isStep = 1;
      } else {
        this.isStep = 2;
      }
    });
    if (
      window['fpr'] &&
      this.profile &&
      this.profile.pre_loaded &&
      this.profile.affiliate?.ref_id
    ) {
      window['fpr']('set', {
        ref_id: this.profile.affiliate?.ref_id,
        include_details: true
      });
      window['fpr']('click');
      window['fpr']('getDetails', (d) => {
        this.fprInfo = d;
      });
    }
  }

  ngOnInit(): void {}

  proceed_sleep(): void {
    this.proceedLoading = true;
    this.sleepAccountSubscription &&
      this.sleepAccountSubscription.unsubscribe();
    this.sleepAccountSubscription = this.userService.sleepAccount().subscribe(
      (res) => {
        if (res?.status) {
          this.dialogRef.close({ status: true });
        }
        this.proceedLoading = false;
      },
      (err) => {
        this.proceedLoading = false;
        this.isStep = 2;
      }
    );
  }

  proceed_plan(): void {
    this.proceedLoading = true;
    this.userService.proceedInvoice().subscribe((res) => {
      this.proceedLoading = false;
      if (res.status) {
        this.dialogRef.close({ status: true });
      } else {
        this.isStep = 2;
      }
    });
  }

  editPayment(): void {
    this.saving = true;
    this.stripeCard
      .createToken({})
      .then((res) => {
        if (res) {
          const data = {
            token: {
              ...res
            },
            plan_id: this.planId
          };
          this.ngZone.run(() => {
            if (this.fprInfo?.offer) {
              data['offer'] = this.fprInfo?.offer;
            }
            this.userService.updatePayment(data).subscribe((result) => {
              this.saving = false;
              if (result && result.status) {
                if (window['fpr']) {
                  window['fpr']('referral', {
                    _id: this.profile?._id,
                    email: this.profile?.email,
                    user_name: this.profile?.user_name
                  });
                }
                // this.toast.success(
                //   'Your Billing Information is updated successfully.'
                // );
                this.userService
                  .onAddedPaymentToSubAccount()
                  .subscribe((result) => {
                    if (result.status) {
                      // to do something
                    }
                  });
                this.userService
                  .updateProfile({ pre_loaded: false })
                  .subscribe(() => {
                    this.dialogRef.close({ data: res, status: true });
                  });
              } else {
                this.dialogRef.close();
              }
            });
          });
        } else {
          this.ngZone.run(() => {
            this.saving = false;
            this.toast.error(
              'Your card information is not correct. Please try again.'
            );
            this.dialogRef.close();
          });
        }
      })
      .catch((err) => {
        if (err) {
          this.toast.error(err.message);
        }
        this.dialogRef.close();
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  cardInvalid(evt: any): void {
    if (evt && evt?.type === 'validation_error') {
      this.invalidError = 'invalid';
    } else {
      this.invalidError = '';
    }
  }

  cardComplete(evt: any): void {
    if (evt) {
      this.invalidError = '';
    } else {
      this.invalidError = 'invalid';
    }
  }
}
