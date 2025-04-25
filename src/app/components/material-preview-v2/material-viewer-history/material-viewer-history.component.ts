import { Component, Input, OnInit } from '@angular/core';
import { Material } from '@app/models/material.model';
import { MaterialService } from '@app/services/material.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MIN_ROW_COUNT } from '@app/constants/variable.constants';
import { Contact } from '@app/models/contact.model';
import { LabelService } from '@app/services/label.service';
import { LinkContactAssignComponent } from '@app/components/link-contact-assign/link-contact-assign.component';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivityService } from '@app/services/activity.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-material-viewer-history',
  templateUrl: './material-viewer-history.component.html',
  styleUrls: ['./material-viewer-history.component.scss']
})
export class MaterialViewerHistoryComponent implements OnInit {
  materialIdType: { _id: string; type: string };
  historyTabs: Array<{
    icon: string;
    label: string;
    id: 'sent' | 'watch' | 'contact';
  }> = [
    { icon: '', label: 'Tracked History', id: 'watch' },
    { icon: '', label: 'Tracked Contacts', id: 'contact' },
    { icon: '', label: 'Sent History', id: 'sent' }
  ];
  historyTab = this.historyTabs[0];
  selectedFolder: Material;
  materialPreview;

  contacts = []; //watch tab
  sents = []; //sent tab
  unique_contacts = []; //contact tab
  labels = [];
  activity;

  reloading = false;
  isLoading = false;

  SORT_TYPES = [
    { id: 'alpha_up', label: 'Alphabetical Z-A' },
    { id: 'alpha_down', label: 'Alphabetical A-Z' },
    { id: 'last_activity', label: 'Last activity' }
  ];
  sortType = this.SORT_TYPES[2];
  showAnonymous = true;

  tableType: 'sent' | 'watch' | 'contact' = this.historyTab.id;

