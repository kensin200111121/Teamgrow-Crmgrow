import { SspaService } from '../../services/sspa.service';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { DialogSettings, LANG_OPTIONS } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { HandlerService } from '@services/handler.service';
import { NotificationService } from '@services/notification.service';
import { ConnectService } from '@services/connect.service';
import { DealCreateComponent } from '@components/deal-create/deal-create.component';
import { interval, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ContactService } from '@services/contact.service';
import { Contact } from '@models/contact.model';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { SendTextComponent } from '@components/send-text/send-text.component';
import { filter, map } from 'rxjs/operators';
import { StoreService } from '@services/store.service';
import { Cookie } from '@utils/cookie';
import { Account, User } from '@models/user.model';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { SocketService } from '@services/socket.service';
import { ToastrComponent } from '@components/toastr/toastr.component';
import { DealsService } from '@services/deals.service';
import userflow from 'userflow.js';
import { LangService } from '@services/lang.service';
import { Lang } from '@models/dataType';
import { environment } from '@environments/environment';
import { SyncService } from '@app/services/sync.service';
import { ForwardEmailComponent } from '@app/components/forward-email/forward-email.component';
import * as Storm from '@wavv/dialer';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';
import { TeamService } from '@app/services/team.service';
import { Team } from '@app/models/team.model';
import { MaterialCreateComponent } from '@app/components/material-create/material-create.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { CustomFieldService } from '@app/services/custom-field.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly isSspa = environment.isSspa;
  actions: any[] = [
    { icon: 'i-contact bg-white', label: 'New Contact', id: 'contact' },
    {
      icon: 'i-sms-sent bg-white',
      label: 'New Text',
      id: 'text',
      feature: USER_FEATURES.TEXT
    },
    { icon: 'i-message bg-white', label: 'New Email', id: 'message' },
    { icon: 'i-task bg-white', label: 'New Task', id: 'task' },
    {
      icon: 'i-deals bg-white',
      label: 'New Deal',
      id: 'deal',
      feature: USER_FEATURES.PIPELINE
    },
    {
      icon: 'i-calendar bg-white',
      label: 'New Meeting',
      id: 'appointment'
    },
    { icon: 'i-template bg-white', label: 'New Note', id: 'note' },
    {
      icon: 'i-record bg-white',
      label: 'Record Video',
      id: 'record',
      feature: USER_FEATURES.MATERIAL
    },
    {
      icon: 'i-upload bg-white',
      label: 'New Material',
      id: 'video',
      feature: USER_FEATURES.MATERIAL
    }
  ];

  searchDataTypes: any[] = [
    { label: 'Contacts', id: 'contacts' },
    { label: 'Tasks', id: 'tasks' },
    { label: 'Materials', id: 'materials' },
    { label: 'Templates', id: 'templates' }
  ];
  currentSearchType: any = this.searchDataTypes[0];
  keyword = '';
  user_id = '';
  user: User = new User();

  private readonly destroy$ = new Subject();

  // Multi Business Profile Variables
  userList: User[] = [];
  selectedUser: User = new User();
  hasMoreSeat = false;

  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('emailProgress') emailProgress: ElementRef;
  @ViewChild('textProgress') textProgress: ElementRef;
  @ViewChild('automationProgress') automationProgress: ElementRef;
  isSuspended = false;
  isPackageText = true;
  isPurchasedDialer = true;
  isGuest;
  accountRef;
  goMaster = false;
  profileSubscription: Subscription;

  // Notifications
  notificationUpdater$;
  notificationUpdater: Subscription;
  notificationBarResetSubscription: Subscription;
  customFieldSubscription: Subscription;
  systemNotifications = [];
  emailTasks = [];
  textTasks = [];
  automationTasks = [];
  unreadMessages = [];
  unreadMessageCount = 0;
  notifications = [];
  unreadNotificationExist = false;
  showEmails = false;
  showTexts = false;
  showAutomations = false;
  incomingNotifications = [];
  latestAt;
  materialTrackingShower;
  emailDialog;
  textDialog;

  showSystemBar = true;
  showAllSystemNotifications = false;

  notificationSubscription: Subscription;
  notificationCommandSubscription: Subscription;
  readMessageSubscription: Subscription;
  readNotificationSubscription: Subscription;
  accountSubscription: Subscription;
  accountLoadSubscription: Subscription;
  loadingAccount = false;

  draftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createEmailDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;

  draftEmail = {
    subject: '',
    content: ''
  };

  draftText = {
    content: ''
  };

  tasks: any[];
  hasTasks = false;

  languages: Lang[] = LANG_OPTIONS;
  selectedLanguage: Lang = null;
  languageSubscription: Subscription;
  smtpConnectRequiredSubscription: Subscription;
  filterStringUpdate = new Subject<string>();

  internalTeam: Team | null = null;

  constructor(
    public userService: UserService,
    public notificationService: NotificationService,
    public handlerService: HandlerService,
    private connectService: ConnectService,
    private dealService: DealsService,
    private dialog: MatDialog,
    private contactService: ContactService,
    private toast: ToastrService,
    private router: Router,
    private storeService: StoreService,
    private socketService: SocketService,
    private langService: LangService,
    public sspaService: SspaService,
    public teamService: TeamService,
    private syncService: SyncService,
    private featureService: UserFeatureService,
    private customFieldService: CustomFieldService
  ) {
    this.loadingAccount = true;
    this.accountLoadSubscription && this.accountLoadSubscription.unsubscribe();
    this.accountLoadSubscription = this.userService
      .easyLoadSubAccounts()
      .subscribe((res) => {
        if (res && res['status'] && res['data']) {
          const accounts = res['data'].map((e) => new Account().deserialize(e));
          const limit = (res['limit'] || 0) + 1;
          this.userService.accounts.next({ accounts, limit });
        }
        this.loadingAccount = false;
      });

    this.isGuest = localStorage.getCrmItem('guest_loggin');
    this.accountRef = localStorage.getCrmItem('primary_loggin');
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          this.socketService.connect();

          this.initAccountSubscription();
          this.selectedUser = profile;
          this.user_id = profile._id;
          this.isPackageText = profile.text_info?.is_enabled;
          this.isSuspended = profile.subscription?.is_failed;
          if (profile.email_draft) {
            this.draftEmail = profile.email_draft;
          }
          if (profile.text_draft) {
            this.draftText = profile.text_draft;
          }
          if (profile['master_enabled']) {
            this.goMaster = true;
          }

          if (profile.dialer_info && profile.dialer_info.is_enabled) {
            this.isPurchasedDialer = true;
          } else if (
            !profile.is_primary &&
            (profile['dialer'] ||
              profile['parent_company'] === 'EVO' ||
              profile.company === 'EVO')
          ) {
            this.isPurchasedDialer = true;
          } else {
            this.isPurchasedDialer = false;
          }

          if (profile?.proxy_number && !profile?.twilio_number) {
            document.body.classList.add('has-topbar');
          } else {
            document.body.classList.remove('has-topbar');
          }

          if (profile?.notification_info?.lastId) {
            const _lastId = profile.notification_info.lastId;
            const _seenBy = profile.notification_info?.seenBy;
            if (_lastId !== _seenBy) this.unreadNotificationExist = true;
            else this.unreadNotificationExist = false;
          }
        }
      }
    );
    this.getUnreadMessages();
    this.readMessageSubscription && this.readMessageSubscription.unsubscribe();
    this.readMessageSubscription =
      this.handlerService.readMessageContact$.subscribe((res) => {
        if (res && res?.length) {
          res.forEach((elem) => {
            this.unreadMessages.some((e, index) => {
              if (e.contact._id === elem) {
                this.unreadMessages.splice(index, 1);
                return true;
              }
            });
            this.unreadMessages.forEach((e) => {
              if (e.contacts && e.contacts.length) {
                e.contact = new Contact().deserialize(e.contacts[0]);
              }
            });
            if (this.unreadMessageCount > 0) {
              this.unreadMessageCount--;
            }
          });
        }
      });

    this.notificationService.getSystemNotification().subscribe((res) => {
      if (res) {
        this.systemNotifications = [];
        if (res.system_notifications)
          this.systemNotifications = res.system_notifications;
        if (res.personal_notifications)
          this.systemNotifications = [
            ...this.systemNotifications,
            ...res.personal_notifications
          ];
      }
    });

    this.notificationSubscription &&
      this.notificationSubscription.unsubscribe();
    this.notificationSubscription = this.socketService.notification$.subscribe(
      (res) => {
        if (res) {
          this.displayNotification(res);
        }
      }
    );

    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.notificationCommandSubscription =
      this.socketService.command$.subscribe((res) => {
        if (res) {
          this.executeRealtimeCommand(res);
        }
      });

    ////////////////////////////////////////////////////////
    /////////////////// Search Handler ////////////////
    ////////////////////////////////////////////////////////
    /**
     * Filter Objects
     * @param str : keyword to filter the contacts, materials ...
     */
    this.filterStringUpdate
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.handlerService.searchStr.next(value);
      });

    this.runTaskNotification();
  }

  ngOnInit(): void {
    this.connectService.receiveLogout().subscribe(() => {
      this.logout(null);
    });

    this.routerHandle();

    this.languageSubscription && this.languageSubscription.unsubscribe();
    this.languageSubscription = this.langService.language$.subscribe(
      (code: string) => {
        LANG_OPTIONS.some((e: Lang) => {
          if (e.code === code) {
            this.selectedLanguage = e;
            return true;
          }
          return false;
        });
      }
    );

    this.handlerService.scheduleTasks$.subscribe((res) => {
      if (res) {
        this.hasTasks = true;
      } else {
        this.hasTasks = false;
      }
    });

    this.smtpConnectRequiredSubscription &&
      this.smtpConnectRequiredSubscription.unsubscribe();
    this.smtpConnectRequiredSubscription =
      this.syncService.smtpConnectRequired$.subscribe((required: string) => {
        if (required === 'Yes') {
          this.dialog.open(ForwardEmailComponent, {
            width: '100vw',
            maxWidth: '600px',
            disableClose: true
          });
          this.syncService.smtpConnectRequired.next('No');
        }
      });

    this.teamService.teams$
      .pipe(takeUntil(this.destroy$))
      .subscribe((teams) => {
        const internalTeams = teams.filter((e) => e.is_internal);
        if (internalTeams.length > 0) {
          this.internalTeam = internalTeams[0];
        } else {
          this.internalTeam = null;
        }
      });
    this.teamService.loadAll(false);
  }

  ngOnDestroy(): void {
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountLoadSubscription && this.accountLoadSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.notificationBarResetSubscription &&
      this.notificationBarResetSubscription.unsubscribe();
    this.notificationUpdater && this.notificationUpdater.unsubscribe();
    this.readMessageSubscription && this.readMessageSubscription.unsubscribe();
    this.readNotificationSubscription &&
      this.readNotificationSubscription.unsubscribe();
    this.notificationSubscription &&
      this.notificationSubscription.unsubscribe();
    this.languageSubscription && this.languageSubscription.unsubscribe();
    this.latestAt = null;
    document.body.classList.remove('has-topbar');
    this.destroy$.next(true);
    this.internalTeam = null;
  }

  ngAfterViewInit(): void {
    this.notificationUpdater$ = interval(60 * 1000);
    this.notificationBarResetSubscription &&
      this.notificationBarResetSubscription.unsubscribe();
    this.notificationBarResetSubscription =
      this.handlerService.updaterTime$.subscribe(() => {
        this.resetProgressUI();
        this.checkUnReadNotification();
      });
  }

  goToMessage(id: any): void {
    this.router.navigated = false;
    this.router.navigate(['/messages', id]);
  }

  logout(event: Event): void {
    // Logout Logic
    event && event.preventDefault();
    this.socketService.disconnect();
    userflow.reset();
    this.userService.logout().subscribe(
      () => {
        // LOGOUT COOKIE SETTING
        Cookie.setLogout();
        localStorage.removeCrmItem('guest_loggin');
        // Localstorage
        this.userService.clearLocalStorageItem('u_id');

        //clean userflow checklist localstorage
        localStorage.removeCrmItem('checklist_state');
        localStorage.removeCrmItem('checklist');

        this.socketService.clear$();
        this.userService.logoutImpl();
        this.handlerService.clearData();
        this.router.navigate(['/']);
      },
      () => {
        console.log('LOG OUT FAILURE');
      }
    );
  }

  /////////////////////////////////////////////////////////////////////////
  ////////////////////// Action Management /////////////////////////
  /////////////////////////////////////////////////////////////////////////

  runAction(action: string): void {
    // Open New modal that corresponds to action
    switch (action) {
      case 'contact':
        this.dialog
          .open(ContactCreateEditComponent, {
            width: '98vw',
            maxWidth: '600px',
            disableClose: true,
            data: {
              contact: {}
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res && res.created) {
              this.contactService.reloadPage();
            }
          });
        break;
      case 'text':
        this.storeService.textWindowType.next(true);
        if (!this.textDialog) {
          this.textDialog = this.dialog.open(SendTextComponent, {
            position: {
              bottom: '0px',
              right: '0px'
            },
            width: '100vw',
            panelClass: 'send-email',
            backdropClass: 'cdk-send-email',
            disableClose: false,
            data: {
              type: 'multi',
              draft_type: 'global_text',
              draft: this.draftText
            }
          });

          const openedDialogs = this.storeService.openedDraftDialogs.getValue();
          if (openedDialogs && openedDialogs.length > 0) {
            for (const dialog of openedDialogs) {
              if (
                dialog._ref.overlayRef._host.classList.contains('top-dialog')
              ) {
                dialog._ref.overlayRef._host.classList.remove('top-dialog');
              }
            }
          }
          this.textDialog._ref.overlayRef._host.classList.add('top-dialog');
          this.storeService.openedDraftDialogs.next([
            ...openedDialogs,
            this.textDialog
          ]);

          this.textDialog.afterClosed().subscribe((res) => {
            const dialogs = this.storeService.openedDraftDialogs.getValue();
            if (dialogs && dialogs.length > 0) {
              const index = dialogs.findIndex(
                (item) => item.id === this.textDialog.id
              );
              if (index >= 0) {
                dialogs.splice(index, 1);
                this.storeService.openedDraftDialogs.next([...dialogs]);
              }
            }
            this.textDialog = null;
            if (res && res.draft) {
              this.saveTextDraft(res.draft);
              this.storeService.textGlobalDraft.next({});
            }
            if (res && res.send) {
              const data = {
                content: ''
              };
              this.userService.updateTextDraft(data).subscribe((result) => {
                if (result) {
                  this.draftText = data;
                  this.storeService.textGlobalDraft.next({});
                }
              });
            }
          });
        } else {
          const openedDialogs = this.storeService.openedDraftDialogs.getValue();
          if (openedDialogs && openedDialogs.length > 0) {
            for (const dialog of openedDialogs) {
              if (
                dialog._ref.overlayRef._host.classList.contains('top-dialog')
              ) {
                dialog._ref.overlayRef._host.classList.remove('top-dialog');
              }
            }
          }
          this.textDialog._ref.overlayRef._host.classList.add('top-dialog');
        }
        break;
      case 'call':
        break;
      case 'task':
        this.dialog.open(TaskCreateComponent, DialogSettings.TASK);
        break;
      case 'deal':
        this.dialog
          .open(DealCreateComponent, DialogSettings.DEAL)
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.dealService
                .loadStage(this.dealService.selectedPipeline.getValue())
                .subscribe((res) => {
                  this.dealService.pageStages.next(res || []);
                });
            }
          });
        break;
      case 'note':
        this.dialog.open(NoteCreateComponent, DialogSettings.NOTE);
        break;
      case 'appointment':
        this.dialog.open(CalendarEventDialogComponent, {
          width: '100vw',
          maxWidth: '600px',
          data: {
            mode: 'dialog'
          }
        });
        break;
      case 'message':
        this.storeService.emailWindowType.next(true);
        if (!this.emailDialog) {
          this.emailDialog = this.dialog.open(SendEmailComponent, {
            position: {
              bottom: '0px',
              right: '0px'
            },
            width: '100vw',
            maxWidth: '900px',
            panelClass: 'send-email',
            backdropClass: 'cdk-send-email',
            disableClose: true,
            data: {
              type: 'global_email',
              draft: this.draftEmail
            }
          });

          const openedDialogs = this.storeService.openedDraftDialogs.getValue();
          if (openedDialogs && openedDialogs.length > 0) {
            for (const dialog of openedDialogs) {
              if (
                dialog._ref.overlayRef._host.classList.contains('top-dialog')
              ) {
                dialog._ref.overlayRef._host.classList.remove('top-dialog');
              }
            }
          }
          this.emailDialog._ref.overlayRef._host.classList.add('top-dialog');
          this.storeService.openedDraftDialogs.next([
            ...openedDialogs,
            this.emailDialog
          ]);

          this.emailDialog.afterClosed().subscribe((res) => {
            const dialogs = this.storeService.openedDraftDialogs.getValue();
            if (dialogs && dialogs.length > 0) {
              const index = dialogs.findIndex(
                (item) => item.id === this.emailDialog.id
              );
              if (index >= 0) {
                dialogs.splice(index, 1);
                this.storeService.openedDraftDialogs.next([...dialogs]);
              }
            }
            this.emailDialog = null;
            if (res && res.draft) {
              this.saveEmailDraft(res.draft);
              this.storeService.emailGlobalDraft.next({});
            }
            if (res && res.send) {
              const data = {
                subject: '',
                content: ''
              };
              this.userService.updateEmailDraft(data).subscribe((result) => {
                if (result) {
                  this.draftEmail = data;
                  this.storeService.emailGlobalDraft.next({});
                }
              });
            }
          });
        } else {
          const openedDialogs = this.storeService.openedDraftDialogs.getValue();
          if (openedDialogs && openedDialogs.length > 0) {
            for (const dialog of openedDialogs) {
              if (
                dialog._ref.overlayRef._host.classList.contains('top-dialog')
              ) {
                dialog._ref.overlayRef._host.classList.remove('top-dialog');
              }
            }
          }
          this.emailDialog._ref.overlayRef._host.classList.add('top-dialog');
        }
        break;
      case 'record':
        this.handlerService.openRecording.next(new Date().getTime());
        break;
      case 'video':
        //this.router.navigate(['./materials/create/video']);
        this.dialog
          .open(MaterialCreateComponent, {
            maxWidth: '600px',
            disableClose: true,
            data: {}
          })
          .afterClosed()
          .subscribe((res) => {
            if (res.status) {
              this.handlerService.refreshMaterial.next(true);
            }
          });
        break;
    }
    this.closeSearchBar();
  }

  ///////////////////////////////////////////////////////////////////////
  /////////////////// Notification Handler (With API) ///////////////////
  ///////////////////////////////////////////////////////////////////////
  checkUnReadNotification(): void {}

  resetProgressUI(): void {
    const textProgressEl =
      this.textProgress && <HTMLElement>this.textProgress.nativeElement;
    const emailProgressEl =
      this.emailProgress && <HTMLElement>this.emailProgress.nativeElement;
    const automationProgressEl =
      this.automationProgress &&
      <HTMLElement>this.automationProgress.nativeElement;
    if (textProgressEl) {
      const textThumb = textProgressEl.querySelector('.c-thumb');
      if (textThumb) {
        textThumb.classList.remove('animate');
        setTimeout(() => {
          textThumb.classList.add('animate');
        }, 100);
      }
    }
    if (emailProgressEl) {
      const emailThumb = emailProgressEl.querySelector('.c-thumb');
      if (emailThumb) {
        emailThumb.classList.remove('animate');
        setTimeout(() => {
          emailThumb.classList.add('animate');
        }, 100);
      }
    }
    if (automationProgressEl) {
      const automationThumb = automationProgressEl.querySelector('.c-thumb');
      if (automationThumb) {
        automationThumb.classList.remove('animate');
        setTimeout(() => {
          automationThumb.classList.add('animate');
        }, 100);
      }
    }
  }

  closeSystemBar(): void {
    this.showSystemBar = false;
    document.body.classList.remove('has-topbar');
  }

  openAllSystemNotifications(): void {
    this.showAllSystemNotifications = true;
  }

  toggleSearchBar(): void {
    const openSearch = this.handlerService.openSearch.getValue();
    if (openSearch) {
      this.handlerService.openSearch.next(false);
    } else {
      this.handlerService.openSearch.next(true);
      this.searchInput.nativeElement.focus();
    }
  }

  calcDate(date: any): number {
    const currentDate = new Date();
    const dateSent = new Date(date);
    return Math.floor(
      (Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ) -
        Date.UTC(
          dateSent.getFullYear(),
          dateSent.getMonth(),
          dateSent.getDate()
        )) /
        (1000 * 60 * 60 * 24)
    );
  }

  closeSearchBar(): void {
    this.handlerService.openSearch.next(false);
  }
  clearSearch(): void {
    if (this.keyword) {
      this.keyword = '';
      this.filterStringUpdate.next('');
      this.handlerService.searchStr.next('');
    } else {
      this.closeSearchBar();
    }
  }

  ////////////////////////////////////////////////////////
  /////////////////// Sub account handler ////////////////
  ////////////////////////////////////////////////////////
  initAccountSubscription(): void {
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountSubscription = this.userService.accounts$.subscribe(
      (accountInfo) => {
        if (!accountInfo) {
          this.userList = [];
          this.hasMoreSeat = false;
          return;
        }
        const { accounts, limit } = accountInfo;
        if (accounts && accounts.length) {
          this.userList = [];
          this.hasMoreSeat = false;
          const seat_limit = limit || 0;
          let used_seat = 0;
          accounts.forEach((e) => {
            this.userList.push(new Account().deserialize(e));
            used_seat += e.equal_account || 1;
          });

          if (used_seat < seat_limit) {
            this.hasMoreSeat = true;
          } else {
            this.hasMoreSeat = false;
          }
        } else {
          this.userList = [];
          this.hasMoreSeat = false;
        }
      }
    );
  }

  selectUser(user: User): void {
    if (this.selectedUser._id == user._id) {
      return;
    }
    this.userService.changeAccount(user._id).subscribe((res) => {
      if (res['status']) {
        this.socketService.disconnect();
        const token = res.data.token;
        if (token) {
          localStorage.setCrmItem('token', token);
        }
        window.location.reload();
      }
    });
  }

  ////////////////////////////////////////////////////////
  ////////// Email Draft and Text Draft Handler //////////
  ////////////////////////////////////////////////////////
  routerHandle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {})
      )
      .subscribe(() => {
        if (this.emailDialog) {
          const isMaximized = this.storeService.emailWindowType.getValue();
          if (isMaximized) {
            setTimeout(() => {
              const draftData = this.storeService.emailGlobalDraft.getValue();
              this.saveEmailDraft(draftData);
            }, 1000);

            const dialogs = this.storeService.openedDraftDialogs.getValue();
            if (dialogs && dialogs.length > 0) {
              const index = dialogs.findIndex(
                (item) => item.id === this.emailDialog.id
              );
              if (index >= 0) {
                dialogs.splice(index, 1);
                this.storeService.openedDraftDialogs.next([...dialogs]);
              }
            }

            this.emailDialog.close();
            this.emailDialog = null;
          }
        }
        if (this.textDialog) {
          const isMaximized = this.storeService.textWindowType.getValue();
          if (isMaximized) {
            setTimeout(() => {
              const draftData = this.storeService.textGlobalDraft.getValue();
              this.saveTextDraft(draftData);
            }, 1000);

            const dialogs = this.storeService.openedDraftDialogs.getValue();
            if (dialogs && dialogs.length > 0) {
              const index = dialogs.findIndex(
                (item) => item.id === this.textDialog.id
              );
              if (index >= 0) {
                dialogs.splice(index, 1);
                this.storeService.openedDraftDialogs.next([...dialogs]);
              }
            }

            this.textDialog.close();
            this.textDialog = null;
          }
        }
      });
  }
  saveEmailDraft(data): void {
    if (!data.content && !data.subject) {
      if (this.draftEmail.content || this.draftEmail.subject) {
        this.removeEmailDraftSubscription &&
          this.removeEmailDraftSubscription.unsubscribe();
        this.removeEmailDraftSubscription = this.userService
          .updateEmailDraft(data)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = {
                subject: '',
                content: ''
              };
            }
          });
      }
    } else {
      const defaultEmail = this.userService.email.getValue();
      if (this.draftEmail.content || this.draftEmail.subject) {
        if (
          data.subject === this.draftEmail.subject &&
          data.content === this.draftEmail.content
        ) {
          return;
        }
      } else {
        if (defaultEmail) {
          if (
            data.content === defaultEmail.content.replace(/^\s+|\s+$/g, '') &&
            data.subject === defaultEmail.subject
          ) {
            return;
          }
        }
      }

      this.createEmailDraftSubscription &&
        this.createEmailDraftSubscription.unsubscribe();
      this.createEmailDraftSubscription = this.userService
        .updateEmailDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftEmail = data;
          }
        });
    }
  }

  saveTextDraft(data): void {
    if (!data.content) {
      if (this.draftText.content) {
        this.removeTextDraftSubscription &&
          this.removeTextDraftSubscription.unsubscribe();
        this.removeTextDraftSubscription = this.userService
          .updateTextDraft(data)
          .subscribe((res) => {
            if (res) {
              this.draftText = {
                content: ''
              };
            }
          });
      }
    } else {
      const defaultText = this.userService.sms.getValue();
      if (this.draftText.content) {
        if (data.content === this.draftEmail.content) {
          return;
        }
      } else {
        if (defaultText) {
          if (data.content === defaultText.content.replace(/^\s+|\s+$/g, '')) {
            return;
          }
        }
      }

      this.createTextDraftSubscription &&
        this.createTextDraftSubscription.unsubscribe();
      this.createTextDraftSubscription = this.userService
        .updateTextDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftText = data;
          }
        });
    }
  }

  liveTraining(): void {
    if (!this.selectedUser.onboard.tour) {
      this.selectedUser.onboard.tour = true;
      this.userService
        .updateProfile({ onboard: this.selectedUser.onboard })
        .subscribe(() => {
          this.userService.updateProfileImpl({
            onboard: this.selectedUser.onboard
          });
        });
    }
  }

  resetOnboarding(): void {
    localStorage.removeCrmItem('checklist');
    localStorage.setCrmItem('checklist_state', 'restart');
    this.selectedUser.onboard.profile = false;
    this.selectedUser.onboard.connect_email = false;
    this.selectedUser.onboard.connect_calendar = false;
    this.selectedUser.onboard.created_contact = false;
    this.selectedUser.onboard.sms_service = false;
    this.selectedUser.onboard.upload_video = false;
    this.selectedUser.onboard.send_video = false;
    this.selectedUser.onboard.dialer_checked = false;
    this.selectedUser.onboard.tour = false;
    this.selectedUser.onboard.material_download = false;
    this.selectedUser.onboard.complete = false;
    this.userService
      .updateProfile({ onboard: this.selectedUser.onboard })
      .subscribe(() => {
        this.userService.updateProfileImpl({
          onboard: this.selectedUser.onboard
        });
      });
  }
  ////////////////////////////////////////////////////////
  /////////////////// Socket Notification Display /////////////////
  ///////////////////////////////////////////////////////
  displayNotification(_n: any): void {
    this.toast.info('', 'Material is tracked', {
      toastComponent: ToastrComponent,
      enableHtml: true,
      // disableTimeOut: true,
      tapToDismiss: false
    });
  }
  getUnreadMessages(): void {
    this.notificationService.loadUnreadTexts().subscribe((res) => {
      this.unreadMessages = res['data'];

      this.unreadMessages.forEach((e) => {
        if (e.contacts && e.contacts.length) {
          e.contact = new Contact().deserialize(e.contacts[0]);
        }
      });
      this.unreadMessages = this.unreadMessages.filter(
        (item) => item.contacts && item.contacts.length > 0
      );
      if (this.unreadMessages.length > 5) {
        this.unreadMessageCount = this.unreadMessages.length;
        this.unreadMessages = this.unreadMessages.slice(0, 5);
      } else {
        this.unreadMessageCount = this.unreadMessages.length;
      }
    });
  }

  executeRealtimeCommand(_c): void {
    if (_c.command === 'receive_text') {
      this.getUnreadMessages();
      return;
    }
    if (_c.command === 'bulk_email_progress' || _c.command === 'bulk_email') {
      this.runTaskNotification();
      // this.runEmailNotification();
      this.checkUnReadNotification();
      return;
    }
    if (_c.command === 'bulk_text_progress' || _c.command === 'bulk_text') {
      this.runTaskNotification();
      // this.runTextNotification();
      this.checkUnReadNotification();
      return;
    }
    if (_c.command === 'assign_automation_progress') {
      this.runTaskNotification();
      // this.runAutomationNotification();
      this.checkUnReadNotification();
      return;
    }
    if (_c.command === 'load_notification') {
      this.checkUnReadNotification();
      return;
    }
    if (_c.command == 'share_automation') {
      this.checkUnReadNotification();
      return;
    }
    if (_c.command == 'share_material') {
      this.checkUnReadNotification();
      return;
    }
    if (_c.command == 'share_template') {
      this.checkUnReadNotification();
      return;
    }
    if (_c.command == 'team_invited') {
      this.checkUnReadNotification();
      return;
    }
  }

  runTaskNotification(): void {
    this.notificationService.getAllTasks().subscribe((res) => {
      const taskCount = res?.data?.length || 0;
      if (taskCount > 0) {
        this.hasTasks = true;
      } else {
        this.hasTasks = false;
      }
    });
  }

  /**
   * Change the Language
   */
  changeLang(lang: Lang): void {
    this.langService.changeLang(lang.code);
  }

  closeNotificationItem(notification: any): void {
    this.systemNotifications = this.systemNotifications.filter(
      (x) => x._id !== notification._id
    );
  }

  paynow(): void {
    this.userService.proceedInvoice().subscribe((res) => {
      if (res) {
        this.systemNotifications = this.systemNotifications.filter(
          (x) => x.content.indexOf('Pay now') === -1
        );
      } else {
        this.router.navigate([`/profile/billing`]);
      }
    });
  }

  resume(): void {
    this.userService.resumeAccount().subscribe((res) => {
      if (res) {
        this.systemNotifications = this.systemNotifications.filter(
          (x) => x.content.indexOf('Resume') === -1
        );
      } else {
        this.router.navigate([`/profile/billing`]);
      }
    });
  }

  renew(): void {
    this.userService.renewAccount().subscribe((res) => {
      if (res) {
        this.systemNotifications = this.systemNotifications.filter(
          (x) => x.content.indexOf('Renew') === -1
        );
      } else {
        this.router.navigate([`/profile/billing`]);
      }
    });
  }

  activate(): void {
    this.userService.updatePackage({}).subscribe((res) => {
      if (res) {
        this.systemNotifications = this.systemNotifications.filter(
          (x) => x.content.indexOf('Activate') === -1
        );
      } else {
        this.router.navigate([`/profile/billing`]);
      }
    });
  }

  // for notification, there is no way to execute the javascript on global region,
  // so, find the special word. and process this
  @HostListener('click', ['$event.target'])
  notificationItemClick(el: HTMLElement) {
    switch (el.innerText) {
      case 'Pay now':
        this.paynow();
        break;
      case 'Renew subscription':
        this.renew();
        break;
      case 'Resume subscription':
        this.resume();
        break;
      case 'Activate':
        this.activate();
        break;
    }
  }

  purchaseDialer(): void {
    Storm.purchaseDialer();
  }
}
