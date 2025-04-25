import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  CdkVirtualScrollViewport,
  ScrollDispatcher
} from '@angular/cdk/scrolling';
import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, Subscription, throttleTime } from 'rxjs';
import * as moment from 'moment-timezone';
import _ from 'lodash';
import {
  ContactActionUIScheme,
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { Deal } from '@app/models/deal.model';
import { TaskDetail } from '@models/task.model';
import { DealsService } from '@app/services/deals.service';
import { AppointmentService } from '@app/services/appointment.service';
import { HandlerService } from '@app/services/handler.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { ContactService } from '@app/services/contact.service';
import { TaskService } from '@services/task.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import { TaskEditComponent } from '@app/components/task-edit/task-edit.component';
import { CalendarEventDialogComponent } from '@app/components/calendar-event-dialog/calendar-event-dialog.component';
import { DialogSettings } from '@constants/variable.constants';
import { environment } from '@environments/environment';

const ZONEREG = /-[0-1][0-9]:00|Z/;

const TypeDic = {
  Tasks: 'follow_up',
  Deals: 'deal',
  Appointments: 'appointment'
};

@Component({
  selector: 'app-data-list',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss']
})
export class DataListComponent implements OnInit {
  DueDateTimeFormat = 'MMM DD YYYY, hh:mm a';
  @ViewChild('viewport') viewport: CdkVirtualScrollViewport;
  @ViewChildren(NgbDropdown) dropdowns: QueryList<NgbDropdown>;
  @ViewChildren('descriptionElement') descriptionElements: QueryList<ElementRef>;

  _type: ContactDetailActionType;
  _contactId = '';
  icon = '';
  dataSource;
  emptyStr = '';
  siteURL = environment.website;
  @Input() set type(val) {
    this._type = TypeDic[val];
    this.icon = 'i-' + this._type;
    this.emptyStr =
      ContactActionUIScheme.find((item) => item?.type === this._type)
        ?.emptyStr ?? '';
    this._initDataSource();
  }

  @Input()
  public set contactId(val: string) {
    if (val) {
      const originalContactId = this._contactId;
      this._contactId = val;
      this._initLoadInfo(
        originalContactId && originalContactId !== this._contactId
      );
    }
  }

  routeChangeSubscription: Subscription;

  timeSorts = [
    { label: 'All', id: 'all' },
    { label: 'Overdue', id: 'overdue' },
    { label: 'Today', id: 'today' },
    { label: 'Tomorrow', id: 'tomorrow' },
    { label: 'This week', id: 'this_week' },
    { label: 'Next Week', id: 'next_week' },
    { label: 'Future', id: 'future' }
  ];
  selectedTimeSort =
    this.contactDetailInfoService.lastSelectedTaskSortType ?? this.timeSorts[0];

  isSspa = environment.isSspa;

  constructor(
    private contactDetailInfoService: ContactDetailInfoService,
    private contactService: ContactService,
    private dialog: MatDialog,
    private taskService: TaskService,
    private dealsService: DealsService,
    private appointmentService: AppointmentService,
    private handlerService: HandlerService,
    private scrollDispatcher: ScrollDispatcher,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.scrollDispatcher.scrolled().subscribe((event) => {
      this.dropdowns?.forEach((x) => x.close());
    });
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  checkTruncation(id: string): boolean {
    return this.descriptionElements.some((elementRef) => {
      const nativeElement = elementRef.nativeElement;
      
      if (nativeElement.getAttribute('data-id') === id) {
        return nativeElement.scrollHeight > nativeElement.clientHeight;
      }
      return false;
    });
  }

  _initLoadInfo(forceReload = false) {
    this._initDataSource(forceReload);
    this.contactDetailInfoService.oldParentFollowUps = [];
  }

  _initDataSource(forceReload = false) {
    if (!forceReload && (!this._type || !this._contactId)) {
      return;
    }
    this.dataSource = new ContactListSource(
      this.contactDetailInfoService,
      this._type,
      this._contactId
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

  completeTask(activity): void {
    const taskId = activity._id;
    if (activity.status !== 1)
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          position: { top: '100px' },
          data: {
            title: 'Complete Task',
            message: 'Are you sure to complete the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Complete',
            comment: {
              label: 'Task comment',
              required: false,
              value: activity.comment || ''
            }
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.taskService
              .complete(taskId, confirm['comment'])
              .subscribe((res) => {
                if (!this.isSspa) {
                  this.contactDetailInfoService.callbackForRemoveContactAction(
                    taskId,
                    'follow_up'
                  );
                }

                this.contactDetailInfoService.callbackForEditContactAction(
                  this._contactId,
                  'follow_up'
                );
              });
          }
        });
    if (this.isSspa && activity.status === 1) {
      this.taskService.unComplete(taskId).subscribe((res) => {
        this.contactDetailInfoService.callbackForEditContactAction(
          this._contactId,
          'follow_up'
        );
      });
    }
  }

  archiveTask(activity): void {
    const taskId = activity._id;
    if (
      activity.set_recurrence &&
      activity.status !== 1
      //  &&      this.selectedTimeSort.id === 'all'
    ) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'recurrence_task_delete'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          const include_recurrence = res.type == 'all';

          this.taskService
            .archive([activity], include_recurrence)
            .subscribe((status) => {
              if (status) {
                this.contactDetailInfoService.callbackForRemoveContactAction(
                  taskId,
                  'follow_up'
                );
              }
            });
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Archive Task',
            message: 'Are you sure to archive the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.taskService.archive([activity]).subscribe((status) => {
              if (status) {
                this.contactDetailInfoService.callbackForRemoveContactAction(
                  taskId,
                  'follow_up'
                );
              }
            });
          }
        });
    }
  }

  editTask(activity): void {
    const data = {
      ...activity,
      contact: { _id: this._contactId }
    };

    this.dialog
      .open(TaskEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data: {
          task: new TaskDetail().deserialize(data)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status == 'deleted') {
            this.contactDetailInfoService.callbackForRemoveContactAction(
              this._contactId,
              'follow_up'
            );
            if (!res.deleted_all) {
              // this.deleteTaskFromTasksArray(activity._id);
              this.contactService.deleteContactActivityByDetail(
                activity._id,
                'follow_ups'
              );
            } else {
              // this.deleteRecurranceTasks(activity);
            }
          } else {
            this.contactDetailInfoService.callbackForEditContactAction(
              this._contactId,
              'follow_up'
            );
          }
        }
      });
  }

  removeContact(deal: Deal): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Contact',
          message: 'Are you sure you want to remove contact from this deal?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Delete Deal',
                message:
                  'Do you want to remove all the data and all the activities related this deal from contact?',
                cancelLabel: 'No',
                confirmLabel: 'Yes'
              }
            })
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm?.status === true) {
                this.dealsService
                  .updateContact({
                    dealId: deal._id,
                    action: 'remove',
                    ids: [this._contactId]
                  })
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(
                        deal.contacts,
                        [{ _id: this._contactId }],
                        '_id'
                      );
                      this.dataSource.loadNextPage();
                      this.dataSource =
                        this.dataSource.contactDetailInfoService.actions.deal.value.filter(
                          (item: any) => item.action._id !== deal._id
                        );
                    }
                  });
              } else if (confirm?.status === false) {
                this.dealsService
                  .updateContact({
                    dealId: deal._id,
                    action: 'remove',
                    ids: [this._contactId],
                    deleteAllData: false
                  })
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(deal.contacts, [this._contactId], '_id');
                      this.dataSource.loadNextPage();
                      this.dataSource =
                        this.dataSource.contactDetailInfoService.actions.deal.value.filter(
                          (item: any) => item.action._id !== deal._id
                        );
                    }
                  });
              }
            });
        }
      });
  }

  private formatEvents(event: any) {
    let _start = moment(event.due_start).toDate();
    let _end = moment(event.due_end).toDate();
    if (event.service_type === 'outlook') {
      if (!event.is_full) {
        if (!ZONEREG.test(event.due_start)) {
          _start = moment(event.due_start + 'Z').toDate();
        }
        if (!ZONEREG.test(event.due_end)) {
          _end = moment(event.due_end + 'Z').toDate();
        }
      }
    }
    // TODO: function
    const _formattedEvent = {
      title: event.title,
      start: _start,
      end: _end,
      meta: {
        contacts: event.contacts,
        calendar_id: event.calendar_id,
        description: event.description,
        location: event.location,
        isGoogleMeet: event.isGoogleMeet,
        hangoutLink: event.hangoutLink,
        type: event.type,
        guests: event.guests,
        event_id: event.event_id,
        recurrence: event.recurrence,
        recurrence_id: event.recurrence_id,
        is_organizer: event.is_organizer,
        organizer: event.organizer,
        timezone: event.timezone,
        service_type: event.service_type,
        is_full: event.is_full,
        originalStartTime: undefined,
        originalEndTime: undefined,
        until: undefined
      }
    };
    if (event.is_full) {
      _formattedEvent['date'] = event.due_start;
    }
    return _formattedEvent;
  }

  openAppointmentDlg(activity): void {
    const _events = this.formatEvents(activity);
    this.dialog
      .open(CalendarEventDialogComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          mode: 'dialog',
          event: _events,
          activity: activity
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this._contactId,
            'appointment'
          );
        }
      });
  }

  removeAppointment(activity: any): void {
    const detail = activity;
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Remove Appoinment',
          message: 'Are you sure you want to remove this appointment?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status && detail?.event_id) {
          const payload = {
            event_id: detail.event_id,
            calendar_id: detail.calendar_id,
            connected_email: detail.calendar_id,
            contact_id: this._contactId
          };
          this.appointmentService.removeGuest(payload).subscribe((res) => {
            if (res) {
              this.handlerService.reload$();
              this.dataSource.contactDetailInfoService.actions.appointment._value =
                this.dataSource.contactDetailInfoService.actions.appointment._value.filter(
                  (item: any) => item.actionId !== activity._id
                );
              this.contactDetailInfoService.callbackForRemoveContactAction(
                activity.actionId,
                'appointment'
              );
              this.dataSource =
                this.dataSource.contactDetailInfoService.actions.appointment.value.filter(
                  (item: any) => item.actionId !== activity._id
                );
            }
          });
        }
      });
  }

  changeSort(timeSort: any): void {
    this.selectedTimeSort = timeSort;
    this.contactDetailInfoService.lastSelectedTaskSortType = timeSort;
    this.dataSource.changeSort(timeSort.id);
  }

  taskDescriptionMore: { [key: number]: boolean } = {};
}

