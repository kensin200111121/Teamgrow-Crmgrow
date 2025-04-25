import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CampContact, Contact } from '@models/contact.model';
import { Material } from '@models/material.model';
import { CampaignService } from '@services/campaign.service';
import * as _ from 'lodash';
import { StoreService } from '@services/store.service';
import { HandlerService } from '@services/handler.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogSettings } from '@constants/variable.constants';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { RouterService } from '@app/services/router.service';

@Component({
  selector: 'app-campaign-bulk-mailing-item',
  templateUrl: './campaign-bulk-mailing-item.component.html',
  styleUrls: ['./campaign-bulk-mailing-item.component.scss']
})
export class CampaignBulkMailingItemComponent implements OnInit, OnDestroy {
  loading = false;
  reloading = false;
  sessionLoading = false;
  id = '';
  campaign;
  mailTemplate;
  sessions = [];
  status = {
    contact: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    awaiting: 0,
    open: 0,
    click: 0,
    unsubscribe: 0,
    watched: 0,
    all: 0
  };
  activities = {
    all: {
      data: [],
      page: 1,
      loading: false,
      contacts: [],
      activities: {},
      pageSize: 50
    },
    contact: {
      data: [],
      page: 1,
      loading: false,
      pageSize: 50
    },
    sent: {
      data: [],
      page: 1,
      loading: false,
      pageSize: 50
    },
    delivered: {
      data: [],
      page: 1,
      loading: false,
      pageSize: 50
    },
    failed: {
      data: [],
      page: 1,
      loading: false,
      pageSize: 50
    },
    awaiting: {
      data: [],
      page: 1,
      loading: false,
      pageSize: 50
    },
    open: {
      data: [],
      page: 1,
      loading: false,
      contacts: [],
      activities: {},
      pageSize: 50
    },
    click: {
      data: [],
      page: 1,
      loading: false,
      contacts: [],
      activityJSON: {},
      pageSize: 50
    },
    unsubscribe: {
      data: [],
      page: 1,
      loading: false,
      contacts: [],
      activities: {},
      pageSize: 50
    },
    watched: {
      data: [],
      page: 1,
      loading: false,
      contacts: [],
      activities: {},
      pageSize: 50
    }
  };
  currentPanel = 'all';
  showMode = 'time';

  loadSubscription: Subscription;
  loadSessionSubscription: Subscription;
  loadPanelSubscription: Subscription;
  routeSubscription: Subscription;

  selectedContact = '';
  selectedActivity = '';

  limit = 50;

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  pageSize = this.PAGE_COUNTS[3];
  page = 1;

  DISPLAY_COLUMNS = [
    'contact_name',
    'contact_label',
    'last_activity',
    'contact_email',
    'status',
    'action'
  ];
  FILTER_TYPES = [
    { id: 'time', label: 'Activities' },
    { id: 'contact', label: 'Contacts' }
  ];

  isAbleEdit = false;
  editingTemplate = false;

  constructor(
    private campaignService: CampaignService,
    private storeService: StoreService,
    private handlerService: HandlerService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private routerService: RouterService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.id = params['id'];
      const prevPage = this.routerService.previousUrl;
      if (prevPage && prevPage.indexOf('/contacts/') !== -1) {
        const campaignData = this.storeService.campaignData.getValue();
        if (campaignData.id === this.id) {
          this.loadPrev();
          this.loadMain(true);
          this.loadSessions();
          return;
        }
      }
      this.loadMain();
      this.loadSessions();
      this.loadActivities();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSessionSubscription && this.loadSessionSubscription.unsubscribe();
  }

  loadPrev(): void {
    const campaignData = this.storeService.campaignData.getValue();
    this.campaign = campaignData?.campaign;
    this.status = campaignData?.status;
    this.activities = campaignData?.activities;

    this.initTemplateAndMaterials();
  }

