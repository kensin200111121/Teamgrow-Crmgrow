import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { STRIPE_KEY } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { StripeScriptTag, StripeCard } from 'stripe-angular';
import { ConnectService } from '@app/services/connect.service';
@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  is_add = true;
  saving = false;
  card = null;
  exp_year: number;
  exp_month: number;
  all_months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  months = [];
  years = [];
  invalidError = 'require';
  captchaToken = '';
  submitted = false;
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

  constructor(
    private dialogRef: MatDialogRef<CardComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private connectService: ConnectService,
    private stripeScriptTag: StripeScriptTag,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {
    const now = new Date();
    const now_year = now.getFullYear();
    const now_month = now.getMonth();
    for (let i = now_year; i < now_year + 30; i++) this.years.push(i);

    if (this.data) {
      this.is_add = this.data.is_add;
      if (!this.is_add && this.data.card) {
        this.card = this.data.card;
        this.exp_year = this.card.exp_year;
        this.exp_month = this.card.exp_month;
        this.changeYear();
      }
    }
    if (!this.stripeScriptTag.StripeInstance) {
      this.stripeScriptTag.setPublishableKey(STRIPE_KEY);
    }
  }

  ngOnInit(): void {}

  async submitCard(): Promise<void> {
    this.submitted = true;
    if (!this.captchaToken) return;
    this.saving = true;
    try {
      let res = {};
      if (this.is_add) {
        const token = await this.stripeCard.createToken({});
        if (!token) throw new Error('Invalid card');
        res = await this.connectService
          .addCard(token, this.captchaToken)
          .toPromise()
          .catch((err) => {
            throw new Error('Card created falied');
          });
        this.dialogRef.close(res);
      } else {
        res = await this.connectService
          .updateCard({
            card_id: this.card.card_id,
            exp_year: this.exp_year,
            exp_month: this.exp_month
          })
          .toPromise()
          .catch((err) => {
            throw new Error('Card updated falied');
          });
        this.dialogRef.close({
          exp_year: this.exp_year,
          exp_month: this.exp_month
        });
      }
    } catch (err) {
      this.toast.error(err.message);
      this.dialogRef.close();
    }
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
  changeYear() {
    const now = new Date();
    const now_year = now.getFullYear();
    const now_month = now.getMonth();
    this.months =
      now_year.toString() === this.exp_year.toString()
        ? (this.months = this.all_months.filter((x) => x > now.getMonth()))
        : (this.months = this.all_months);

    this.exp_month =
      this.exp_year === now_year && this.card.exp_month < now_month
        ? now_month
        : this.card.exp_month;
  }
}
