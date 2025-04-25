import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { AuthorizeCodeConfirmComponent } from '@components/authorize-code-confirm/authorize-code-confirm.component';

@Component({
  selector: 'app-forward-email',
  templateUrl: './forward-email.component.html',
  styleUrls: ['./forward-email.component.scss']
})
export class ForwardEmailComponent implements OnInit {
  loading = false;
  smtp_info;
  senderEmail = '';
  senderName = '';
  smtpHost = '';
  smtpPort = '';
  password = '';
  enableSSL = true;

  previous_smtp_info;
  previous_senderName = '';
  previous_smtpHost = '';
  previous_smtpPort = '';
  previous_password = '';
  previous_enableSSL = true;
  previous_isSMTPConnected = false;
  isLoadFromOther = false;

  isSMTPConnected = false;
  isSMTPVerified = false;
  isEdit = false;
  isEditEmail = false;
  currentUser: User;
  dailyLimit = 0;

  menuItems = [
    { id: 'smtp', label: 'SMTP Server', icon: 'i-server' },
    { id: 'email', label: 'Sender Email', icon: 'i-alt-email' },
    { id: 'daily', label: 'Daily Limit', icon: 'i-sand-timer' }
  ];
  currentTab = 'smtp';

  profileSubscription: Subscription;
  connectSubscription: Subscription;
  verifySubscription: Subscription;
  updateDailyLimitSubscription: Subscription;
  updateProfileSubscription: Subscription;

  isConnecting = false;
  isVerifying = false;
  isUpdating = false;