  loadMain(reload = false): void {
    if (reload) {
      this.reloading = true;
    } else {
      this.loading = true;
    }
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.campaignService
      .get(this.id)
      .subscribe((res) => {
        if (reload) {
          this.reloading = false;
        } else {
          this.loading = false;
        }
        if (res) {
          this.campaign = res?.campaign;
          this.status.open = res?.opened || 0;
          this.status.click = res?.clicked || 0;
          this.status.unsubscribe = res?.unsubscribed || 0;
          this.status.watched = res?.watched || 0;

          const campaignStatus = res?.campaignStatus[0] || {};
          this.status.sent = campaignStatus?.sent || 0;
          this.status.failed = campaignStatus?.failed || 0;
          if (this.status.failed > this.status.sent) {
            this.status.sent = this.status.failed;
          }
          this.status.delivered = this.status.sent - this.status.failed;
          this.status.awaiting = this.campaign.contacts - this.status.sent;
          this.status.contact = this.campaign.contacts;

          this.initTemplateAndMaterials();
        }
      });
  }

  /**
   * Init the template data and materials for this campaign.
   */
  initTemplateAndMaterials(): void {
    if (this.status.awaiting) {
      this.isAbleEdit = true;
    } else {
      this.isAbleEdit = false;
    }

    if (this.campaign?.newsletter) {
      this.mailTemplate = this.campaign?.newsletter;
    } else if (this.campaign?.email_template) {
      this.mailTemplate = this.campaign?.email_template;
    } else {
      this.mailTemplate = {
        subject: this.campaign?.subject,
        content: this.campaign?.content,
        video_ids: this.campaign?.videos,
        image_ids: this.campaign?.images,
        pdf_ids: this.campaign?.pdfs
      };
    }
  }

  loadSessions(): void {
    this.sessionLoading = true;
    this.loadSessionSubscription && this.loadSessionSubscription.unsubscribe();
    this.loadSessionSubscription = this.campaignService
      .loadSessions(this.id)
      .subscribe((sessions) => {
        this.sessionLoading = false;
        sessions.forEach((e) => {
          let sent_count = 0;
          let sentChunk = 0;
          let awaitingChunk = 0;
          e.sent.forEach((e) => {
            if (e.status === 'done') {
              sent_count += e.contacts;
              sentChunk++;
            } else {
              awaitingChunk++;
            }
          });
          if (sentChunk && awaitingChunk) {
            e.status = 'sending';
          } else if (!sentChunk && awaitingChunk) {
            e.status = 'awaiting';
          } else if (sentChunk && !awaitingChunk) {
            e.status = 'done';
          }
          e.sent_count = sent_count;
          e.delivered = e.sent_count - e.failed;
        });
        sessions.sort((a, b) => {
          if (a.start_at < b.start_at) {
            return -1;
          }
          return 1;
        });
        this.sessions = sessions;
      });
  }

  loadActivities(): void {
    this.currentPanel = 'all';
    this.activities.all.loading = true;
    this.campaignService
      .loadActivities(this.id, {
        limit: this.activities[this.currentPanel].pageSize || 50,
        page: 1,
        category: 'all'
      })
      .subscribe((res) => {
        this.activities.all.loading = false;
        if (res) {
          if (this.currentPanel === 'all') {
            this.status.all = res['total'] || 0;
            this.activities.all.data = res['activities'] || [];
            this.activities['all'].data.forEach((e) => {
              e.contact = new Contact().deserialize(e.contacts);
            });
            this.filterByContact('all');
          }
        }
      });
  }

