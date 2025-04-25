import { SspaService } from '../../services/sspa.service';
import { Component, NgZone, OnInit, ViewChild, Inject } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwPush } from '@angular/service-worker';
import { Garbage } from '@models/garbage.model';
import { SearchOption } from '@models/searchOption.model';
import { User } from '@models/user.model';
import { ContactService } from '@services/contact.service';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import { LabelService } from '@services/label.service';
import { NotificationService } from '@services/notification.service';
import { TagService } from '@services/tag.service';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '@services/theme.service';
import { ADMIN_CALL_LABELS } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { NotificationAlertComponent } from '@components/notification-alert/notification-alert.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import userflow from 'userflow.js';
import { UserflowCongratComponent } from '@components/userflow-congrat/userflow-congrat.component';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import { Location, DOCUMENT } from '@angular/common';
import { Cookie } from '@utils/cookie';
import { filter } from 'rxjs/operators';
import { UpgradePlanErrorComponent } from '@components/upgrade-plan-error/upgrade-plan-error.component';
import { HelperService } from '@services/helper.service';
import { NotifyComponent } from '@components/notify/notify.component';
import { environment } from '@environments/environment';
import { PaymentFailedErrorComponent } from '@components/payment-failed-error/payment-failed-error.component';
import * as moment from 'moment-timezone';
import { AutomationService } from '@app/services/automation.service';
import { LeadFormService } from '@app/services/lead-form.service';
import { getUserTimezone } from '@app/helper';
import { DialerService } from '@app/services/dialer.service';
import {
  CHECKLIST_FLOW_ID,
  WELCOME_DIALGO_FLOW_ID
} from '@app/constants/userflow.constant';
import { navigateToUrl } from 'single-spa';
import { RouterService } from '@app/services/router.service';
import { STATUS } from '@constants/variable.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { CustomFieldService } from '@app/services/custom-field.service';
import { ConnectService } from '@app/services/connect.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  user: User = new User();
  @ViewChild('drawer') manageLabelPanel: MatDrawer;
  mode = '';
  showDialog = false;
  visibleRecording = false;
  isOverlay = true;
  isDownload = false;
  downloadLink = '';
  checklist_id = CHECKLIST_FLOW_ID;
  isUserflowInited = false;
  isUserflowStarted = false;
  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  filterParamSubscription: Subscription;
  selectedCompany: BehaviorSubject<boolean> = new BehaviorSubject(false);
  selectedCompany$ = this.selectedCompany.asObservable();
  isCheckedUpdate = false;
  congratModal;
  isShowSuspendedModal = false;
  isSspa = environment.isSspa;

  constructor(
    public handlerService: HandlerService,
    private userService: UserService,
    private labelService: LabelService,
    private dealsService: DealsService,
    private tagService: TagService,
    private contactService: ContactService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private location: Location,
    public sspaService: SspaService,
    private leadFormService: LeadFormService,
    private automationService: AutomationService,
    private dialerService: DialerService,
    public routerService: RouterService,
    private featureService: UserFeatureService,
    private customFieldService: CustomFieldService,
    private connectService: ConnectService
  ) {
    window['userflowImpl'] = userflow;
    window['environment'] = environment;

    this.userService.saveAccessDate().subscribe(() => {
      console.log('saved login date');
    });
    this.userService.loadProfile().subscribe((res) => {
      const userInfo = new User().deserialize(res);
      const isVortex = userInfo.source === 'vortex';
      if (isVortex) {
        this.connectService.getWavvIDForVortex().subscribe((res) => {
          if (res && res['data']) {
            userInfo.dialer_info = {
              ...userInfo?.dialer_info,
              is_enabled: true
            };
          }
          featureService.updateFeature(userInfo);
        });
      } else {
        featureService.updateFeature(userInfo);
      }

      moment.tz.setDefault(getUserTimezone(userInfo, false));
      this.userService.updateLocalStorageItem('u_id', userInfo._id);

      if (res?.builder_token) {
        this.userService.loadPagesImpl(res.builder_token).then((pages) => {
          if (pages?.length) {
            this.userService.updateProfileImpl({ builder_version: 'old' });
          }
          Cookie.setWithDomain(
            '_pages_session',
            res.builder_token1,
            environment.domain.base
          );
        });
      }

      this.dialerService.init(res['dialer_token']);
      this.userService.setProfile(userInfo);

      const garbage = new Garbage().deserialize(res['garbage']);
      garbage.additional_fields = [];
      this.userService.setGarbage(garbage);

      // Load the custom fields - the response would update the garbage information
      this.customFieldService.loadContactFields(true);

      if (garbage && garbage.call_labels && garbage.call_labels.length) {
        const callLabels = [...ADMIN_CALL_LABELS, ...garbage.call_labels];
        this.userService.callLabels.next(callLabels);
      }

      this.contactService.getCountriesAndStates();

      this.userService.loadDefaults().subscribe((res) => {
        if (res) {
          this.userService.email.next(res['email']);
          this.userService.sms.next(res['sms']);
        }
      });

      this.contactService.searchOption.next(new SearchOption());
      this.filterParamSubscription &&
        this.filterParamSubscription.unsubscribe();
      this.filterParamSubscription = this.route.queryParams.subscribe(
        (params) => {
          if (params['filter']) {
            this.initContactParams(params['filter']);
          }
        }
      );

      this.showAndroidUpdateNotification(userInfo);
    });
    this.labelService.loadLabels();
    this.tagService.getAllTags();
    this.tagService.getAllCompanies();
    this.tagService.getAllSources();
    this.dealsService.loadPageStageStatus.next(STATUS.NONE);
    this.dealsService.easyGetPipeLine(true);
    this.dealsService.getPipeLine().subscribe((res) => {
      if (res) {
        this.dealsService.pipelines.next(res);
        const selectedPipeline = this.dealsService.selectedPipeline.getValue();
        if (!selectedPipeline) {
          this.dealsService.selectedPipeline.next(res[0]);
        }
      }
    });
    this.themeService.getNewsletters(true);

    this.leadFormService.get().subscribe((res) => {
      if (res) {
        this.leadFormService.forms.next(res);
      }
    });
    // Open or Close Manage Label
    this.labelService.manageLabel$.subscribe((flg) => {
      if (this.manageLabelPanel) {
        if (flg) {
          this.manageLabelPanel.open();
        } else {
          this.manageLabelPanel.close();
        }
      }
    });

    // Apply the custom fields update to the garbage
    // because this custom fields information is stored in the garbage
    // TODO: You can remove the garbage.additional_fields usage & use the customFieldService directly
    this.customFieldService.fields$.subscribe((_fields) => {
      this.userService.updateGarbageImpl({ additional_fields: _fields || [] });
    });

    this.notificationService.loadNotifications();
    this.automationService.loadOwn();
    this.handlerService.openSearch$.subscribe((status) => {
      if (status) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });

    this.handlerService.openRecording$.subscribe((res) => {
      if (res === 'close') {
        return;
      }
      if (res) {
        this.visibleRecording = true;
      } else {
        this.visibleRecording = false;
      }
    });
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          moment.tz.setDefault(getUserTimezone(profile, false));
        }
      }
    );

    this.selectedCompany$.subscribe((res) => {
      if (res) {
        this.userflowImpl();
      }
    });

    this.routerService.startSaveHistory();
    this.userService.loadTeamInfo();

    // check refresh browser and if user is suspended, show upgrade plan modal.
    this.router.events
      .pipe(filter((rs): rs is NavigationEnd => rs instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.id === 1 && event.url === event.urlAfterRedirects) {
          this.userService.profile$.subscribe((profile) => {
            if (profile._id) {
              if (
                profile &&
                profile.subscription &&
                profile.subscription?.is_failed &&
                !this.isShowSuspendedModal
              ) {
                this.isShowSuspendedModal = true;
                if (profile.subscription?.is_suspended) {
                  this.dialog.open(UpgradePlanErrorComponent, {
                    position: { top: '100px' },
                    width: '100vw',
                    maxWidth: '450px',
                    disableClose: true,
                    data: { cancelDate: profile['disabled_at'] }
                  });
                } else {
                  this.dialog.open(PaymentFailedErrorComponent, {
                    position: { top: '100px' },
                    width: '100vw',
                    maxWidth: '450px'
                  });
                }
              }
            }
          });

          // if (
          //   data.user &&
          //   data.user.subscription &&
          //   data.user.subscription.is_suspended
          // ) {
          //   this.returnUrl = '/profile/billing';
          //   this.router.navigate([this.returnUrl]);
          //   this.dialog.open(UpgradePlanErrorComponent, {
          //     position: { top: '100px' },
          //     width: '100vw',
          //     maxWidth: '450px',
          //     disableClose: true
          //   });
          // }
        }
      });
  }

  showAndroidUpdateNotification(profile): void {
    const garbage = this.userService.garbage.getValue();
    if (garbage.is_notification_read) return;
    if (!profile?.version?.android) return;
    if (profile?.version?.android < '1.1.7') {
      this.dialog.open(NotifyComponent, {
        width: '98vw',
        maxWidth: '550px',
        disableClose: true,
        data: {
          show_checkbox: true,
          message:
            '<p><b>Action required:</b></p><p>You are getting this message because you are using crmgrow app on your Android device.</p>' +
            '<p> Please click <a href="https://play.google.com/store/apps/details?id=com.crmgrow.llc" target="_blank">here</a> to download the latest app so make sure you are using the latest crmgrow app and being updated by the system.</p>'
        }
      });
    }
  }
  ngOnInit(): void {
    this.routeChangeSubscription = this.route.queryParams.subscribe(
      (params) => {
        this.mode = params['prev'];
        if (this.mode == 'signup') {
          this.location.replaceState('/home');
          this.dialog
            .open(SelectCompanyComponent, {
              width: '98vw',
              maxWidth: '527px',
              disableClose: true,
              data: {
                type: 'signup'
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                const company = res['company'];
                const job = res['job'];
                this.userService
                  .updateProfile({ company, job })
                  .subscribe((res) => {
                    if (res) {
                      this.userService.updateProfileImpl({ company, job });
                    }
                  });
                this.selectedCompany.next(true);
              }
            });
        } else {
          this.selectedCompany.next(true);
        }
      }
    );
    userflow.setCustomNavigate((url) => {
      if (url) {
        this.ngZone.run(() => {
          if (url == 'watched_modal' && !this.user.onboard.watched_modal) {
            this.user.onboard.watched_modal = true;
            this.userService
              .updateProfile({
                onboard: this.user.onboard
              })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
            this.isSspa
              ? navigateToUrl('/account/profile')
              : this.router.navigate(['/profile/general']);
          } else if (url == 'calendar' || url == 'dialer') {
            this.router.navigate(['/settings/integration']);
          } else {
            this.router.navigate([url]);
          }
        });
      }
    });
    userflow.on('checklistEnded', (event) => {
      if (event.checklist.id === this.checklist_id) {
        localStorage.setCrmItem('checklist_state', 'dismiss');
        this.checkUpdate();
      }
    });

    // Download Link Generation
    if (window.navigator.userAgent.indexOf('Win') !== -1) {
      this.downloadLink =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder+Setup+0.1.4.exe';
    } else {
      this.downloadLink =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder-0.1.4.dmg';
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

  checkUpdate(): void {
    if (this.isCheckedUpdate) {
      return;
    }
    this.isCheckedUpdate = true;
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage._id) {
          this.garbageSubscription && this.garbageSubscription.unsubscribe();
          if (!this.user?.onboard?.watched_modal) {
            return;
          }
          if (!garbage.is_read) {
            this.notificationService.loadUpdate().subscribe((_n) => {
              const notification = _n.result?.[0];
              if (notification) {
                this.dialog.open(NotificationAlertComponent, {
                  width: '98vw',
                  maxWidth: '527px',
                  disableClose: true,
                  data: {
                    notification
                  }
                });
              }
            });
          }
        }
      }
    );
  }

  initUserflow(userInfo: User): void {
    if (this.isUserflowInited || this.isSspa) {
      return;
    }
    userflow.init('ct_opamqimbtjhorkvifeujsaaajq'); // userflow production token
    userflow.identify(userInfo._id, {
      watch_modal: {
        set: 'false',
        data_type: 'string'
      },
      profile: {
        set: 'false',
        data_type: 'string'
      },
      connect_email: {
        set: 'false',
        data_type: 'string'
      },
      contact: {
        set: 'false',
        data_type: 'string'
      },
      upload_video: {
        set: 'false',
        data_type: 'string'
      },
      send_video: {
        set: 'false',
        data_type: 'string'
      },
      sms: {
        set: 'false',
        data_type: 'string'
      },
      calendar: {
        set: 'false',
        data_type: 'string'
      },
      dialer: {
        set: 'false',
        data_type: 'string'
      },
      account_type: {
        set: 'false',
        data_type: 'string'
      },
      tour: {
        set: 'false',
        data_type: 'string'
      },
      material_download: {
        set: 'false',
        data_type: 'string'
      },
      automation_download: {
        set: 'false',
        data_type: 'string'
      },
      template_download: {
        set: 'false',
        data_type: 'string'
      }
    });
    this.isUserflowInited = true;
    this.startUserflow();
  }

  startUserflow(): void {
    if (this.isUserflowStarted) {
      return;
    }
    if (
      !localStorage.getCrmItem('checklist_state') ||
      localStorage.getCrmItem('checklist_state') == 'start'
    ) {
      if (!this.isSspa) {
        userflow.start(this.checklist_id);
      }
      localStorage.setCrmItem('checklist_state', 'start');
      if (!localStorage.getCrmItem('checklist')) {
        localStorage.setCrmItem('checklist', 'start');
      }
    }
    this.isUserflowStarted = true;
  }

  userflowImpl(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;

          if (profile.user_version < 2.1) {
            this.checkUpdate();
            return;
          }

          this.initUserflow(this.user);

          let isProfile, isEmail;
          if (
            (this.user.user_name &&
              this.user.email &&
              this.user.phone.number) ||
            this.user.onboard.profile
          ) {
            isProfile = 'true';
          } else {
            isProfile = 'false';
          }

          if (this.user.primary_connected || this.user.onboard.connect_email) {
            isEmail = 'true';
          } else {
            isEmail = 'false';
          }

          if (userflow.isIdentified()) {
            userflow.updateUser({
              watch_modal: {
                set: this.user.onboard.watched_modal ? 'true' : 'false',
                data_type: 'string'
              },
              profile: {
                set: isProfile,
                data_type: 'string'
              },
              connect_email: {
                set: isEmail,
                data_type: 'string'
              },
              contact: {
                set: this.user.onboard.created_contact ? 'true' : 'false',
                data_type: 'string'
              },
              upload_video: {
                set: this.user.onboard.upload_video ? 'true' : 'false',
                data_type: 'string'
              },
              send_video: {
                set: this.user.onboard.send_video ? 'true' : 'false',
                data_type: 'string'
              },
              sms: {
                set:
                  this.user.proxy_number ||
                  this.user.twilio_number ||
                  this.user.onboard.sms_service
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              calendar: {
                set:
                  this.user.calendar_list.length ||
                  this.user.onboard.connect_calendar
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              dialer: {
                set:
                  this.user.dialer_info?.is_enabled ||
                  this.user.onboard.dialer_checked
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              account_type: {
                set: this.user.package_level,
                data_type: 'string'
              },
              tour: {
                set: this.user.onboard.tour ? 'true' : 'false',
                data_type: 'string'
              },
              material_download: {
                set: this.user.onboard.material_download ? 'true' : 'false',
                data_type: 'string'
              },
              automation_download: {
                set: this.user.onboard.automation_download ? 'true' : 'false',
                data_type: 'string'
              },
              template_download: {
                set: this.user.onboard.template_download ? 'true' : 'false',
                data_type: 'string'
              }
            });

            if (localStorage.getCrmItem('checklist_state') == 'restart') {
              if (!this.isSspa) {
                userflow.start(this.checklist_id);
              }
              localStorage.setCrmItem('checklist_state', 'start');
              if (!localStorage.getCrmItem('checklist')) {
                localStorage.setCrmItem('checklist', 'start');
              }
            }

            if (!this.user.onboard.watched_modal) {
              if (!this.isSspa) {
                userflow.start(WELCOME_DIALGO_FLOW_ID);
              }
            }
          }

          if (this._isCheckedAllUserflowSteps()) {
            if (localStorage.getCrmItem('checklist') == 'start') {
              localStorage.setCrmItem('checklist', 'done');
            }
            localStorage.setCrmItem('checklist_state', 'end');
            if (!this.user.onboard.complete) {
              if (!this.congratModal) {
                this.congratModal = this.dialog.open(UserflowCongratComponent, {
                  position: { bottom: '55px', right: '100px' },
                  width: '100vw',
                  maxWidth: '380px',
                  disableClose: true,
                  panelClass: 'congrat-panel',
                  backdropClass: 'congrat-backdrop'
                });
                this.congratModal.afterClosed().subscribe(() => {
                  this.user.onboard.complete = true;
                  this.userService
                    .updateProfile({
                      onboard: this.user.onboard
                    })
                    .subscribe(() => {
                      this.userService.updateProfileImpl({
                        onboard: this.user.onboard
                      });
                    });
                  this.checkUpdate();
                });
              }
            } else {
              this.checkUpdate();
            }
          }
        }
      }
    );
  }

  initContactParams(filterStr: string): void {
    if (!filterStr) {
      return;
    }
    try {
      const option = JSON.parse(decodeURI(filterStr));
      const currentOption = this.contactService.searchOption.getValue();
      currentOption.analyticsConditions = [option];
      this.contactService.searchOption.next(currentOption);
    } catch (_) {
      console.error('filter param is not correct.');
    }
  }

  setShowDialog($event): void {
    this.showDialog = $event;
  }

  closeOverlay(): void {
    this.isOverlay = false;
  }

  showDownload(): void {
    this.isDownload = !this.isDownload;
  }

  private _isCheckedAllUserflowSteps() {
    const isCheckedCommonSteps =
      (this.user.primary_connected || this.user.onboard.connect_email) &&
      this.user.onboard.created_contact &&
      (this.user.calendar_list.length || this.user.onboard.connect_calendar) &&
      this.user.onboard.upload_video &&
      this.user.onboard.send_video &&
      (this.user.proxy_number ||
        this.user.twilio_number ||
        this.user.onboard.sms_service) &&
      (this.user.onboard.dialer_checked || this.user.dialer_info?.is_enabled);

    if (environment.isSspa) {
      return isCheckedCommonSteps;
    } else {
      return (
        ((this.user.user_name && this.user.email && this.user.phone.number) ||
          this.user.onboard.profile) &&
        isCheckedCommonSteps &&
        this.user.onboard.tour
      );
    }
  }
}
