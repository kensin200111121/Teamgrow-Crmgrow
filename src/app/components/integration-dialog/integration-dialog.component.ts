import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Integration } from '@core/interfaces/integrations.interface';
import { User } from '@models/user.model';
import { NotificationService } from '@services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ActionImpossibleNotificationComponent } from '../action-impossible-notification/action-impossible-notification.component';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { ForwardEmailComponent } from '../forward-email/forward-email.component';
import { ConnectService } from '@services/connect.service';
import { Subscription } from 'rxjs';
import { Garbage } from '@models/garbage.model';
import { environment } from '@environments/environment';
import { Router } from '@angular/router';
import { AuthorizeCodeConfirmComponent } from '../authorize-code-confirm/authorize-code-confirm.component';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import * as Storm from '@wavv/dialer';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { SspaService } from '@app/services/sspa.service';

@Component({
  selector: 'app-integration-dialog',
  templateUrl: './integration-dialog.component.html',
  styleUrls: ['./integration-dialog.component.scss']
})
export class IntegrationDialogComponent implements OnInit {
  readonly isSspa = environment.isSspa;
  readonly isProduction = environment.production;
  readonly agentFirePage = environment.AGENTFIRE;

  user: User = new User();
  isConfirm = false;
  step = 1;
  integration: Integration;
  connectingMail = '';
  connectingCalendar = '';
  apiKey = '';
  apiKeyVisible = false;
  isApiKeyCopied = false;
  generatingApiKey = false;
  garbageSubscription: Subscription;
  garbage: Garbage = new Garbage();
  features: Record<string, boolean> = {};

  /* STMT Email */
  loading = false;
  smtp_info;
  senderEmail = '';
  senderName = '';
  smtpHost = '';
  smtpPort = '';
  password = '';

  previous_smtp_info;
  previous_senderName = '';
  previous_smtpHost = '';
  previous_smtpPort = '';
  previous_password = '';
  previous_isSMTPConnected = false;
  isLoadFromOther = false;

  isSMTPConnected = false;
  isSMTPVerified = false;
  isEdit = false;
  isEditEmail = false;
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

  loadedZapier = false;
  calendlyLength = 0;

  googleCalendars = [];
  outlookCalendars = [];

  demoVideoLink: SafeUrl;

  constructor(
    public dialogRef: MatDialogRef<IntegrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private userService: UserService,
    private toast: ToastrService,
    private connectService: ConnectService,
    private router: Router,
    private sanitizer: DomSanitizer,
    public sspaService: SspaService
  ) {
    this.integration = data.integration;
    if (this.integration['video']) {
      this.demoVideoLink = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.integration['video']
      );
    }
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (Object.keys(this.garbage.calendly).length) {
        this.connectService.getEvent().subscribe((res) => {
          if (res && res['status']) {
            this.calendlyLength = res['data'].length;
          }
        });
      }
      if (this.garbage.access_token == '') {
        this.connectService.getToken().subscribe((res) => {
          if (res['status'] == true) {
            this.garbage.access_token = res['token'];
          }
        });
      }
      if (!this.garbage.api_key) {
        this.getApiKey();
      }
      if (this.garbage._id && this.garbage.features) {
        this.features = this.garbage.features;
      }

      if (this.garbage && this.garbage.smtp_info) {
        const previous_smtp_info = res.smtp_info;
        this.previous_smtp_info = previous_smtp_info;
        this.previous_smtpHost = previous_smtp_info.host;
        this.previous_senderName = previous_smtp_info.user;
        this.previous_smtpPort = previous_smtp_info.port + '';
        this.previous_password = previous_smtp_info.pass;

        this.previous_isSMTPConnected = true;
      } else {
        this.previous_isSMTPConnected = false;
      }