class ContactListSource extends DataSource<
  ContactActivityActionV2 | undefined
> {
  private _type;
  private _contactId;
  private _pageSize = 15;
  private keepConnect = false;

  isLoading = false;
  firstLoading = false;
  isEmptyData = true;
  isRefreshing = false;
  hasNoMoreData = false;

  private readonly _dataStream = new BehaviorSubject<
    (ContactActivityActionV2 | undefined)[]
  >([]);
  actionsSubscription: Subscription;

  constructor(
    private contactDetailInfoService: ContactDetailInfoService,
    type: ContactDetailActionType,
    contactId: string
  ) {
    super();
    this._type = type;
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

  private _init() {
    this.contactDetailInfoService.resetContactDetailInfo(this._contactId);
    this._initObserve();
    const storedValue =
      this.contactDetailInfoService.actions[this._type]?.getValue() || [];
    if (storedValue?.length == 0 && !this.hasNoMoreData && !this.firstLoading) {
      // call API if there is no stored list (when first rendering)
      this.initFetch();
    }
  }

  private initFetch() {
    this.firstLoading = true;
    this.isEmptyData = true;
    this.hasNoMoreData = false;
    this._fetchPage(0);
  }

  loadNextPage() {
    const offset = this._dataStream.getValue().length;
    if (
      this.isLoading ||
      this.contactDetailInfoService.actionListOffset[this._type] >= offset
    ) {
      return;
    }

    this._fetchPage(offset);
  }

  private _initObserve() {
    this.actionsSubscription?.unsubscribe();
    this.actionsSubscription = this.contactDetailInfoService.actions$[
      this._type
    ].subscribe((data) => {
      if (data.length > 0) {
        if (data.length === this._dataStream.getValue().length) {
          this.hasNoMoreData = true;
        } else {
          this.hasNoMoreData = false;
        }
        this.isEmptyData = false;
      } else {
        this.keepConnect = true;
        if (this.firstLoading) {
          this.hasNoMoreData = true;
        }
        this.isEmptyData = true;
      }
      this.isRefreshing = false;
      this.isLoading = false;
      this.firstLoading = false;
      this._dataStream.next(data);
    });
  }

  private _fetchPage(offset: number) {
    this.isLoading = true;
    this.contactDetailInfoService.actionListOffset[this._type] = offset;
    if (
      this._type === 'follow_up' &&
      !this.contactDetailInfoService.lastSelectedTaskSortQuery
    ) {
      const sortQuery = {
        startDate: null,
        endDate: null,
        sort: null,
        dateOption: 'all'
      };
      this.contactDetailInfoService.lastSelectedTaskSortQuery = sortQuery;
    }
    this.contactDetailInfoService.loadActionsWithType(
      this._contactId,
      this._type,
      {
        skip: offset,
        limit: this._pageSize
      },
      this.contactDetailInfoService.lastSelectedTaskSortQuery
    );
  }

  changeSort(timeSort: any): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const today = moment().startOf('day');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const weekDay = moment().startOf('week');

    let start_date = null;
    let end_date = null;
    let ascSort = 1;

    switch (timeSort) {
      case 'all':
        ascSort = null;
        break;
      case 'future':
        start_date = weekDay.clone().add(2, 'week').toDate();
        break;
      case 'overdue':
        end_date = today.clone().toDate();
        ascSort = -1;
        break;
      case 'today':
        start_date = today.clone().toDate();
        end_date = today.clone().add(1, 'day').toDate();
        break;
      case 'tomorrow':
        start_date = today.clone().add(1, 'day').toDate();
        end_date = today.clone().add(2, 'day').toDate();
        break;
      case 'this_week':
        start_date = weekDay.clone().toDate();
        end_date = weekDay.clone().add(1, 'week').toDate();
        break;
      case 'next_week':
        start_date = weekDay.clone().add(1, 'week').toDate();
        end_date = weekDay.clone().add(2, 'week').toDate();
        break;
      default:
        break;
    }
    const sortQuery = {
      startDate: start_date,
      endDate: end_date,
      sort: ascSort,
      dateOption: timeSort
    };

    this.contactDetailInfoService.lastSelectedTaskSortQuery = sortQuery;
    this.contactDetailInfoService.oldParentFollowUps = [];
    this._fetchPage(0);
  }

  refresh() {
    this.keepConnect = true;
    this.isRefreshing = true;
    this.contactDetailInfoService.refetchContactActionOnType(
      this._contactId,
      this._type
    );
  }

  removeCallBack(actionId) {
    this.contactDetailInfoService.callbackForRemoveContactAction(
      actionId,
      this._type
    );
  }
}
