import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Material } from '@models/material.model';
import { NotificationService } from '@services/notification.service';
import * as _ from 'lodash';
import { CampContact, Contact } from '@models/contact.model';
import { HandlerService } from '@services/handler.service';

@Component({
  selector: 'app-automation-queue',
  templateUrl: './automation-queue.component.html',
  styleUrls: ['./automation-queue.component.scss']
})
export class AutomationQueueComponent implements OnInit, OnDestroy {
  queue_id: string = '';
  automation: any;
  loading: boolean = false;

  currentPanel = 'all';

  STATUS = {
    delivered: 'Assigned',
    failed: 'Failed',
    awaiting: 'Awaiting'
  };

  contacts = {
    all: {
      title: 'Assigned Contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    awaiting: {
      title: 'Awaiting Contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    delivered: {
      title: 'Delivered Contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    failed: {
      title: 'Failed Contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    notExecuted: {
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    task: {
      title: '',
      _id: '',
      data: [],
      loading: false,
      page: 1,
      pageSize: 100
    }
  };
  status = {
    all: 0,
    sent: 0,
    awaiting: 0,
    delivered: 0,
    failed: 0,
    notExecuted: 0
  };

  DISPLAY_COLUMNS = [
    'contact_name',
    'contact_label',
    'last_activity',
    'contact_email',
    'status',
    'action'
  ];

  loadSubscription: Subscription;
  loadDataSubscription: Subscription;
  removeSubscription: Subscription;
  routeChangeSubscription: Subscription;
  showFullEmail: boolean = false;
  searchStr: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private handlerService: HandlerService
  ) {}

  ngOnInit(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.queue_id = params['id'];
      this.loadQueue();
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Load Queue Email Contents and Materials and Sessions
   */
  loadQueue(): void {
    this.automation = {};
    // data format
    // status format
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loading = true;
    this.loadSubscription = this.notificationService
      .getEmailQueue({
        id: this.queue_id,
        limit: 20,
        page: 1,
        mode: 'init',
        type: 'assign_automation'
      })
      .subscribe((res) => {
        this.loading = false;
        if (res.status) {
          this.automation = res.data['automation'];
          const status = res.data['status'] || {};
          this.status.delivered = status.succeed || 0;
          this.status.failed = status.failed || 0;
          this.status.notExecuted = status.notExecuted || 0;
          this.status.awaiting = status.contacts || 0;
          if (this.status.awaiting) {
            this.changePanel('awaiting');
          } else if (this.status.delivered) {
            this.changePanel('delivered');
          } else if (this.status.failed) {
            this.changePanel('failed');
          }
        } else {
          // error showing
        }
      });
  }

  cancelContact(contact): void {
    const panel = this.currentPanel;
    this.notificationService
      .removeEmailContact({
        contact: contact._id,
        process: this.queue_id
      })
      .subscribe((res) => {
        if (res && res['status']) {
          const pos = _.findIndex(
            this.contacts[panel].data,
            (e) => e._id === contact._id
          );
          if (pos !== -1) {
            this.contacts[panel].data.splice(pos, 1);
            this.contacts[panel].data = [...this.contacts[panel].data];
            if (
              panel !== 'task' &&
              panel === this.currentPanel &&
              this.status[panel] > this.contacts[panel].pageSize - 2
            ) {
              if (
                this.contacts[panel].data.length <
                this.contacts[panel].pageSize / 2
              ) {
                this.changeContactPage(this.contacts[panel].page);
              }
            }
          }
          this.status.awaiting--;
        }
      });
  }

  changePanel(panel: string): void {
    this.currentPanel = panel;
    this.contacts[panel].loading = true;
    this.loadDataSubscription && this.loadDataSubscription.unsubscribe();
    this.loadDataSubscription = this.notificationService
      .loadQueueContact({
        id: this.queue_id,
        limit: this.contacts[panel].pageSize,
        page: this.contacts[panel].page,
        category: panel,
        source: 'tasks',
        searchStr: this.searchStr
      })
      .subscribe((res) => {
        this.contacts[panel].loading = false;
        if (res && res['data']) {
          const contacts = [];
          const additionals = {};
          if (this.currentPanel === 'failed') {
            res['data']['status'].forEach((e) => {
              if (e && e.contact && e.contact._id) {
                additionals[e.contact._id] = {
                  ...e,
                  contact: undefined
                };
                if (e.error) {
                  additionals[e.contact._id]['failed_reason'] = e.error;
                  additionals[e.contact._id]['failed'] = true;
                }
              }
            });
          }
          (res['data']['contacts'] || []).forEach((e) => {
            let contactData = e;
            if (additionals[contactData._id]) {
              contactData = { ...contactData, ...additionals[contactData._id] };
            }
            contactData.status = this.currentPanel;
            const contact = new CampContact().deserialize(contactData);
            contacts.push(contact);
          });
          this.contacts[panel].data = contacts;
        } else {
          this.contacts[panel].data = [];
        }
      });
  }

  changeContactPage(page: number): void {
    const panel = this.currentPanel;
    this.contacts[panel].loading = true;
    this.contacts[panel].page = page;
    this.loadDataSubscription && this.loadDataSubscription.unsubscribe();
    this.loadDataSubscription = this.notificationService
      .loadQueueContact({
        id: this.queue_id,
        limit: this.contacts[panel].pageSize,
        page: this.contacts[panel].page,
        category: panel,
        source: 'tasks',
        searchStr: this.searchStr
      })
      .subscribe((res) => {
        this.contacts[panel].loading = false;
        if (res && res['data']) {
          const contacts = [];
          const additionals = {};
          if (this.currentPanel === 'failed') {
            res['data']['status'].forEach((e) => {
              if (e && e.contact && e.contact._id) {
                additionals[e.contact._id] = { ...e, contact: undefined };
              }
            });
          }
          (res['data']['contacts'] || []).forEach((e) => {
            let contactData = e;
            if (additionals[contactData._id]) {
              contactData = { ...contactData, ...additionals[contactData._id] };
            }
            contactData.status = this.currentPanel;
            const contact = new CampContact().deserialize(contactData);
            contacts.push(contact);
          });
          this.contacts[panel].data = contacts;
        } else {
          this.contacts[panel].data = [];
        }
      });
  }

  /**
   * Redirect to the contact detail page
   * @param contact: Contact Detail
   */
  openContact(contact: Contact): void {
    this.router.navigate(['/contacts/' + contact._id]);
  }

  changeSearchStr(): void {
    this.changeContactPage(1);
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
}