  changePanel(panel: string): void {
    this.currentPanel = panel;
    const page = this.activities[panel].page;
    this.activities[panel].loading = true;
    this.campaignService
      .loadActivities(this.id, {
        category: panel,
        page,
        limit: this.activities[panel].pageSize
      })
      .subscribe((res) => {
        this.activities[panel].loading = false;
        if (res) {
          this.fillData(panel, res);
        }
      });
  }

  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    const pageOption = {
      page: this.page,
      pageSize: this.pageSize.id,
      searchCondition: {
        title: false,
        status: false,
        due_start: false
      },
      selectedSort: ''
    };
    // Check with the Prev Page Size
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      this.changePage(this.page);
    }
  }

  changePage(page: number): void {
    this.activities[this.currentPanel].page = page;
    this.activities[this.currentPanel].loading = true;
    const panel = this.currentPanel === 'all' ? '' : this.currentPanel;
    this.campaignService
      .loadActivities(this.id, {
        category: panel,
        page,
        limit: this.pageSize.id || 50
      })
      .subscribe((res) => {
        this.activities[this.currentPanel].loading = false;
        if (res) {
          this.fillData(this.currentPanel, res);
        }
      });
  }

  fillData(panel: string, res: any): void {
    if (
      panel !== 'awaiting' &&
      panel !== 'sent' &&
      panel !== 'failed' &&
      panel !== 'contact'
    ) {
      this.activities[panel].data = res['activities'] || [];
      this.activities[panel].data.forEach((e) => {
        e.contact = new Contact().deserialize(e.contacts);
      });
      this.filterByContact(panel);
    } else if (panel === 'awaiting') {
      const contactIds = res['contactIds'];
      const contacts = res['contacts'];
      const loadIds = contacts.map((e) => e._id);
      const removedContactIds = _.difference(contactIds, loadIds);
      // Fill with removed contacts
      removedContactIds.forEach((id) => {
        contacts.push({ _id: id, first_name: id, not_found: true });
      });
      const campContacts = [];
      contacts.forEach((e) => {
        campContacts.push(new CampContact().deserialize(e));
      });
      this.activities[panel].data = campContacts;
    } else if (panel === 'sent') {
      const contactIds = res['contactIds'];
      const contacts = res['contacts'];
      const failed = res['failed'];
      const loadIds = contacts.map((e) => e._id);
      const removedContactIds = _.difference(contactIds, loadIds);
      // Fill with removed contacts and failed reasons
      removedContactIds.forEach((id) => {
        contacts.push({ _id: id, first_name: id, not_found: true });
      });
      const campContacts = [];
      contacts.forEach((e) => {
        if (failed.indexOf(e._id) !== -1) {
          e.status = 'failed';
        } else {
          e.status = 'delivered';
        }
        campContacts.push(new CampContact().deserialize(e));
      });
      this.activities[panel].data = campContacts;
    } else if (panel === 'failed') {
      const contactIds = res['contactIds'];
      const contacts = res['contacts'];
      const failed = res['failed'];
      const loadIds = contacts.map((e) => e._id);
      const removedContactIds = _.difference(contactIds, loadIds);
      const failedReasons = _.keyBy(failed, 'contact');
      // Fill with removed contacts and failed reasons
      removedContactIds.forEach((id) => {
        contacts.push({ _id: id, first_name: id, not_found: true });
      });
      const campContacts = [];
      contacts.forEach((e) => {
        if (failedReasons[e._id]) {
          e.failed = true;
          e.failed_reason = failedReasons[e._id].error;
          e.failed_type = failedReasons[e._id].type;
        }
        campContacts.push(new CampContact().deserialize(e));
      });
      this.activities[panel].data = campContacts;
    } else if (panel === 'contact') {
      const contactIds = res['contactIds'];
      const contacts = res['contacts'];
      const failed = res['failed'];
      const sent = res['sent'];
      const loadIds = contacts.map((e) => e._id);
      const removedContactIds = _.difference(contactIds, loadIds);
      // Fill with removed contacts and failed reasons
      removedContactIds.forEach((id) => {
        contacts.push({ _id: id, first_name: id, not_found: true });
      });
      const campContacts = [];
      contacts.forEach((e) => {
        if (sent.indexOf(e._id) !== -1) {
          if (failed.indexOf(e._id) !== -1) {
            e.status = 'failed';
          } else {
            e.status = 'delivered';
          }
        } else {
          e.status = 'awaiting';
        }
        campContacts.push(new CampContact().deserialize(e));
      });
      this.activities[panel].data = campContacts;
    }
  }

  filterByContact(panel: string): void {
    const contacts = this.activities[panel].data.map((e) => e.contact);
    this.activities[panel].contacts = _.uniqBy(contacts, '_id');
    this.activities[panel].activities = _.groupBy(
      this.activities[panel].data,
      (e) => e.contact._id
    );
  }

  selectContact(contact: any): void {
    if (this.selectedContact === contact._id) {
      this.selectedContact = '';
    } else {
      this.selectedContact = contact._id;
    }
  }

  selectActivity(activity: any): void {
    if (this.selectedActivity === activity._id) {
      this.selectedActivity = '';
    } else {
      this.selectedActivity = activity._id;
    }
  }

  changeMode(mode: string): void {
    this.showMode = mode;
  }

  openContact(contact): void {
    if (contact && !contact.not_found && contact._id) {
      // Store the data
      this.storeService.campaignData.next({
        id: this.id,
        status: this.status,
        activities: this.activities,
        campaign: this.campaign
      });
      this.router.navigate([`contacts/${contact._id}`]);
    }
  }

  cancelSession(session): void {
    let message = '';
    let mode = '';
    if (session.status === 'awaiting') {
      message = 'confrim_delete_bulkemail';
      mode = 'remove';
    } else if (session.status === 'sending') {
      message = 'Are you sure to cancel current running session?';
      mode = 'cancel';
    }
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'delete_bulkemail',
          message,
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.campaignService
            .removeSession({ campaign: this.id, session: session._id, mode })
            .subscribe((res) => {
              if (res && res['status']) {
                if (mode === 'remove') {
                  this.sessions = this.sessions.filter((e) => {
                    if (
                      e._id.day !== session._id.day ||
                      e._id.month !== session._id.month ||
                      e._id.year !== session._id.year
                    ) {
                      return true;
                    }
                  });
                  this.status.contact -= session.contacts;
                  this.status.awaiting -= session.contacts;
                } else {
                  this.sessions.some((e) => {
                    if (
                      e._id.day === session._id.day &&
                      e._id.month === session._id.month &&
                      e._id.year === session._id.year
                    ) {
                      e.sent = e.sent.filter((_s) => {
                        return _s.status === 'done';
                      });
                      let sent_count = 0;
                      e.sent.forEach((_s) => {
                        if (_s.status === 'done') {
                          sent_count += _s.contacts;
                        }
                      });
                      e.status = 'done';
                      const removed = e.contacts - sent_count;
                      e.contacts = sent_count;
                      e.sent_count = sent_count;
                      e.delivered = e.sent_count - e.failed;

                      this.status.contact -= removed;
                      this.status.awaiting -= removed;
                      return true;
                    }
                  });
                }
              }
            });
        }
      });
  }

  cancelContact(contact): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Remove campaign contact',
          message: 'Are you sure to remove the contact from awaiting list?',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.campaignService
            .removeContact({ campaign: this.id, contact: contact._id })
            .subscribe((res) => {
              if (res && res['status']) {
                this.status.contact--;
                this.status.awaiting--;
                this.activities.contact.data =
                  this.activities.contact.data.filter(
                    (e) => e._id !== contact._id
                  );
                this.activities.awaiting.data =
                  this.activities.awaiting.data.filter(
                    (e) => e._id !== contact._id
                  );
                if (res['data']) {
                  const due_date = new Date(res['data']);
                  if (due_date instanceof Date) {
                    const year = due_date.getUTCFullYear();
                    const date = due_date.getUTCDate();
                    const month = due_date.getUTCMonth() + 1;
                    this.sessions.some((e) => {
                      if (
                        e._id.day === date &&
                        e._id.month === month &&
                        e._id.year === year
                      ) {
                        e.sent.some((_s) => {
                          if (_s.status === 'active') {
                            _s.contacts--;
                            return true;
                          }
                        });
                        e.contacts--;
                        return true;
                      }
                    });
                  }
                }
              }
            });
        }
      });
  }

  editEmailContent(): void {
    this.editingTemplate = true;
  }

  onEditTemplate(evt: any): void {
    if (evt) {
      console.log('evt', evt);
      this.dialog
        .open(ConfirmComponent, {
          width: '90vw',
          maxWidth: '400px',
          position: {
            top: '100px'
          },
          data: {
            title: 'Change Campaign Content',
            message:
              'Are you sure change the email content to send for the awaiting contacts?'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            // api call to update the campaign
            const payload = {
              subject: evt['subject'],
              content: evt['content'],
              videos: evt['video_ids'],
              pdfs: evt['pdf_ids'],
              images: evt['image_ids']
            };
            this.campaignService.update(this.id, payload).subscribe((res) => {
              if (res?.status) {
                this.mailTemplate.subject = payload.subject;
                this.mailTemplate.content = payload.content;
                this.mailTemplate.video_ids = payload.videos;
                this.mailTemplate.pdf_ids = payload.pdfs;
                this.mailTemplate.image_ids = payload.images;
                this.campaign.subject = payload.subject;
                this.campaign.content = payload.content;
                this.campaign.videos = payload.videos;
                this.campaign.pdfs = payload.pdfs;
                this.campaign.images = payload.images;
                this.editingTemplate = false;
              }
            });
          } else {
            this.editingTemplate = false;
          }
        });
    } else {
      this.editingTemplate = false;
    }
  }
}