  host = 'other';
  constructor(
    private dialogRef: MatDialogRef<ForwardEmailComponent>,
    private userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.currentUser = res;
        this.isSMTPVerified =
          (this.currentUser.primary_connected &&
            this.currentUser.connected_email_type === 'smtp' &&
            this.currentUser.connected_email &&
            true) ||
          false;
        this.isSMTPConnected =
          (this.currentUser.smtp_info?.smtp_connected && true) || false;
        if (this.isSMTPConnected && !this.isSMTPVerified) {
          this.currentTab = 'email';
        } else if (this.isSMTPVerified) {
          this.currentTab = 'daily';
        }
      }
    });
  }

  ngOnInit(): void {
    // this.userService.garbage$.subscribe((res) => {
    this.userService.profile$.subscribe((res) => {
      if (res && res.smtp_info) {
        const smtp_info = res.smtp_info;
        this.smtp_info = smtp_info;
        this.smtpHost = smtp_info.host;
        this.smtpPort = smtp_info.port + '';
        this.enableSSL = smtp_info.secure;
        this.senderName = smtp_info.user;
        this.senderEmail = smtp_info.email;
        this.password = smtp_info.pass;
        this.dailyLimit = smtp_info.daily_limit || 2000;
      }
    });

    this.userService.garbage$.subscribe((res) => {
      if (res && res.smtp_info) {
        const previous_smtp_info = res.smtp_info;
        this.previous_smtp_info = previous_smtp_info;
        this.previous_smtpHost = previous_smtp_info.host;
        this.previous_senderName = previous_smtp_info.user;
        this.previous_smtpPort = previous_smtp_info.port + '';
        this.previous_password = previous_smtp_info.pass;
        this.previous_enableSSL = previous_smtp_info.secure;

        this.previous_isSMTPConnected = true;
      } else {
        this.previous_isSMTPConnected = false;
      }
    });
  }

  syncSMTP(): void {
    if (this.host != 'other') {
      return;
    }
    const data = {
      host: this.smtpHost,
      port: this.smtpPort,
      user: this.senderName,
      pass: this.password,
      secure: this.enableSSL
    };
    this.isConnecting = true;
    this.connectSubscription && this.connectSubscription.unsubscribe();
    this.connectSubscription = this.userService
      .syncSMTP(data)
      .subscribe((res) => {
        this.isConnecting = false;
        if (res && res.status) {
          this.smtp_info = { ...data, email: '', smtp_connected: true };
          this.userService.updateProfileImpl({
            primary_connected: false,
            connected_email_type: '',
            connected_email: '',
            smtp_info: this.smtp_info
          });
          this.isEdit = false;
          this.currentTab = 'email';
        }
      });
  }

  setEnableSSL(): void {
    this.enableSSL = !this.enableSSL;
  }

  edit(form: NgForm): void {
    this.password = '';
    this.isEdit = true;
  }
  cancel(): void {
    const smtp_info = this.smtp_info;
    this.smtpHost = smtp_info.host;
    this.smtpPort = smtp_info.port + '';
    this.enableSSL = smtp_info.secure;
    this.senderName = smtp_info.user;
    this.senderEmail = smtp_info.email;
    this.password = smtp_info.pass;
    this.isEdit = false;
    this.isLoadFromOther = false;
  }
  editEmail(): void {
    this.isEditEmail = true;
  }
  cancelEditEmail(): void {
    this.senderEmail = this.smtp_info?.email;
    this.isEditEmail = false;
  }

  verifyEmail(): void {
    if (!this.senderEmail) {
      return;
    }
    const data = {
      email: this.senderEmail
    };
    this.isVerifying = true;
    this.verifySubscription && this.verifySubscription.unsubscribe();
    this.verifySubscription = this.userService
      .authorizeSMTP(data)
      .subscribe((res) => {
        this.isVerifying = false;
        if (res && res.status) {
          this.smtp_info = { ...res.data, verification_code: '' };
          // this.userService.updateGarbageImpl({
          this.userService.updateProfileImpl({
            smtp_info: this.smtp_info
          });
          this.isSMTPVerified = false;
          this.verifyCode();
        }
      });
  }

  verifyCode(): void {
    this.dialog
      .open(AuthorizeCodeConfirmComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          email: this.currentUser.email
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.status) {
          // this.toast.success('Your SMTP connection is verified successfully.');
          let data;
          if (!this.currentUser.onboard.connect_email) {
            this.currentUser.onboard.connect_email = true;
            data = {
              primary_connected: true,
              connected_email_type: 'smtp',
              connected_email: this.senderEmail,
              onboard: this.currentUser.onboard
            };
          } else {
            data = {
              primary_connected: true,
              connected_email_type: 'smtp',
              connected_email: this.senderEmail
            };
          }
          this.updateProfileSubscription &&
            this.updateProfileSubscription.unsubscribe();
          this.updateProfileSubscription = this.userService
            .updateProfile(data)
            .subscribe(() => {
              this.userService.updateProfileImpl(data);
            });
          this.smtp_info.verification_code = result.code;
          this.senderEmail = this.smtp_info.email;
          this.isEditEmail = false;
          this.currentTab = 'daily';
        }
      });
  }

  setDailyLimit(): void {
    let data;
    this.isUpdating = true;
    this.updateProfileSubscription &&
      this.updateProfileSubscription.unsubscribe();
    // let data1;
    const isSynced =
      this.currentUser.smtp_info.host &&
      this.currentUser.smtp_info.port &&
      this.currentUser.smtp_info.user &&
      this.currentUser.smtp_info.pass &&
      true;
    if (isSynced) {
      if (!this.currentUser.onboard.connect_email) {
        this.currentUser.onboard.connect_email = true;
        data = {
          smtp_info: {
            ...this.smtp_info,
            daily_limit: this.dailyLimit
          },
          email_info: {
            ...this.currentUser.email_info,
            max_count: this.dailyLimit
          },
          primary_connected: true,
          connected_email_type: 'smtp',
          connected_email: this.senderEmail,
          onboard: this.currentUser.onboard
        };
      } else {
        data = {
          smtp_info: {
            ...this.smtp_info,
            daily_limit: this.dailyLimit
          },
          primary_connected: true,
          connected_email_type: 'smtp',
          connected_email: this.senderEmail
        };
      }
    } else {
      data = {
        smtp_info: {
          ...this.smtp_info,
          daily_limit: this.dailyLimit
        }
      };
    }
    this.updateProfileSubscription = this.userService
      .updateProfile(data)
      .subscribe(() => {
        this.isUpdating = false;
        this.userService.updateProfileImpl(data);
        this.dialogRef.close();
      });
  }

  changeMenu(id: string): void {
    this.currentTab = id;
  }

  checkHostName(event: string): void {
    const host = (event || '').trim();
    switch (host) {
      case 'smtp.gmail.com':
        this.host = 'gmail';
        break;
      case 'smtp.office365.com':
        this.host = 'office';
        break;
      case 'smtp-mail.outlook.com':
        this.host = 'outlook';
        break;
      default:
        this.host = 'other';
    }
  }
  loadSmtpInfo(checked: boolean): void {
    if (checked) {
      this.smtpHost = this.previous_smtpHost;
      this.smtpPort = this.previous_smtpPort;
      this.enableSSL = this.previous_enableSSL;
      this.senderName = this.previous_senderName;
      this.password = this.previous_password;
    }
  }
}
