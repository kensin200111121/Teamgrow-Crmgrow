import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseMessageComponent } from '@components/purchase-message/purchase-message.component';
import { AddPhoneComponent } from '@components/add-phone/add-phone.component';
import { Router } from '@angular/router';
import { Garbage } from '@models/garbage.model';
import { StarterBrandStatus } from '@app/utils/data.types';
import { SmsService } from '@app/services/sms.service';
import { ToastrService } from 'ngx-toastr';
import { openSettings } from '@wavv/dialer';

@Component({
  selector: 'app-sms-limits',
  templateUrl: './sms-limits.component.html',
  styleUrls: ['./sms-limits.component.scss']
})
export class SmsLimitsComponent implements OnInit {
  isLoading = false;
  user: User = new User();
  garbage: Garbage = new Garbage();
  leftSms = 0;
  profileSubscription: Subscription;

  twilioBrandStatus: StarterBrandStatus;
  isSending = false;
  isCreatingMessagingService = false;
  isAttachingPhone = false;

  get isVerifiedBrand(): boolean {
    return this.twilioBrandStatus?.identityStatus === 'VERIFIED';
  }

  get isApprovedBrand(): boolean {
    return this.twilioBrandStatus?.status === 'APPROVED';
  }

  get isNotVerifiedCampaign(): boolean {
    return (
      !!this.twilioBrandStatus?.campaignStatus &&
      ['IN_PROGRESS', 'PENDING', 'FAILED'].includes(
        this.twilioBrandStatus?.campaignStatus
      )
    );
  }

  constructor(
    private userService: UserService,
    private textService: SmsService,
    private dialog: MatDialog,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService
      .loadProfile()
      .subscribe((profile) => {
        if (profile?._id) {
          this.user = profile;
          this.garbage = profile['garbage'];
          if (this.user?.text_info.is_limit) {
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

          if (this.garbage.twilio_brand_info?.brand) {
            this.twilioBrandStatus = {
              sid: this.garbage.twilio_brand_info.brand,
              identityStatus: this.garbage.twilio_brand_info.identityStatus,
              status: this.garbage.twilio_brand_info.status,
              failureReason: ''
            };
            if (
              this.garbage.twilio_brand_info.campaignStatus === 'VERIFIED' &&
              this.garbage.twilio_brand_info.attachedService
            ) {
              this.isLoading = false;
            } else if (
              this.garbage.twilio_brand_info.brandType === 'SOLE_PROPRIETOR' &&
              this.garbage.twilio_brand_info.brand
            ) {
              this.isLoading = true;
              this.fetchBrandStatus();
            } else {
              this.isLoading = false;
            }
          } else {
            this.isLoading = false;
          }
        }
      });
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
              this.user = profile;
              if (this.user?.text_info.is_limit) {
                if (this.user.text_info?.additional_credit) {
                  this.leftSms =
                    this.user.text_info.max_count -
                    this.user.text_info.count +
                    this.user.text_info.additional_credit.amount;
                } else {
                  this.leftSms =
                    this.user.text_info.max_count - this.user.text_info.count;
                }
              } else {
                this.leftSms = 0;
              }
            }
          });
        }
      });
  }

  addPhone(): void {
    this.dialog
      .open(AddPhoneComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.user.twilio_number = res;
          if (!this.user.onboard.sms_service && this.user.user_version >= 2.1) {
            this.user.onboard.sms_service = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  proxy_number: this.user.proxy_number,
                  twilio_number: this.user.twilio_number,
                  onboard: this.user.onboard
                });
                // this.router.navigate(['/materials/create/video']); // To do ask later
              });
          } else {
            this.userService.updateProfileImpl({
              proxy_number: this.user.proxy_number,
              twilio_number: this.user.twilio_number
            });
          }
        }
      });
  }

  changePhone(): void {
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
          this.user.twilio_number = res;
          if (!this.user.onboard.sms_service) {
            this.user.onboard.sms_service = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  proxy_number: this.user.proxy_number,
                  twilio_number: this.user.twilio_number,
                  onboard: this.user.onboard
                });
              });
          } else {
            this.userService.updateProfileImpl({
              proxy_number: this.user.proxy_number,
              twilio_number: this.user.twilio_number
            });
          }
        }
      });
  }

  deletePhone(): void {}

  fetchBrandStatus(): void {
    this.textService.getStarterBrandStatus().subscribe((status) => {
      this.twilioBrandStatus = status;
      this.isLoading = false;
      if (status.status) {
        this.userService.updateGarbageImpl({
          'twilio_brand_info.status': status.status,
          'twilio_brand_info.identityStatus': status.identityStatus,
          'twilio_brand_info.campaignStatus': status.campaignStatus
        });
      }
    });
  }

  createStarterBrandMessaging(): void {
    this.isCreatingMessagingService = true;
    this.textService.createStarterBrandMessaging().subscribe((status) => {
      if (!!status) {
        const attachedService = status?.attachedService;
        const service = status?.service;
        this.garbage.twilio_brand_info = {
          ...this.garbage.twilio_brand_info,
          attachedService,
          service
        };
        // fetch garbage again
        this.userService.loadProfile().subscribe((res) => {
          this.isCreatingMessagingService = false;
          if (res['garbage']) {
            const garbage = new Garbage().deserialize(res['garbage']);
            this.userService.setGarbage(garbage);
          }
        });
      } else {
        this.isCreatingMessagingService = false;
      }
    });
  }

  sendStarterBrandOtp(): void {
    this.isSending = true;
    this.textService.sendStarterBrandOtp().subscribe((status) => {
      if (status) {
        // Show toast
      }
      this.isSending = false;
    });
  }

  /**
   * Attach the current twilio number to the new service
   */
  attachPhoneNumber() {
    this.isAttachingPhone = true;
    this.textService.attachPhoneNumber2Service().subscribe((status) => {
      this.isAttachingPhone = false;
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
}
