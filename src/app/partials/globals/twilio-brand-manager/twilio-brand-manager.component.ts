import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SmsService } from '@app/services/sms.service';
import { UserService } from '@app/services/user.service';
import {
  StandardBrandRes,
  StarterBrandRes,
  StarterBrandStatus
} from '@app/utils/data.types';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-twilio-brand-manager',
  templateUrl: './twilio-brand-manager.component.html',
  styleUrls: []
})
export class TwilioBrandManager implements OnInit {
  private inited = false;
  private brandStatus: StarterBrandRes | StandardBrandRes;

  constructor(
    private userService: UserService,
    private textService: SmsService,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.garbage$.subscribe((garbage) => {
      if (garbage._id && !this.inited) {
        this.brandStatus = garbage.twilio_brand_info;
        this.inited = true;

        this.confirmTwilioBrandStatus();
      }
    });
  }

  private confirmTwilioBrandStatus() {
    // No progressed the twilio brand
    if (!this.brandStatus?.customerProfile) {
      return;
    }
    if (
      this.brandStatus?.campaignStatus === 'VERIFIED' &&
      this.brandStatus?.attachedService
    ) {
      return;
    }

    // confirm the brand register status
    this.textService
      .getStarterBrandStatus()
      .subscribe((status: StarterBrandStatus) => {
        if (status.campaignStatus) {
          if (status.campaignStatus === 'FAILED') {
            this.retryCampaignRegister();
          } else if (status.campaignStatus === 'VERIFIED') {
            this.alertAttachPhoneNumber();
          }
          return;
        }
        // brand status handler
        if (
          status.status === 'APPROVED' &&
          status.identityStatus === 'UNVERIFIED'
        ) {
          this.commandBrandNumberVerification();
        }
      });
  }

  /**
   * Attach the current twilio number to the new service
   */
  private alertAttachPhoneNumber() {
    this.toast
      .info(
        'Your campaign is verified. Please attach your current number to this campaign',
        'Twilio Campaign Registration',
        { timeOut: 15000 }
      )
      .onTap.subscribe(() => {
        this.attachPhoneNumber();
      });
  }

  /**
   * Attach the current twilio number to the new service
   */
  private attachPhoneNumber() {
    this.textService.attachPhoneNumber2Service().subscribe((status) => {
      if (status) {
        this.showAttachPhoneSuccess();
      } else {
        this.showAttachPhoneError();
      }
    });
  }

  private showAttachPhoneSuccess() {
    this.toast.success(
      'Your twilio number is attached to your new brand service. Your texting deliverity would be higher.',
      'Twilio Phone Number Attaching',
      { timeOut: 3000 }
    );
  }

  private showAttachPhoneError() {
    this.toast.warning(
      'Your twilio number attaching is failed. Please contact us the support team.',
      'Twilio Phone Number Attaching Failure',
      { timeOut: 3000 }
    );
  }

  /**
   * Show the error aleret and retry to create campaign
   */
  private retryCampaignRegister() {
    this.toast
      .warning(
        'Your campaign registration is failed. Please retry to create campaign.',
        'Twilio Campaign Registration',
        { timeOut: 15000 }
      )
      .onTap.subscribe(() => {
        this.router.navigate(['/settings/twilio-setting']);
      });
  }

  /**
   * Show the phone verification step
   */
  private commandBrandNumberVerification() {
    this.toast
      .info(
        'Your brand registration request is accepted. You can continue next step (phone verification).',
        'Twilio Brand Registration',
        { timeOut: 15000 }
      )
      .onTap.subscribe(() => {
        this.router.navigate(['/settings/sms']);
      });
  }
}
