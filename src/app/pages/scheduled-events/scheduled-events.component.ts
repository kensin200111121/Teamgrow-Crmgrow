import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { ScheduleService } from '@services/schedule.service';
import moment from 'moment-timezone';
import { STATUS, MIN_ROW_COUNT } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-scheduled-events',
  templateUrl: './scheduled-events.component.html',
  styleUrls: ['./scheduled-events.component.scss']
})
export class ScheduledEventsComponent implements OnInit, OnDestroy {
  @ViewChild('dateFilterRef', { static: true }) dateFilterRef: TemplateRef<any>;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  STATUS = STATUS;
  public user: any = {};
  loadingStatus = false;

  eventSubscription: Subscription;
  profileSubscription: Subscription;

  allSchedules = {};
  allDays = {};

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  page = 1;
  pageSize = this.PAGE_COUNTS[3];
  searchParams = {
    user_id: '',
    count: this.pageSize.id,
    skip: 0,
    searchOption: {
      due_start: moment().format(),
      due_end: moment().format(),
      event_type: null
    }
  };
  dateRange = {
    due_start: null,
    due_end: null
  };
  selectedEventTypes = [];
  labelColors = [
    'bgc-orange',
    'bgc-pink-red',
    'bgc-azure',
    'bgc-blue-grey',
    'bgc-blue-green',
    'bgc-teal',
    'bgc-leafy-green',
    'bgc-accept',
    'bgc-pale',
    'bgc-image',
    'bgc-email',
    'bgc-note',
    'bgc-appointment',
    'bgc-silver',
    'bgc-orange-light'
  ];
  loading = false;

