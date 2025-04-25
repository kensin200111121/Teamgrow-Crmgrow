import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ContactService } from '@app/services/contact.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  takeUntil
} from 'rxjs';
import { Contact } from '@models/contact.model';
import * as _ from 'lodash';
import { MatDrawer } from '@angular/material/sidenav';
import { SphereService } from '@app/services/sphere.service';
import { IBucket } from '@app/types/buckete';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
@Component({
  selector: 'app-contacts-sphere-sorting',
  templateUrl: './contacts-sphere-sorting.component.html',
  styleUrls: ['./contacts-sphere-sorting.component.scss']
})
export class ContactsSphereSortingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  readonly SCORES = ['', 'No', 'Maybe', 'Yes'];

  bucketsDic: Record<string, IBucket>;
  pageContacts: ContactListSource;
  selectedContact: Contact;
  completedPercentage = 0;
  leftContacts = 0;
  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('list') list: CdkVirtualScrollViewport;
  showList = true;
  isSaving = false;

  constructor(
    public router: Router,
    private contactService: ContactService,
    private sphereService: SphereService
  ) {}

  ngOnInit(): void {
    this.contactService.contactsToSort$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.length) {
          this.pageContacts = new ContactListSource(this.contactService, res);
          this.selectedContact = res[0];
          this.getCompletedPercentage();
        } else {
          this.pageContacts = new ContactListSource(this.contactService);
        }

        this.pageContacts.lastSphereIndex.asObservable().subscribe((index) => {
          if (index !== null) {
            this.getCompletedPercentage();
            setTimeout(() => {
              this.list.scrollToIndex(index);
              this.selectedContact = this.pageContacts.selectContact(index);
            }, 1000);
          } else {
            this.completedPercentage = 100;
          }
        });
      });
    this.sphereService.buckets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.bucketsDic = (res || []).reduce(
          (data, e) => ({ ...data, [e._id]: e }),
          {}
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
  }

  toggleContactList(): void {
    this.showList = !this.showList;
  }

  togglePreference(): void {
    this.drawer.opened ? this.drawer.close() : this.drawer.open();
  }

  prevContact(): void {
    const contact = this.selectedContact;
    const { contact: prevContact, index } = this.pageContacts.prev(contact);
    this.selectedContact = prevContact;
    this.list.scrollToIndex(index);
  }

  nextContact(): void {
    const contact = this.selectedContact;
    const { contact: nextContact, index } = this.pageContacts.next(contact);
    this.selectedContact = nextContact;
    this.list.scrollToIndex(index);
  }

  onSortedContact(contact: Contact): void {
    this.isSaving = true;
    const bucket = contact.sphere_bucket_id;
    const action_score = contact.action_score;
    const updated = this.pageContacts.updateContact(
      contact,
      bucket,
      action_score
    );
    if (updated) {
      this.contactService
        .assignBucket([contact._id], bucket, action_score)
        .subscribe((rate) => {
          this.getCompletedPercentage();
          this.isSaving = false;
          this.nextContact();
        });
    }
  }

  onExcludedContact(contact: Contact): void {
    this.isSaving = true;
    const updated = this.pageContacts.updateContact(contact, null);
    if (updated) {
      this.contactService
        .assignBucket([contact._id], null, undefined)
        .subscribe((rate) => {
          this.getCompletedPercentage();
          this.isSaving = false;
          this.nextContact();
        });
    }
  }

  onLoadedContact(contact: Contact): void {
    const bucket = contact.sphere_bucket_id;
    const action_score = contact.action_score;
    this.pageContacts.updateContact(contact, bucket, action_score);
  }

  getCompletedPercentage(): void {
    const { total, completed } = this.pageContacts.getCompletedContacts();
    this.leftContacts = total - completed;
    if (total) this.completedPercentage = Math.round((completed / total) * 100);
  }
}
export class ContactListSource extends DataSource<Contact | undefined> {
  private _length = 0;
  private _pageSize = 50;
  private _cachedData: Contact[];
  private _fetchedPages = new Set<number>();
  lastSphereIndex = new BehaviorSubject<number>(null);
  isLoading = false;
  private readonly _dataStream = new BehaviorSubject<(Contact | undefined)[]>(
    []
  );
  private readonly _subscription = new Subscription();

  constructor(private contactService: ContactService, data?: Contact[]) {
    super();
    if (data?.length) {
      this._length = data.length;
      this._cachedData = data;
      this._dataStream.next(this._cachedData);
      this._fetchPage(0);
    } else {
      this.isLoading = true;
      this.contactService.loadContactIds().subscribe((data) => {
        this.isLoading = false;
        this._length = data.contacts.length;
        this._cachedData = data.contacts;
        this._dataStream.next(this._cachedData);
        this._fetchPage(0);
        if (data.sphere?._id) {
          var index = this._cachedData.findIndex(
            (e) => e._id === data.sphere._id
          );
          this.lastSphereIndex.next(index);
        }
      });
    }
  }

  connect(
    collectionViewer: CollectionViewer
  ): Observable<(Contact | undefined)[]> {
    this._subscription.add(
      collectionViewer.viewChange.subscribe((range) => {
        const startPage = this._getPageForIndex(range.start);
        const endPage = this._getPageForIndex(range.end - 1);
        for (let i = startPage; i <= endPage; i++) {
          this._fetchPage(i);
        }
      })
    );
    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this._pageSize);
  }

  private _fetchPage(page: number) {
    if (this._fetchedPages.has(page)) {
      return;
    }
    this._fetchedPages.add(page);
    const skip = page * this._pageSize;

    const ids = this._cachedData
      .slice(skip, skip + this._pageSize)
      .map((e) => e._id);
    this.contactService.loadContactsByIds(ids).subscribe((data) => {
      this._cachedData.splice(skip, data.length, ...data);
      this._dataStream.next(this._cachedData);
    });
  }

  getCompletedContacts() {
    const total = this._length;
    const completedContacts = this._cachedData.filter((e) => {
      return e.sphere_bucket_id === null || e.sphere_bucket_id;
    }).length;
    return {
      total,
      completed: completedContacts
    };
  }

  prev(contact: Contact): { contact: Contact; index?: number } {
    const index = _.findIndex(this._cachedData, function (e) {
      return e._id === contact._id;
    });
    if (index > 0) {
      return {
        contact: this._cachedData[index - 1] || contact,
        index: index - 1
      };
    }
    return {
      contact
    };
  }

  next(contact: Contact): { contact: Contact; index?: number } {
    const index = _.findIndex(this._cachedData, function (e) {
      return e._id === contact._id;
    });
    let result = contact;
    if (index < this._cachedData.length - 1) {
      result = this._cachedData[index + 1];

      this._fetchPage(Math.ceil(index + 1 / this._pageSize));
      return { contact: result, index: index + 1 };
    } else {
      return { contact: result };
    }
  }

  selectContact(index: number): Contact {
    if (index < this._cachedData.length - 1) {
      return this._cachedData[index];
    } else {
      return null;
    }
  }

  updateContact(contact: Contact, bucket: string, score?: number): boolean {
    const index = _.findIndex(this._cachedData, function (e) {
      return e._id === contact._id;
    });
    if (index !== -1) {
      this._cachedData[index].sphere_bucket_id = bucket;
      score && (this._cachedData[index].action_score = score);
      if (!bucket) {
        delete this._cachedData[index].action_score;
      }
      return true;
    }
    return false;
  }
}
