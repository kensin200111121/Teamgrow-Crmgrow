import { Component, Inject, OnInit, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { openSettings, init } from '@wavv/messenger';
import { Subscription } from 'rxjs';
import { SspaService } from '@app/services/sspa.service';
import { StoreService } from '@app/services/store.service';
import { ConnectService } from '@app/services/connect.service';

enum SmsState {
  NO_ACCOUNT = 'no account',
  NEED_SUBSCRIBE = 'need subscribe',
  NEED_BRAND = 'need brand',
  ADD_NUMBER = 'add number',
  LOADING = 'loading',
  DISABLED = 'disabled'
}

@Component({
  selector: 'app-sms-subscribe',
  templateUrl: './sms-subscribe.component.html',
  styleUrls: ['./sms-subscribe.component.scss']
})
export class SmsSubscribeComponent implements OnInit {
  state: SmsState = SmsState.LOADING;
  shouldMakePayment = false;
  error = false;
  submitting = false;
  paying = false;
  profileSubscription: Subscription;
  brandState = 'NONE';
  isVortex = false;

  constructor(
    private dialogRef: MatDialogRef<SmsSubscribeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService,
    private storeService: StoreService,
    private connectService: ConnectService
  ) {
    if (this.data) {
      this.isVortex = this.data.isVortex;
      if (data.subscriptionState) {
        this.brandState = data.brandState;
        if (data.brandState === 'APPROVED') {
          this.state = SmsState.ADD_NUMBER;
        } else {
          this.state = SmsState.NEED_BRAND;
        }
      } else {
        this.state = SmsState.NEED_SUBSCRIBE;
      }
    } else {
      this.initWavvState();
    }
  }

  ngOnInit(): void {}

  private initWavvState () {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.storeService.profileInfo$.subscribe(
      (profile) => {
        if (!profile) {
          return;
        }

        this.isVortex = profile.source === 'vortex';

        if (this.isVortex) {
          this.connectService.getWavvIDForVortex().subscribe((res) => {
            if (res && res['data']) {
              this.fetchWavvState();
            } else {
              this.state = SmsState.DISABLED;
            }
          });
        } else {
          this.fetchWavvState();
        }
      }
    );
  }

  toggleAgree(event) {
    this.error = false;
    this.shouldMakePayment = event.checked;
  }

  fetchWavvState(): void {
    this.state = SmsState.LOADING;
    this.connectService.getWavvState().subscribe((res) => {
      const data = res['data'];
      if (data?.subscriptions?.sms) {
        this.brandState = data?.brandStatus?.status || 'NONE';
        if (data?.brandStatus?.status === 'APPROVED') {
          this.state = SmsState.ADD_NUMBER;
        } else {
          this.state = SmsState.NEED_BRAND;
        }
      } else {
        this.state = SmsState.NEED_SUBSCRIBE;
      }
      if (!data?.hasWavvUser) {
        this.state = SmsState.NO_ACCOUNT;
      }
    });
  }

  subscribe(): void {
    let data: any = { subscriptions: { sms: true } };
    if (!this.isVortex) {
      data = { subscriptions: { sms: true, smsBrandRegistration: true } };
    }
    this.submitting = true;
    this.connectService.updateSubscriptionState(data).subscribe((data) => {
      this.submitting = false;
      if (data) {
        this.openWavvSettings(true);
      }
    });
  }

  buySubscription(): void {
    this.submitting = true;
    this.connectService.buyWavvSubscription().subscribe((data) => {
      this.submitting = false;
      if (data && data['status']) {
        this.openWavvSettings(true);
      }
    });
  }

  submit() {
    if (
      !this.shouldMakePayment &&
      !this.isVortex &&
      (this.state === SmsState.NO_ACCOUNT ||
        this.state === SmsState.NEED_SUBSCRIBE)
    ) {
      this.error = true;
      return;
    }
    if (
      this.state === SmsState.NO_ACCOUNT ||
      this.state === SmsState.NEED_SUBSCRIBE
    ) {
      if (this.isVortex) {
        this.subscribe();
      } else {
        this.buySubscription();
      }
    } else {
      this.openWavvSettings();
    }
  }

  openWavvSettings(withInit = false): void {
    if (!withInit) {
      openSettings();
      return;
    }
    const token = this.storeService.profileInfo.getValue()?.dialer_token;
    init({ token }).then(() => {
      console.log('succeed in messenger initialization')
      openSettings();
    }).catch((err) => {
      console.error('initialization is failed with error', err.message)
    })
    this.dialogRef.close(true);
  }
}