  filterTypes = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    // { id: 'pending', label: 'Pending' },
    { id: 'past', label: 'Past' },
    { id: 'daterange', label: 'Date Range' }
  ];
  filterType = this.filterTypes[0];

  constructor(
    private dialog: MatDialog,
    public userService: UserService,
    private toast: ToastrService,
    public scheduleService: ScheduleService,
    public sspaService: SspaService
  ) {
    this.scheduleService.getEventTypes(true);
    this.scheduleService.pageEvents$.subscribe(
      (res) => (this.allSchedules = res)
    );
    const filterOption = this.scheduleService.filterOption.getValue();
    if (filterOption && filterOption['selectedEventTypes']) {
      this.selectedEventTypes = filterOption['selectedEventTypes'];
      this.searchParams.searchOption.event_type = this.selectedEventTypes;
    } else {
      this.scheduleService.eventTypes$.subscribe(
        (res) => (this.selectedEventTypes = res.map((ele) => ele._id))
      );
    }
    if (filterOption && filterOption['filterType']) {
      this.filterType = filterOption['filterType'];
      if (this.filterType.id == 'all') {
        this.searchParams.searchOption.due_start = null;
        this.searchParams.searchOption.due_end = null;
      } else if (this.filterType.id == 'upcoming') {
        this.searchParams.searchOption.due_start = moment().format();
        this.searchParams.searchOption.due_end = null;
      } else if (this.filterType.id == 'past') {
        this.searchParams.searchOption.due_start = null;
        this.searchParams.searchOption.due_end = moment().format();
      }
    } else {
      this.searchParams.searchOption.due_start = null;
      this.searchParams.searchOption.due_end = null;
    }
  }

  ngOnInit(): void {
    const pageSize = this.scheduleService.pageSize.getValue();
    this.pageSize = { id: pageSize, label: pageSize + '' };
    const page = this.scheduleService.page.getValue();

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          this.searchParams.user_id = profile._id;
          this.searchParams.count = pageSize;
          this.changePage(page);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.eventSubscription && this.eventSubscription.unsubscribe();
  }

  getLinks(schedule) {
    const { contacts } = schedule;
    const links = [];
    contacts.forEach((ele) => {
      links.push(ele._id);
    });

    return links.join(', ');
  }

  getNames(schedule) {
    const { contacts } = schedule;
    const names = [];
    contacts.forEach((ele) => {
      names.push(ele.first_name + ' ' + ele.last_name);
    });

    return names.join(', ');
  }

  getEmails(schedule) {
    const { contacts } = schedule;
    const emails = [];
    contacts.forEach((ele) => {
      emails.push(ele.email);
    });

    return emails.join(', ');
  }

  calDuration(schedule): number {
    const { due_start, due_end } = schedule;
    return moment(due_end).diff(moment(due_start), 'minutes');
  }

  getTimes(schedule) {
    const { due_start, due_end } = schedule;
    return (
      moment(due_start).format('HH:mm') + '-' + moment(due_end).format('HH:mm')
    );
  }

  getDateRange() {
    const start = this.dateRange.due_start;
    const end = this.dateRange.due_end;
    return (
      moment(`${start.year}-${start.month}-${start.day}`).format(
        'MMM D, YYYY - '
      ) + moment(`${end.year}-${end.month}-${end.day}`).format('MMM D, YYYY')
    );
  }

  pageChanged($event: number): void {
    this.changePage($event);
  }
  changePage(page: number): void {
    this.page = page;
    this.scheduleService.page.next(page);
    // Normal Load by Page
    let skip = (page - 1) * this.pageSize.id;
    skip = skip < 0 ? 0 : skip;
    this.searchParams.skip = skip;
    this.eventSubscription && this.eventSubscription.unsubscribe();
    this.eventSubscription = this.scheduleService
      .getAllEvents(this.searchParams)
      .subscribe();
  }

  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    this.searchParams.count = this.pageSize.id;
    this.scheduleService.pageSize.next(this.pageSize.id);
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

  filterByDate(): void {
    const start = this.dateRange.due_start;
    const end = this.dateRange.due_end;
    this.searchParams.searchOption.due_start = moment(
      `${start.year}-${start.month}-${start.day}`
    ).format();
    this.searchParams.searchOption.due_end = moment(
      `${end.year}-${end.month}-${end.day}`
    ).format();
    this.searchParams.searchOption.event_type = null;
    this.searchParams.skip = 0;

    this.eventSubscription = this.scheduleService
      .getAllEvents(this.searchParams)
      .subscribe();
    this.dialog.closeAll();
  }
  openDialog(): void {
    this.dialog.open(this.dateFilterRef, {
      width: '500px'
    });
  }

  validDateRange(): boolean {
    const start = this.dateRange.due_start;
    const end = this.dateRange.due_end;
    if (Boolean(start) && Boolean(end)) {
      const _start = Date.parse(`${start.year}-${start.month}-${start.day}`);
      const _end = Date.parse(`${end.year}-${end.month}-${end.day}`);
      return _start < _end;
    }
    return false;
  }

  selectEventType(eventType) {
    const index = this.selectedEventTypes.indexOf(eventType._id);
    if (index !== -1) {
      this.selectedEventTypes.splice(index, 1);
    } else {
      this.selectedEventTypes.push(eventType._id);
    }
    this.searchParams.searchOption.event_type = this.selectedEventTypes;

    this.scheduleService.getAllEvents(this.searchParams).subscribe();
    this.scheduleService.updateFilterOption({
      selectedEventTypes: this.selectedEventTypes
    });
  }

  filterByEventType(eventType) {
    this.searchParams.searchOption.event_type = [eventType];
    this.selectedEventTypes = [eventType];
    this.scheduleService.getAllEvents(this.searchParams).subscribe();
  }

  filterEvents(type) {
    this.filterType = type;
    if (type.id == 'daterange') {
      return;
    }
    if (type.id == 'all') {
      this.searchParams.searchOption.due_start = null;
      this.searchParams.searchOption.due_end = null;
    } else if (type.id == 'upcoming') {
      this.searchParams.searchOption.due_start = moment().format();
      this.searchParams.searchOption.due_end = null;
    } else if (type.id == 'pending') {
      return;
    } else if (type.id == 'past') {
      this.searchParams.searchOption.due_start = null;
      this.searchParams.searchOption.due_end = moment().format();
    }
    this.searchParams.searchOption.event_type = null;
    this.eventSubscription && this.eventSubscription.unsubscribe();
    this.eventSubscription = this.scheduleService
      .getAllEvents(this.searchParams)
      .subscribe();
    this.scheduleService.updateFilterOption({ filterType: type });
    window.location.reload();
  }
}
