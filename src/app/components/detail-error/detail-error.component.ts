import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ForwardEmailComponent } from '../forward-email/forward-email.component';
import { ConnectService } from '@services/connect.service';
import { StoreService } from '@app/services/store.service';
import { Subscription } from 'rxjs';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-detail-error',
  templateUrl: './detail-error.component.html',
  styleUrls: ['./detail-error.component.scss']
})
export class DetailErrorComponent implements OnInit {
  errorCode = ''; // 402: Connect Error, 403: Oauth Setting Error, 405: Contacts Detail Error, 406: Connect Error
  errorMessage = '';
  errorObj;
  loading = false;
  saving = false;
  searchCode = '';
  phoneNumbers = [];
  selectedPhone = '';
  plans = [
    { type: 1, sms: '250', price: '6' },
    { type: 2, sms: '500', price: '10' },
    { type: 3, sms: '1000', price: '15' }
  ];
  currentType = this.plans[1];
  captchaToken = '';
  submitted = false;
  isVortex = environment.isSspa;
  profileSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DetailErrorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private connectService: ConnectService,
    private router: Router,
    public sspaService: SspaService,
    private dialog: MatDialog,
    private storeService: StoreService
  ) {
    if (this.data && this.data.errorCode) {
      this.errorCode = this.data.errorCode;
      if (this.errorCode == '408') {
        this.searchPhone();
      }
    }
    if (this.data && this.data.errorMessage) {
      this.errorMessage = this.data.errorMessage;
    }
    if (this.data && this.data.errorObj) {
      this.errorObj = this.data.errorObj;
    }
  }

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.storeService.profileInfo$.subscribe(
      (profile) => {
        if (!profile) {
          return;
        }
        this.isVortex = environment.isSspa || profile.source === 'vortex';
      }
    );
  }

  connectMail(type: string): void {
    if (environment.isSspa) {
      const urls = {
        gmail: `/account/integrations?provider=google_email`,
        outlook: `/account/integrations?provider=microsoft_email`
      };

      if (urls[type]) {
        const nwTab = window.open(urls[type], '_blank');
        nwTab.focus();
        this.dialogRef.close();
      }
    } else {
      if (type === 'gmail' || type === 'outlook') {
        this.connectService.requestSyncUrl(type).subscribe(
          (res) => {
            location.href = res['data'];
          },
          () => {
            this.toast.error(
              '',
              'Request authorization url Error is happened.',
              {
                closeButton: true
              }
            );
          }
        );
      }

      if (type === 'smtp') {
        this.dialogRef.close({ email_type: 'smtp' });
      }
    }
  }

  connectCalendar(type: string): void {
    if (environment.isSspa) {
      const urls = {
        gmail: `/account/integrations?provider=google_calendar`,
        outlook: `/account/integrations?provider=microsoft_calendar`
      };

      if (urls[type]) {
        const nwTab = window.open(urls[type], '_blank');
        nwTab.focus();
        this.dialogRef.close();
      }
    } else {
      if (type === 'gmail' || type === 'outlook') {
        this.connectService.requestCalendarSyncUrl(type).subscribe(
          (res) => {
            if (res && res['status']) {
              location.href = res['data'];
            }
          },
          () => {
            this.toast.error(
              '',
              'Request authorization url Error is happened.',
              {
                closeButton: true
              }
            );
          }
        );
      }
    }
  }

  connectAnotherMail(): void {
    this.connectService.connectAnotherService().subscribe(
      () => {
        this.dialogRef.close();
        location.reload();
      },
      () => {
        this.toast.error('', 'Connecting error is happened.', {
          closeButton: true
        });
      }
    );
  }

  searchPhone(): void {
    this.loading = true;
    let data;
    if (this.searchCode == '') {
      data = {
        searchCode: ''
      };
    } else {
      data = {
        searchCode: parseInt(this.searchCode).toString()
      };
    }

    this.connectService.searchNumbers(data).subscribe((res) => {
      if (res['status']) {
        this.loading = false;
        this.phoneNumbers = res.data;
      }
    });
  }

  selectPhone(phone: string): void {
    this.selectedPhone = phone;
  }

  isSelected(phone: string): any {
    return this.selectedPhone === phone;
  }

  save(): void {
    this.submitted = true;
    if (!this.captchaToken) return;
    if (this.selectedPhone == '') {
      return;
    } else {
      this.saving = true;
      const data = {
        number: this.selectedPhone,
        captchaToken: this.captchaToken
      };
      this.connectService.buyNumbers(data).subscribe(
        (res) => {
          if (res['status']) {
            this.saving = false;
            this.dialogRef.close();
          } else {
            this.saving = false;
          }
        },
        (err) => {
          this.saving = false;
          if (err.status == 400) {
            this.toast.error(err.error.error, 'BUY NUMBER', {
              closeButton: true
            });
          }
        }
      );
    }
  }

  selectPlan(plan: any): void {
    this.currentType = plan;
  }

  purchase(): void {
    this.submitted = true;
    if (!this.captchaToken) {
      return;
    }
    this.saving = true;
    const data = {
      option: this.currentType.type,
      captchaToken: this.captchaToken
    };
    this.connectService.buyCredit(data).subscribe(
      (res) => {
        if (res && res['status']) {
          this.saving = false;
          this.dialogRef.close(true);
        }
      },
      (err) => {
        this.saving = false;
      }
    );
  }

  logout(): void {
    this.connectService.sendLogout();
    this.dialogRef.close();
  }

  goToIntegration(): void {
    this.router.navigate([`/settings/integration`]);
    this.dialogRef.close();
  }

  goToBilling(): void {
    this.router.navigate([`/profile/upgrade-plan`]);
    this.dialogRef.close();
  }

  getAvatarName(contact: any): string {
    if (contact) {
      if (contact.first_name && contact.last_name) {
        return contact.first_name[0] + contact.last_name[0];
      } else if (contact.first_name) {
        return contact.first_name.substring(0, 2);
      } else if (contact.last_name) {
        return contact.last_name.substring(0, 2);
      } else {
        return 'UN';
      }
    }
  }

  getFullName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  showError(error: any): string {
    if (error) {
      if (typeof error === 'object') {
        if (error instanceof Array) {
          return error.join(', ');
        }
        return JSON.stringify(error);
      } else {
        return error;
      }
    } else {
      return 'Unknown Error';
    }
  }
}
