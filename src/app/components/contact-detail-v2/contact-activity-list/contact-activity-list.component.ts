import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import _ from 'lodash';
import { ContactActivityActionV2 } from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  throttleTime
} from 'rxjs';
import { TabItem } from '@app/utils/data.types';

@Component({
  selector: 'app-contact-activity-list',
  templateUrl: './contact-activity-list.component.html',
  styleUrls: ['./contact-activity-list.component.scss']
})
export class ContactActivityListComponent implements OnInit {
  dataSource;
  @ViewChild('viewport') viewport: CdkVirtualScrollViewport;
  contactId: string;
  @Input() filterTypes: TabItem[];
  @Input() prospectId?: string;
  activityType: TabItem | null;

  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
      this._initLoadInfo();
    }
  }

  constructor(public contactDetailInfoService: ContactDetailInfoService) {}

  ngOnInit(): void {}

  _initLoadInfo() {
    this._initDataSource();
    this.activityType =
      this.contactDetailInfoService.lastSelectedActivitySortType ??
      this.filterTypes[0];
  }

  _initDataSource() {
    if (!this.contactId) {
      return;
    }
    this.dataSource = new ContactActivitySource(
      this.contactDetailInfoService,
      this.contactId
    );
  }

  onScrolledIndexChange(): void {
    if (this.viewport) {
      const end = this.viewport.getRenderedRange().end;
      const total = this.viewport.getDataLength();
      const bottomOffset = this.viewport.measureScrollOffset('bottom');

      if (
        end === total &&
        bottomOffset < 100 &&
        !this.dataSource.hasNoMoreData
      ) {
        throttleTime(250);
        this.dataSource.loadNextPage();
      }
    }
  }

  trackByIdx(i: number, item: ContactActivityActionV2) {
    return item.actionId;
  }

  changeActivityTypes(type: TabItem): void {
    this.activityType = type;
    this.contactDetailInfoService.lastSelectedActivitySortType = type;
    this.dataSource.changeActivityTypes(type);
  }
}

export class ContactActivitySource extends DataSource<
  ContactActivityActionV2 | undefined
> {
  private _contactId;
  private _pageSize = 80;
  private keepConnect = false;

  isLoading = false;
  firstLoading = false;
  isEmptyData = true;
  isRefreshing = false;
  hasNoMoreData = false;

  private readonly _dataStream = new BehaviorSubject<
    (ContactActivityActionV2 | undefined)[]
  >([]);
  activitiesSubscription: Subscription;

  constructor(
    private contactDetailInfoService: ContactDetailInfoService,
    contactId: string
  ) {
    super();
    this._contactId = contactId;
    this._init();
  }

  connect(
    collectionViewer: CollectionViewer
  ): Observable<(ContactActivityActionV2 | undefined)[]> {
    return this._dataStream;
  }

  disconnect(): void {
    if (!this.keepConnect) {
      return this._dataStream.complete();
    }
    this.keepConnect = false;
  }

  private initFetch() {
    this.firstLoading = true;
    this.isEmptyData = true;
    this.hasNoMoreData = false;
    this._fetchPage();
  }

  loadNextPage() {
    if (this.isLoading) return;

    this._fetchPage(this.contactDetailInfoService.lastActivityId);
  }

  private _init() {
    this.contactDetailInfoService.resetContactDetailInfo(this._contactId);
    this._initObserve();

    const storedValue =
      this.contactDetailInfoService.activities.getValue() ?? [];
    if (storedValue?.length == 0 && !this.hasNoMoreData && !this.isLoading) {
      // call API if there is no stored list (when first rendering)
      this.initFetch();
    }
  }

  private _initObserve() {
    this.activitiesSubscription?.unsubscribe();
    this.activitiesSubscription =
      this.contactDetailInfoService.activities$.subscribe((data) => {
        if (data.length > 0) {
          if (data.length === this._dataStream.getValue().length) {
            this.hasNoMoreData = true;
          } else {
            this.hasNoMoreData = false;
          }
          this.isEmptyData = false;
        } else {
          this.keepConnect = true;
          this.isEmptyData = true;
          if (this.firstLoading) {
            this.hasNoMoreData = true;
          }
        }
        this.isRefreshing = false;
        this.isLoading = false;
        this.firstLoading = false;

        this._dataStream.next(data);
      });
  }

  private _fetchPage(from?: string | null) {
    this.isLoading = true;
    this.contactDetailInfoService.loadActivities(this._contactId, {
      from,
      limit: this._pageSize
    });
  }

  changeActivityTypes(type: TabItem): void {
    this.keepConnect = true;
    this.contactDetailInfoService.resetActivityFilter(type);
    this.firstLoading = true;
    this.isEmptyData = true;
    this._fetchPage();
  }

  refresh() {
    this.keepConnect = true;
    this.isRefreshing = true; // keep this reset command order
    this.contactDetailInfoService.refetchContactActivity(this._contactId);
  }
}