  tableTypeBehavior: BehaviorSubject<'sent' | 'watch' | 'contact'> =
    new BehaviorSubject(this.tableType);
  tableTypeBehavior$ = this.tableTypeBehavior.asObservable();
  WATCH_DISPLAY_COLUMNS = ['name', 'progress', 'date', 'action'];
  TRACK_DISPLAY_COLUMNS = [
    'no',
    'generate_date',
    'track_date',
    'progress',
    'contact',
    'action'
  ];
  SENT_DISPLAY_COLUMNS = ['name', 'date'];
  CONTACT_DISPLAY_COLUMNS = ['name', 'progress', 'date'];
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  PAGE_COUNTS: Array<{ id: number; label: string }> = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageInfo = {
    sent: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 },
    watch: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 },
    contact: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 }
  };
  loadSubscription: Subscription;

  pageInfoBehavior: BehaviorSubject<any> = new BehaviorSubject({
    sent: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 },
    watch: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 },
    contact: { pageSize: this.PAGE_COUNTS[2], pageIndex: 1 }
  });
  pageInfoBehavior$ = this.pageInfoBehavior.asObservable();
  sentCount = 0; //sent
  viewCount = 0; //watch
  contactCount = 0; //contact

  @Input() set setMaterialIdType(data) {
    this.materialIdType = data;
    setTimeout(() => {
      this.loadData(this.materialIdType._id, this.materialIdType.type, 'load');
    }, 1000);
  }
  @Input() set setMaterialPreview(data) {
    this.materialPreview = data;
  }

  @Input() set setSentCount(data) {
    this.sentCount = data;
  }

  @Input() set setViewCount(data) {
    this.viewCount = data;
  }
  @Input() set setContactCount(data) {
    this.contactCount = data;
  }

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private materialService: MaterialService,
    private labelService: LabelService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {}

  /* Track History Section */
  loadData(id, type, loadType: string): void {
    if (loadType == 'load') {
      //  this.isLoading = true;
      const pageOption = this.materialService.analyticsPageOption.getValue();
      this.selectedFolder = pageOption['selectedFolder'];
      this.unique_contacts = [];
    } else {
      this.reloading = true;
      this.contacts = [];
      this.unique_contacts = [];
    }
    this.loadAnalyticsOnType(id, type);

    this.pageInfoBehavior$.subscribe((res) => {
      if (res) {
        this.pageInfo = res;
        if (this.tableType) {
          this.loadAnalyticsOnType(id, type);
        }
      }
    });

    this.tableTypeBehavior$.subscribe((res) => {
      if (res) {
        this.tableType = res;
        if (this.pageInfo) {
          this.loadAnalyticsOnType(id, type);
        }
      }
    });
  }
  loadAnalyticsOnType(id, type) {
    const pageSize = this.pageInfo[this.tableType].pageSize.id;
    const skip = (this.pageInfo[this.tableType].pageIndex - 1) * pageSize;

    this.loadSubscription && this.loadSubscription.unsubscribe();

    this.loadSubscription = this.materialService
      .getAnalyticsOnType(
        id,
        type,
        this.tableType,
        skip,
        pageSize,
        this.showAnonymous
      )
      .subscribe((analytics) => {
        this.isLoading = false;
        this.reloading = false;
        if (analytics) {
          switch (this.tableType) {
            case 'sent':
              for (const activity of analytics) {
                activity.contacts = activity.contacts || new Contact();
                if (!activity.contacts) {
                  activity.contacts.first_name = 'N/A';
                }
              }
              this.sents = analytics;
              break;
            case 'watch':
              this.contacts = (analytics ?? []).map((activity) => {
                const contact = activity.contact[0] || new Contact();
                const track = { _id: activity.activity[0] || '' };
                if (!activity.contact || !activity.contact.length) {
                  contact.first_name = 'Anonymous'; // is Anonymous
                }
                if (this.materialPreview.material_type == 'pdf') {
                  return {
                    ...contact,
                    read_pages: activity.read_pages ? activity.read_pages : 0,
                    total_pages: activity.total_pages,
                    last_watch_at: activity.updated_at,
                    track
                  };
                } else {
                  return {
                    ...contact,
                    duration: activity.duration ? activity.duration : 0,
                    last_watch_at: activity.updated_at
                  };
                }
              });
              break;
            case 'contact':
              this.unique_contacts = analytics.map((item) => ({
                _id: item._id.contact._id,
                first_name: item._id.contact.first_name,
                last_name: item._id.contact.last_name,
                ...item
              }));
              break;
            default:
              break;
          }
        }
      });
  }

  getLabelById(id): any {
    let retVal = { color: 'black', font_color: 'black' };
    let i;
    for (i = 0; i < this.labels.length; i++) {
      if (this.labels[i]._id === id) {
        retVal = this.labels[i];
      }
    }
    return retVal;
  }

  getLabels(): any {
    // this.isLoading = true;
    this.labelService.getLabels().subscribe(async (res: any) => {
      this.labels = res.sort((a, b) => {
        return a.priority - b.priority;
      });
    });
  }

  changeSentPage(event: any): void {
    this.pageInfo['sent'].pageIndex = event;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      sent: { ...originValue.sent, pageIndex: event }
    });
  }

  changeSentPageSize(type: any): void {
    this.pageInfo['sent'].pageSize = type;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      sent: { ...originValue.sent, pageSize: type }
    });
  }

  changeContactPage(event: any): void {
    this.pageInfo['contact'].pageIndex = event;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      contact: { ...originValue.contact, pageIndex: event }
    });
  }

  changeContactPageSize(type: any): void {
    this.pageInfo['contact'].pageSize = type;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      contact: { ...originValue.contact, pageSize: type }
    });
  }

  changeWatchPage(event: any): void {
    this.pageInfo['watch'].pageIndex = event;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      watch: { ...originValue.watch, pageIndex: event }
    });
  }

  changeWatchPageSize(type: any): void {
    this.pageInfo['watch'].pageSize = type;
    const originValue = this.pageInfoBehavior.getValue();
    this.pageInfoBehavior.next({
      ...originValue,
      watch: { ...originValue.watch, pageSize: type }
    });
  }

  changeHistoryActivityType(type: {
    icon: string;
    label: string;
    id: 'sent' | 'watch' | 'contact';
  }): void {
    this.historyTab = type;
    this.tableTypeBehavior.next(type.id);
  }

  toggleShowAnonymous() {
    this.showAnonymous = !this.showAnonymous;
    this.changeWatchPage(this.pageInfo['watch'].pageIndex);
  }

  createContact(contact): void {
    const track = contact.track;
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
          const contactId = res['contact']._id;
          const contacts = [];
          contacts.push(contactId);
          this.activityService
            .assignContact(track, contacts)
            .subscribe((res) => {
              if (res) {
                Object.assign(contact, res['data'].contacts);
              }
            });
        }
      });
  }

  assignContact(contact): void {
    this.dialog
      .open(LinkContactAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: { track: contact.track }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          Object.assign(contact, res['data'].contacts);
        }
      });
  }

  toContact(id: string): void {
    if (id) {
      this.router.navigate(['/contacts/' + id]);
    }
  }
}
