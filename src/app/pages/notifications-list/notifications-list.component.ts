import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AutomationShowFullComponent } from '@components/automation-show-full/automation-show-full.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import { NotificationService } from '@services/notification.service';
import { getDuration, getNotificationDetail } from '@utils/functions';
import { Contact } from '@models/contact.model';
import { UserService } from '@services/user.service';
import { ActivatedRoute } from '@angular/router';
import { HandlerService } from '@services/handler.service';
import { Location } from '@angular/common';
import { TimeagoIntl } from 'ngx-timeago';
import { strings as stringsEn } from 'ngx-timeago/language-strings/en';
import { strings as stringsFr } from 'ngx-timeago/language-strings/fr';
import { strings as stringsEs } from 'ngx-timeago/language-strings/es';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { de } from 'date-fns/locale';
@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class NotificationsListComponent implements OnInit, OnDestroy {
  DISPLAY_COLUMNS = ['select', 'icon', 'content', 'action'];
  ACTIONS = [
    {
      label: 'Mark as read',
      loadingLabel: 'Marking as read...',
      type: 'button',
      command: 'edit',
      loading: false
    },
    {
      label: 'Delete',
      loadingLabel: 'Deleting...',
      type: 'button',
      command: 'delete',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    },
    {
      label: 'SelectAll',
      type: 'button',
      command: 'selectall',
      loading: false
    }
  ];
  SELECTALL_ACTIONS = [
    {
      label: 'Mark as read',
      loadingLabel: 'Marking as read...',
      type: 'button',
      command: 'edit',
      loading: false
    },
    {
      label: 'Delete',
      loadingLabel: 'Deleting...',
      type: 'button',
      command: 'delete',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ];
  DESELECT_ACTIONS = [
    {
      label: 'Mark as read',
      loadingLabel: 'Marking as read...',
      type: 'button',
      command: 'edit',
      loading: false
    },
    {
      label: 'Delete',
      loadingLabel: 'Deleting...',
      type: 'button',
      command: 'delete',
      loading: false
    },
    {
      label: 'SelectAll',
      type: 'button',
      command: 'selectall',
      loading: false
    }
  ];
  ICONS = {
    material_track: 'i-video',
    unsubscribe: '',
    open_email: '',
    click_link: '',
    bulk_email: '',
    bulk_sms: ''
  };
  notifications: any[] = [];
  loading = false;
  loadSubscription: Subscription;
  page = 1;
  total = 0;
  getNotificationDetail = getNotificationDetail;
  selectedIds = [];

  deleting = false;
  updating = false;

  showingDetails = [];
  showingMax = 3;

  userId = '';
  profileSubscription: Subscription;
  setAllRead = false;
  constructor(
    private notificationService: NotificationService,
    private userService: UserService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private location: Location,
    public sspaService: SspaService,
    public intl: TimeagoIntl,
    private translateService: TranslateService
  ) {
    const locale = this.translateService.currentLang;
    if (locale == 'en') {
      intl.strings = stringsEn;
    } else if (locale == 'fr') {
      intl.strings = stringsFr;
    } else if (locale == 'es') {
      intl.strings = stringsEs;
    }
    intl.changes.next();
    this.route.queryParams.subscribe((params) => {
      if (params && params.id) {
        if (this.notifications && this.notifications.length) {
          const selectedNotification = this.notifications.filter(
            (e) => e._id === params.id
          )[0];
          if (selectedNotification) {
            // Find and Scroll to there
            this.location.replaceState('/notifications');
            setTimeout(() => {
              if (document.querySelector('#nl_' + params.id)) {
                document.querySelector('#nl_' + params.id).scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'center'
                });
                this.showDetails(selectedNotification);
              }
            }, 500);
          } else {
            // else page load
            this.findNotification(params.id);
          }
        } else {
          this.findNotification(params.id);
        }
      } else {
        this.loadPage(1);
      }
    });
    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      // do something on language change
      if (event.lang == 'en') {
        intl.strings = stringsEn;
      } else if (event.lang == 'fr') {
        intl.strings = stringsFr;
      } else if (event.lang == 'es') {
        intl.strings = stringsEs;
      }
      intl.changes.next();
    });
    // this.loadPage(1);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user && user._id) {
        this.userId = user._id;
        if (!this.setAllRead) {
          const lastId = user.notification_info?.lastId;
          this.setAllNotificationRead(lastId);
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }
  getCreator = (notification: any): string => {
    let creator = '';
    if (notification.creator) {
      creator = `<span class="creator">${notification.creator.user_name}</span>`;
    } else if (notification.contact && notification.contact.length) {
      const contact = new Contact().deserialize(notification.contact[0]);
      creator = `<a>${contact.fullName}</a>`;
    } else {
      creator = 'Someone';
    }
    return creator;
  };
  getTeam = (notification: any): string => {
    let team = '<a>Unknown Community</a>';
    if (notification.team) {
      team = `<a>${notification.team.name}</a>`;
    }
    return team;
  };
  getFullName = (notification: any): string => {
    const contact = new Contact().deserialize(notification.contact[0]);
    return contact?.fullName;
  };
  getMaterial = (notification: any): string => {
    if (
      notification.action &&
      notification.action.object &&
      notification.action[notification.action.object] &&
      notification.action[notification.action.object].length
    ) {
      return `the ${notification.action.object} <a>${
        notification.action[notification.action.object][0].title
      }</a>`;
    } else {
      return 'your material';
    }
  };
  getDetail = (notification: any): string => {
    let detail = '';
    if (notification.criteria == 'material_track') {
      if (notification.action && notification.video_tracker) {
        const duration = Math.round(notification.video_tracker.duration / 1000);
        detail = `for ${getDuration(duration * 1000)}`;
      } else {
        detail = '';
      }
      return detail;
    }

    if (notification.criteria === 'share_material') {
      if (notification.action?.image?.length > 0) {
        detail = `<a>${notification.action.image[0]?.title} Image</a>`;
      } else if (notification.action?.pdf?.length > 0) {
        detail = `<a>${notification.action.pdf[0]?.title} Pdf</a>`;
      } else if (notification.action?.video?.length > 0) {
        detail = `<a>${notification.action.video[0]?.title} Video</a>`;
      }
      return detail;
    }

    if (notification.criteria === 'share_folder') {
      if (notification.action?.folder?.length > 0) {
        detail = `<a>${notification.action.folder[0]?.title} Folder</a>`;
      }
      return detail;
    }

    if (
      notification.action &&
      notification.action.pipeline &&
      notification.action.pipeline.length
    ) {
      detail = `<a>${notification.action.pipeline[0].title}</a>`;
    } else if (
      notification.action &&
      notification.action.automation &&
      notification.action.automation.length
    ) {
      detail = `<a>${notification.action.automation[0].title}</a>`;
    } else if (
      notification.action &&
      notification.action.template &&
      notification.action.template.length
    ) {
      detail = `<a>${notification.action.template[0].title}</a>`;
    } else if (notification.contact && notification.contact.length) {
      const contact = new Contact().deserialize(notification.contact[0]);
      detail = `<a>${contact.fullName}</a>`;
    } else if (notification.content) {
      return notification.content;
    } else if (notification.content) {
      return notification.content;
    } else {
      detail = '<a>Unknown Pipeline</a>';
    }
    return detail;
  };
  getTemplateTxt = (notification: any): string => {
    let content = '';
    switch (notification.criteria) {
      case 'team_invited':
      case 'team_accept':
      case 'team_reject':
      case 'team_requested':
      case 'join_accept':
      case 'join_reject':
      case 'team_remove':
      case 'team_member_remove':
      case 'share_pipeline':
      case 'share_automation':
      case 'stop_share_automation':
      case 'share_template':
      case 'stop_share_template':
      case 'share_material':
      case 'share_folder':
      case 'material_track':
      case 'stop_share_material':
      case 'stop_share_folder':
      case 'contact_shared':
      case 'stop_share_contact':
      case 'accept_share_contact':
      case 'open_email':
      case 'click_link':
      case 'team_role_change':
        if (notification.content) {
          content = notification.content;
        } else {
          content = notification.criteria;
        }
        break;
      case 'unsubscribe':
        if (notification.content) {
          content = notification.content;
        } else {
          content = 'unsubscribe_template';
        }
        break;
      case 'dialer_call':
        if (
          notification &&
          notification.contact &&
          notification.contact.length
        ) {
          content = 'dialer_call';
        } else {
          content = 'dialer_call_someone';
        }
        break;
      case 'bulk_sms':
        if (notification.status == 'sent') {
          content = 'bulk_sms_sent';
        } else if (notification.status == 'completed') {
          if (notification.deliver_status) {
            content = 'bulk_sms_complete_succeed';
          } else {
            content = 'bulk_sms_complete_failed';
          }
        } else if (notification.status == 'delivered') {
          content = 'bulk_sms_delivered';
        } else if (notification.status == 'undelivered') {
          content = 'bulk_sms_undelivered';
        } else {
          content = 'bulk_sms_default';
        }
        break;
      case 'bulk_text':
        if (notification.status === 'pending') {
          content = 'bulk_text_pending';
        } else if (notification.status === 'completed') {
          const failed = notification.deliver_status?.failed?.length;
          if (!failed) {
            content = 'bulk_text_completed_succeed';
          } else {
            content = 'bulk_text_completed_failed';
          }
        } else {
          content = 'bulk_text_other';
        }
        break;
      case 'send_text':
        if (notification.status === 'pending') {
          content = 'send_text_pending';
        } else if (notification.status === 'completed') {
          const failed = notification.deliver_status?.failed?.length;
          if (!failed) {
            content = 'send_text_success';
          } else {
            content = 'send_text_failed';
          }
        } else {
          content = 'send_text_other';
        }
      case 'assign_automation':
        if (notification.status === 'pending') {
          content = 'assign_automation_pending';
        } else if (notification.status === 'completed') {
          const failed = notification.deliver_status?.failed?.length;
          if (!failed) {
            content = 'assign_automation_success';
          } else {
            content = 'assign_automation_failed';
          }
        } else {
          content = 'assign_automation_other';
        }
        break;
      case 'automation_completed':
        if (notification.contact && notification.contact.length) {
          if (notification.detail?.title) {
            content = 'automation_completed_title';
          } else {
            content = 'automation_completed_no_title';
          }
        } else if (notification.deal && notification.deal.length) {
          if (notification.detail?.title) {
            content = 'automation_completed_deal_title';
          } else {
            content = 'automation_completed_deal_no_title';
          }
        } else {
          content = notification.content;
        }
        break;
      case 'bulk_email':
        if (notification.status === 'pending') {
          content = 'bulk_email_pending';
        } else if (notification.status === 'completed') {
          if (notification.deliver_status) {
            const failed = notification.deliver_status?.failed?.length;
            if (!failed) {
              content = 'bulk_email_succeed';
            } else {
              content = 'bulk_email_failed';
            }
          }
        } else {
          content = 'bulk_email_pending_now';
        }
        break;
      case 'send_email':
        if (notification.status === 'pending') {
          content = 'send_email_pending';
        } else if (notification.status === 'completed') {
          if (notification.deliver_status) {
            const failed = notification.deliver_status?.failed?.length;
            if (!failed) {
              content = 'send_email_succeed';
            } else {
              content = 'send_email_failed';
            }
          }
        } else {
          content = 'send_email_pending_now';
        }
        break;
      default:
        content = notification.content;
        break;
    }
    return content;
  };
  getFailCount = (item: any): number => {
    return item.deliver_status?.failed?.length;
  };
  getTotalCount = (item: any): number => {
    if (item.criteria == 'bulk_text' || item.criteria == 'bulk_sms') {
      const failed = item.deliver_status.failed.length;
      const succeed = item.deliver_status.succeed.length;
      return failed + succeed;
    } else {
      return item.contact?.length;
    }
  };
  getContactCount = (item: any): number => {
    if (item.criteria == 'bulk_text' || item.criteria == 'send_text') {
      return item.deliver_status?.failed?.length;
    } else {
      return item.contact.length;
    }
  };
  setAllNotificationRead(lastId: string): void {
    if (!lastId) return;
    const data = {
      notification_info: {
        seenBy: lastId,
        lastId: lastId
      }
    };
    this.userService.updateProfile(data).subscribe(() => {
      this.setAllRead = true;
      this.userService.updateProfileImpl(data);
    });
  }
  isCompleted(item: any): boolean {
    if (item.status == 'completed') return true;
    else return false;
  }
  isPending(item: any): boolean {
    if (item.status == 'pending') return true;
    else return false;
  }
  isSent(item: any): boolean {
    if (item.status == 'sent') return true;
    else return false;
  }

  loadPage(page: number): void {
    this.page = page;
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.notificationService.getByPage(page).subscribe(
      (res) => {
        this.loading = false;
        if (res['notifications'] && res['notifications'].length) {
          this.notifications = res['notifications'];
          this.notificationService.pageNotifications.next(res['notifications']);
          this.notifications.forEach((e) => {
            if (e.contact && e.contact.length === 1) {
              e.mainContact = new Contact().deserialize(e.contact[0]);
            }
            if (!e.user) {
              e.is_read = e.read_status
                ? e.read_status[this.userId] || false
                : false;
            }
            if (e.criteria === 'material_track' && e.action) {
              if (e.action.object === 'video') {
                e.material = e.action.video[0];
              }
              if (e.action.object === 'pdf') {
                e.material = e.action.pdf[0];
              }
              if (e.action.object === 'image') {
                e.material = e.action.image[0];
              }
            }
          });
        }
        if (res['notifications'] && res['notifications'].length === 0) {
          this.total = 0;
        } else {
          this.total = res['total'];
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  findNotification(notificationId: string): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.notificationService
      .getByPage(1, notificationId)
      .subscribe(
        (res) => {
          this.loading = false;
          this.location.replaceState('/notifications');
          if (res['notifications'] && res['notifications'].length) {
            this.notifications = res['notifications'];
            this.notifications.forEach((e) => {
              if (e.contact && e.contact.length === 1) {
                e.mainContact = new Contact().deserialize(e.contact[0]);
              }
              if (!e.user) {
                e.is_read = e.read_status
                  ? e.read_status[this.userId] || false
                  : false;
              }
              if (e.criteria === 'material_track' && e.action) {
                if (e.action.object === 'video') {
                  e.material = e.action.video[0];
                }
                if (e.action.object === 'pdf') {
                  e.material = e.action.pdf[0];
                }
                if (e.action.object === 'image') {
                  e.material = e.action.image[0];
                }
              }
            });
          }
          if (res['notifications'] && res['notifications'].length === 0) {
            this.total = 0;
          } else {
            this.total = res['total'];
          }
          if (res['page']) {
            this.page = res['page'];
          }
          // Scroll Down to the current
          setTimeout(() => {
            if (document.querySelector('#nl_' + notificationId)) {
              document.querySelector('#nl_' + notificationId).scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
              });
              const notification = this.notifications.filter(
                (e) => e._id === notificationId
              )[0];
              this.showDetails(notification);
            }
          }, 500);
        },
        (err) => {
          this.loading = false;
        }
      );
  }

  setAsRead(item: any): void {
    this.notificationService.setAsRead([item._id]).subscribe((res) => {
      item.is_read = true;
    });
  }

  setAsUnread(item: any): void {
    this.notificationService.setAsUnread([item._id]).subscribe((res) => {
      item.is_read = false;
    });
  }
  readNotifications(ids: string[]): void {
    this.updating = true;
    this.notificationService.setAsRead(ids).subscribe(() => {
      this.updating = false;
      this.notifications.forEach((e) => {
        if (ids.indexOf(e._id) !== -1) {
          e.is_read = true;
        }
      });
      this.handlerService.readNotification.next({ ids });
    });
  }

  delete(item: any): void {
    this.notificationService.delete([item._id]).subscribe((res) => {
      if (this.notifications.length > 1) {
        this.loadPage(this.page);
      } else {
        this.page--;
        this.page = this.page > 0 ? this.page : 1;
        this.loadPage(this.page);
      }
    });
  }
  deleteItems(ids): void {
    this.deleting = true;
    this.notificationService.delete(ids).subscribe((res) => {
      this.deleting = false;
      this.notifications = this.notifications.filter((e) => {
        if (this.selectedIds.indexOf(e._id) === -1) {
          return true;
        }
        return false;
      });
      this.selectedIds = [];
      if (this.notifications.length > 1) {
        this.loadPage(this.page);
      } else {
        this.page--;
        this.page = this.page > 0 ? this.page : 1;
        this.loadPage(this.page);
      }
    });
  }

  toggle(item): void {
    const pos = this.selectedIds.indexOf(item._id);
    if (pos !== -1) {
      this.selectedIds.splice(pos, 1);
    } else {
      this.selectedIds.push(item._id);
    }
  }
  isSelected(item): boolean {
    const pos = this.selectedIds.indexOf(item._id);
    return pos !== -1;
  }
  isAllSelected(): boolean {
    if (this.total == this.selectedIds.length) {
      return true;
    } else {
      return false;
    }
  }
  isAllSelected_Page(): boolean {
    const selected = this.notifications.filter((e) => {
      return this.selectedIds.indexOf(e._id) !== -1;
    });
    return selected.length === this.notifications.length;
  }
  masterToggle(): void {
    if (this.isAllSelected_Page()) {
      this.notifications.forEach((e) => {
        const pos = this.selectedIds.indexOf(e._id);
        if (pos !== -1) {
          this.selectedIds.splice(pos, 1);
        }
      });
    } else {
      this.notifications.forEach((e) => {
        if (this.selectedIds.indexOf(e._id) === -1) {
          this.selectedIds.push(e._id);
        }
      });
    }
  }
  showDetails(item): void {
    const pos = this.showingDetails.indexOf(item._id);
    if (pos !== -1) {
      this.showingDetails.splice(pos, 1);
    } else {
      if (this.showingDetails.length < this.showingMax) {
        this.showingDetails.push(item._id);
      } else {
        this.showingDetails.shift();
        this.showingDetails.push(item._id);
      }

      // read mark this notification
      if (!item.is_read) {
        this.readNotifications([item._id]);
        item.is_read = true;
      }
    }
  }
  doAction(event): void {
    switch (event.command) {
      case 'deselect':
        this.selectedIds = [];
        this.notifications =
          this.notificationService.pageNotifications.getValue();
        break;
      case 'delete':
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Delete notifications',
              message: 'Are you sure to delete selected notifications?',
              confirmLabel: 'Delete',
              mode: 'warning'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.deleteItems(this.selectedIds);
            }
          });
        break;
      case 'selectall':
        this.selectAll();

        break;
      case 'edit':
        this.readNotifications(this.selectedIds);
        break;
    }
  }
  selectAll(): void {
    this.loading = true;
    this.notificationService.getAll().subscribe((res) => {
      const notifications = res['result'];
      console.log('notifications', notifications);
      this.selectedIds = [];
      notifications.forEach((e) => {
        if (this.selectedIds.indexOf(e._id) === -1) {
          this.selectedIds.push(e._id);
        }
      });
      this.loading = false;
    });
  }
  readAll(): void {
    this.updating = true;
    this.notificationService.setAsRead([], 'all').subscribe((status) => {
      this.updating = false;
      if (status) {
        this.notifications.forEach((e) => {
          this.notifications.forEach((e) => {
            e.is_read = true;
          });
          this.handlerService.readNotification.next({ mode: 'all' });
        });
      }
    });
  }
  deleteAll(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete notifications',
          message:
            'This action cannot be undone. Are you sure to delete all notifications?',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.notificationService.delete([], 'all').subscribe((status) => {
            if (status) {
              this.notifications = this.notifications.filter(
                (e) => e.type === 'global'
              );
              this.selectedIds = [];
              this.total = this.notifications.length;
              this.page = 1;
              this.handlerService.readNotification.next({ mode: 'all-remove' });
            }
          });
        }
      });
  }

  seeAutomationResult(element): void {
    if (element?.detail?.actions?.length) {
      this.dialog.open(AutomationShowFullComponent, {
        position: { top: '100px' },
        width: '98vw',
        maxWidth: '700px',
        height: 'calc(60vh + 70px)',
        data: {
          id: element?.detail?._id,
          automation: {
            id: element?.detail?._id,
            title: element?.detail?.title
          },
          automations: element?.detail?.actions
        }
      });
    }
  }

  expandCallNote(event): void {
    const noteContentDom = event.target.closest('.call-note-content');
    if (noteContentDom) {
      noteContentDom.classList.add('expanded');
    }
  }

  collapseCallNote(event): void {
    const noteContentDom = event.target.closest('.call-note-content');
    if (noteContentDom) {
      noteContentDom.classList.remove('expanded');
    }
  }

  getCreatorTitle(criteria) {
    const Creators = {
      team_invited: 'Sender:',
      team_accepted: 'Recipient:',
      team_rejected: 'Recipient:',
      team_requested: 'Sender:',
      join_accept: 'Recipient:',
      join_reject: 'Recipient:',
      team_remove: 'Owner:',
      team_member_remove: 'Owner:',
      team_role_change: 'Owner:'
    };
    return Creators[criteria] || 'User:';
  }

  TEAM_NOTIFICATION_CRITERIAS = [
    'team_invited',
    'team_accepted',
    'team_rejected',
    'team_requested',
    'join_accept',
    'join_reject',
    'team_remove',
    'team_member_remove',
    'team_role_change',
    'share_automation',
    'stop_share_automation',
    'share_template',
    'stop_share_template',
    'contact_shared',
    'stop_share_contact',
    'share_material',
    'stop_share_material',
    'share_folder',
    'stop_share_folder',
    'share_pipeline',
    'team_accept',
    'accept_share_contact',
    'accept_transfer_contact',
    'accept_clone_contact',
    'decline_share_contact',
    'decline_transfer_contact',
    'decline_clone_contact'
  ];
  EMAIL_NOTIFICATION_CRITERIAS = ['unsubscribe', 'open_email', 'click_link'];
}