      if (data.integration) {
        this.integration = data.integration;
        if (this.integration.id === 'agent_fire') {
          this.apiKey = this.garbage?.api_key || '';
        } else if (this.integration.id === 'zapier') {
          this.apiKey = this.garbage?.access_token || '';
        } else {
          this.apiKey = this.integration.api_key || '';
        }
      }
    });

    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.user = res;
        this.isSMTPVerified =
          (this.user.primary_connected &&
            this.user.connected_email_type === 'smtp' &&
            this.user.connected_email &&
            true) ||
          false;
        this.isSMTPConnected =
          (this.user.smtp_info?.smtp_connected && true) || false;
        if (this.isSMTPConnected && !this.isSMTPVerified) {
          this.currentTab = 'email';
        } else if (this.isSMTPVerified) {
          this.currentTab = 'daily';
        }
        if (this.user.calendar_list) {
          this.googleCalendars = this.user.calendar_list.filter((e) => {
            if (e.connected_calendar_type === 'google') {
              return true;
            }
          });
          this.outlookCalendars = this.user.calendar_list.filter((e) => {
            return e.connected_calendar_type === 'outlook';
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.userService.profile$.subscribe((res) => {
      if (res && res.smtp_info) {
        const smtp_info = res.smtp_info;
        this.smtp_info = smtp_info;
        this.smtpHost = smtp_info.host;
        this.smtpPort = smtp_info.port + '';
        this.senderName = smtp_info.user;
        this.senderEmail = smtp_info.email;
        this.password = smtp_info.pass;
        this.dailyLimit = smtp_info.daily_limit || 2000;
      }
    });
  }

  doConnect(): void {
    if (
      this.integration.id === 'smtp_mail' ||
      this.integration.id === 'zapier' ||
      this.integration.id === 'agent_fire' ||
      this.integration.id === 'calendly'
    ) {
      this.step = 2;
      if (this.integration.id === 'zapier') {
        setTimeout(() => {
          if (!this.loadedZapier && document.getElementById('zapier'))
            this.loadZapierScript();
        }, 1000);
      }
    } else {
      const integrationId = this.integration.id;
      switch (integrationId) {
        case 'gmail':
        case 'outlook':
          this.connectMail(integrationId);
          break;
        case 'google_calendar':
          this.connectCalendar('gmail');
          break;
        case 'outlook_calendar':
          this.connectCalendar('outlook');
          break;
        case 'zoom':
          this.connectZoom();
          break;
        case 'dialer':
          this.buyDial();
          break;
      }
    }
  }

  doLearnMore(): void {
    this.step = 1;
  }

  openAgentFire(): void {
    this.router.navigate([]).then((result) => {
      window.open(this.agentFirePage, '_blank');
    });
  }

  doConfirm(): void {
    const integrationId = this.integration.id;
    switch (integrationId) {
      case 'calendly':
        this.authCalendly();
        break;
      case 'agent_fire':
      case 'zapier':
        this.dialogRef.close();
        break;
      default:
        this.dialogRef.close();
        break;
    }
  }

  /**
   * Pre-handler to connect email service. If current connected is smtp, check the current active tasks with mass contacts.
   * @param type: string (google | outlook | smtp)
   */
  connectMail(type: string): void {
    // if current connected email is smtp, please check the mass task is running.
    if (
      this.user.connected_email_type === 'smtp' &&
      this.user.primary_connected
    ) {
      this.notificationService.loadMassTasks().subscribe((_tasks) => {
        if (_tasks?.length) {
          // Error Alert showing
          const details = [];
          _tasks.forEach((e, index) => {
            const detail = {};
            detail['title'] = e.action?.subject || 'TO-DO Task ' + index;
            if (e.process) {
              detail['link'] = '/email-queue/' + e.process;
            } else {
              detail['link'] = '/scheduled-items';
            }
            detail['type'] = 'Task';
            details.push(detail);
          });
          this.dialog.open(ActionImpossibleNotificationComponent, {
            width: '96%',
            maxWidth: '480px',
            data: {
              title: 'Can not change your primary email',
              message:
                'You can not change your primary email service because there are some active tasks that should send the emails at once. Please check following tasks. Please wait for the completion of them or remove those.',
              details
            }
          });
        } else {
          this.connectMailImpl(type);
        }
      });
    } else {
      this.connectMailImpl(type);
    }
  }

  /**
   * Main handler to connect email service
   * @param type: string (google | outlook | smtp)
   */
  connectMailImpl(type: string): void {
    if (type == 'gmail' || type == 'outlook') {
      this.connectingMail = type;
      this.userService.requestSyncUrl(type).subscribe(
        (res) => {
          if (res['status']) {
            location.href = res['data'];
          }
          this.connectingMail = '';
        },
        (err) => {
          this.connectingMail = '';
          this.showError('Request authorization url Error is happened.');
        }
      );
    } else if (type == 'smtp') {
      this.dialog.open(ForwardEmailComponent, {
        width: '100vw',
        maxWidth: '600px',
        disableClose: true
      });
    } else {
      this.showError(
        'We are improving with the platform with this email Services. So please use another service while we are developing.'
      );
    }
  }

  connectCalendar(type: string): void {
    if (type == 'gmail' || type == 'outlook') {
      this.connectingCalendar = type;
      this.userService.requestCalendarSyncUrl(type).subscribe(
        (res) => {
          if (res && res['status']) {
            location.href = res['data'];
          }
          this.connectingCalendar = '';
        },
        (err) => {
          this.connectingCalendar = '';
          this.showError('Request authorization url Error is happened.');
        }
      );
    } else {
      this.showError(
        'We are improving with the platform with this calendar Services. So please use another service while we are developing.'
      );
    }
  }

  disconnectCalendar(email: string, type: string, id: string): void {
    const data = {
      connected_email: email,
      id
    };
    this.userService.disconnectCalendar(data).subscribe((res) => {
      if (res && res['status']) {
        if (type == 'gmail') {
          const pos = _.findIndex(
            this.googleCalendars,
            (e) => e.connected_email == email
          );
          this.googleCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Google Calendar is disconnected successfully.'
          // );
        } else {
          const pos = _.findIndex(
            this.outlookCalendars,
            (e) => e.connected_email == email
          );
          this.outlookCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Outlook Calendar is disconnected successfully.'
          // );
        }
        const pos = _.findIndex(
          this.user.calendar_list,
          (e) => e.connected_email == email
        );
        this.user.calendar_list.splice(pos, 1);
        if (!this.user.calendar_list.length) {
          this.user.calendar_connected = false;
        }
        this.userService.updateProfileImpl({
          calendar_list: this.user.calendar_list,
          connect_calendar: this.user.calendar_connected
        });
      }
    });
  }

  connectZoom(): void {
    this.userService.requestZoomSyncUrl().subscribe((res) => {
      if (res && res['status']) {
        location.href = res['data'];
      }
    });
  }

  authCalendly(): void {
    if (this.apiKey == '') {
      return;
    }
    this.isConfirm = true;
    const token = { token: this.apiKey };
    this.connectService.connectCalendly(token).subscribe(
      (res) => {
        if (res && res['status']) {
          this.isConfirm = false;
          const calendlyUserData = res['data']?.['calendly'] || {};
          this.connectService.getEvent().subscribe((event) => {
            if (event && event['status']) {
              if (event['data'].length == 1) {
                const calendly = {
                  link: event['data'][0].scheduling_url,
                  id: event['data'][0].uri
                };
                this.connectService.setEvent(calendly).subscribe((calendly) => {
                  if (calendly && calendly['status']) {
                    calendlyUserData.link = event['data'][0].scheduling_url;
                    calendlyUserData.id = event['data'][0].uri;
                    this.userService.updateGarbageImpl({
                      calendly: calendlyUserData
                    });
                  }
                });
              }
              const { calendly: data } = res['data'];
              this.dialogRef.close(data);
            }
          });
        }
      },
      (err) => {
        this.isConfirm = false;
        if (err.status === 400) {
          this.toast.error('Please check your calendly api key.');
        }
      }
    );
  }

  setApiKeyVisible(): void {
    this.apiKeyVisible = !this.apiKeyVisible;
  }

  copyApiKey(): void {
    this.copyClipboard(this.apiKey);
    this.isApiKeyCopied = true;
    this.toast.success('Copied the key to clipboard');
    setTimeout(() => {
      this.isApiKeyCopied = false;
    }, 2000);
  }

  private copyClipboard(data: string): void {
    const el = document.createElement('textarea');
    el.value = data;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  buyDial(): void {
    this.isConfirm = true;
    Storm.purchaseDialer()
      .then(() => {
        this.isConfirm = false;
        console.log('Show the subscription modal');
      })
      .catch((err) => {
        this.isConfirm = false;
        console.log('error', err);
        this.showError(err);
      });
    if (!this.user.onboard.dialer_checked) {
      this.user.onboard.dialer_checked = true;
      this.userService
        .updateProfile({ onboard: this.user.onboard })
        .subscribe(() => {
          this.userService.updateProfileImpl({
            onboard: this.user.onboard
          });
        });
    }
  }

  showError(msg: string): void {
    this.toast.error(msg);
  }

  getApiKey(): void {
    this.generatingApiKey = true;
    if (this.integration.id === 'agent_fire') {
      this.connectService.getApiKey().subscribe((res) => {
        this.generatingApiKey = false;
        if (res['status'] == true) {
          this.garbage.api_key = res['apiKey'];
          this.apiKey = res['apiKey'];
        }
      });
    }

    if (this.integration.id === 'zapier') {
      this.connectService.getToken().subscribe((res) => {
        this.generatingApiKey = false;
        if (res['status'] == true) {
          this.garbage.access_token = res['token'];
          this.apiKey = res['token'];
        }
      });
    }
  }

  loadZapierScript(): void {
    if (environment.isSspa) {
      document.getElementById('zapier').innerHTML =
        '<zapier-zap-templates theme="light"' +
        'ids="1760759,1760760,1784661,1784664,1784665,1784669"' +
        'limit="10"' +
        'link-target="new-tab"' +
        'presentation="row"' +
        'use-this-zap="show"' +
        '></zapier-zap-templates>';
    } else {
      document.getElementById('zapier').innerHTML =
        '<zapier-zap-templates theme="light"' +
        'ids="1216840,1216841,1216842,1216900,1217021,1217023,1217026,1217027"' +
        'limit="10"' +
        'link-target="new-tab"' +
        'presentation="row"' +
        'use-this-zap="show"' +
        '></zapier-zap-templates>';
    }
    this.loadedZapier = true;
  }

  /* SMTP Email Connection */
  syncSMTP(): void {
    if (this.host != 'other') {
      return;
    }
    const data = {
      host: this.smtpHost,
      port: this.smtpPort,
      user: this.senderName,
      pass: this.password
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

  edit(form: NgForm): void {
    this.password = '';
    this.isEdit = true;
  }
  cancel(): void {
    const smtp_info = this.smtp_info;
    this.smtpHost = smtp_info.host;
    this.smtpPort = smtp_info.port + '';
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
          email: this.user.email
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.status) {
          // this.toast.success('Your SMTP connection is verified successfully.');
          let data;
          if (!this.user.onboard.connect_email) {
            this.user.onboard.connect_email = true;
            data = {
              primary_connected: true,
              connected_email_type: 'smtp',
              connected_email: this.senderEmail,
              onboard: this.user.onboard
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
      this.user.smtp_info.host &&
      this.user.smtp_info.port &&
      this.user.smtp_info.user &&
      this.user.smtp_info.pass &&
      true;
    if (isSynced) {
      if (!this.user.onboard.connect_email) {
        this.user.onboard.connect_email = true;
        data = {
          smtp_info: {
            ...this.smtp_info,
            daily_limit: this.dailyLimit
          },
          email_info: {
            ...this.user.email_info,
            max_count: this.dailyLimit
          },
          primary_connected: true,
          connected_email_type: 'smtp',
          connected_email: this.senderEmail,
          onboard: this.user.onboard
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
      this.senderName = this.previous_senderName;
      this.password = this.previous_password;
    }
  }
}
