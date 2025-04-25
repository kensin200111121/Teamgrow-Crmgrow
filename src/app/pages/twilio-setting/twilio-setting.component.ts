import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AddPhoneComponent } from '@components/add-phone/add-phone.component';
import { SmsService } from '@services/sms.service';
import { UserService } from '@services/user.service';
import {
  BrandCampaign,
  StandardBrandRes,
  StarterBrandRes,
  TwilioAccount
} from '@utils/data.types';

enum STEP {
  HAS_TWILIO = 'has_twilio_confirm',
  TWILIO_FORM = 'twilio_form',
  CAPACITY_FORM = 'text_capacity_form',
  HIGH_CAPACITY = 'high_capacity',
  LOW_CAPACITY = 'low_capactiy',
  TWILIO_SUB_ACCOUNT = 'twilio_sub_account',
  STARTER_BRAND_FORM = 'starter_brand_form',
  STANDARD_BRAND_FORM = 'standard_brand_form',
  SELECT_NUMBER = 'select_number',
  CAMPAIGN_FORM = 'new_campaign_form'
}

@Component({
  selector: 'app-twilio-setting',
  templateUrl: './twilio-setting.component.html',
  styleUrls: ['./twilio-setting.component.scss']
})
export class TwilioSettingComponent implements OnInit {
  readonly STEPS = STEP;
  step: STEP = STEP.CAMPAIGN_FORM;

  monthlyCapacity = 3000;
  twilio_account: TwilioAccount = {
    authToken: '',
    accountSid: '',
    sender: ''
  };
  twilio_brand_info: StarterBrandRes | StandardBrandRes;
  twilio_sub_account;
  twilio_number;

  garbageSubscription: Subscription;
  userSubscription: Subscription;

  savingCapacity = false;
  creatingSubaccount = false;
  movingNumber = false;
  campaign: BrandCampaign = {
    description: '',
    messageFlow: '',
    messages: ['', '']
  };

  hasSubAccount = false;
  hasBrand = false;
  numberScope = 'primary';

  constructor(
    private userService: UserService,
    private smsService: SmsService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        if (_garbage?._id) {
          this.twilio_sub_account = _garbage.twilio_sub_account;
          this.twilio_brand_info = _garbage.twilio_brand_info;
          this.monthlyCapacity = _garbage.twilio_capacity;
          this.campaign = _garbage.twilio_campaign_draft;
          if (this.campaign.messages?.length < 2) {
            const remainedSampleCount =
              2 - (this.campaign.messages?.length || 0);
            const remainedSamples = new Array(remainedSampleCount).fill('');
            this.campaign.messages = [
              ...(this.campaign.messages || []),
              ...remainedSamples
            ];
          }
          // if (
          //   this.twilio_sub_account?.is_enabled &&
          //   this.twilio_brand_info?.brand
          // ) {
          //   this.step = STEP.CAMPAIGN_FORM;
          // }
          // if (this.twilio_sub_account?.is_enabled) {
          //   this.hasSubAccount = true;
          // }
          // if (this.twilio_brand_info?.brand) {
          //   this.hasBrand = true;
          // }
        }
      }
    );
    this.userSubscription = this.userService.profile$.subscribe((_profile) => {
      if (_profile?._id) {
        this.twilio_number = _profile.twilio_number;
        this.numberScope = _profile.twilio_number_scope || 'primary';
      }
    });
  }

  saveOwnTwilio(): void {}

  saveCapacity(): void {
    this.savingCapacity = true;
    this.userService
      .updateGarbage({
        twilio_capacity: this.monthlyCapacity
      })
      .subscribe(() => {
        this.savingCapacity = false;
        this.userService.updateGarbageImpl({
          twilio_capacity: this.monthlyCapacity
        });
        if (this.monthlyCapacity > 100000) {
          this.step = this.STEPS.HIGH_CAPACITY;
        } else {
          this.step = this.STEPS.LOW_CAPACITY;
        }
      });
  }

  useCrmgrow(): void {}

  goToPrevStep(): void {
    if (this.monthlyCapacity > 100000) {
      this.step = this.STEPS.HIGH_CAPACITY;
    } else {
      this.step = this.STEPS.LOW_CAPACITY;
    }
  }

  createSubAccount(): void {
    this.creatingSubaccount = true;
    this.smsService.createSubAccount().subscribe(() => {
      this.creatingSubaccount = false;
      this.step = this.STEPS.SELECT_NUMBER;
    });
  }

  createdBrand(): void {
    this.step = this.STEPS.CAMPAIGN_FORM;
  }

  selectNewNumber(): void {
    this.dialog
      .open(AddPhoneComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true,
        data: {
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.twilio_number = res;
          this.numberScope = 'subaccount';
          this.userService.updateProfileImpl({
            twilio_number: this.twilio_number,
            twilio_number_scope: 'subaccount'
          });
          this.goToBrandStep();
        }
      });
  }

  useCurrentNumber(): void {
    this.movingNumber = true;
    this.smsService.moveCurrentNumber().subscribe(() => {
      this.movingNumber = false;
      this.goToBrandStep();
    });
  }

  goToBrandStep(): void {
    if (this.monthlyCapacity > 100000) {
      this.step = this.STEPS.STANDARD_BRAND_FORM;
    } else {
      this.step = this.STEPS.STARTER_BRAND_FORM;
    }
  }

  savedCampaign(): void {
    this.router.navigate(['/settings/sms']);
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return value + '';
  }
}
