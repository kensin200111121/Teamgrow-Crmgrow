import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewContainerRef,
  ViewChild,
  TemplateRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentService } from '@services/appointment.service';
import { OverlayService } from '@services/overlay.service';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { startOfWeek, endOfWeek } from 'date-fns';
import { UserService } from '@services/user.service';
import { TabItem } from '@utils/data.types';
import { Subscription } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import moment from 'moment-timezone';
import * as _ from 'lodash';
import { ConnectNewCalendarComponent } from '@components/connect-new-calendar/connect-new-calendar.component';
import { CalendarSettingComponent } from '@components/calendar-setting/calendar-setting.component';
import { Garbage } from '@models/garbage.model';
import { GetTime } from '@app/helper';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { getDateByTimeZone, getIntervalDate } from '@app/utils/functions';
const ZONEREG = /-[0-1][0-9]:00|Z/;

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
  // providers: [
  //   {
  //     provide: CalendarDateFormatter
  //   }
  // ]
})
export class CalendarComponent implements OnInit, OnDestroy {
  private garbage: Garbage = new Garbage();
  readonly today: Date = new Date();
  readonly tabs: TabItem[] = [
    { icon: '', label: 'Day', id: 'day' },
    { icon: '', label: 'Week', id: 'week' },
    { icon: '', label: 'Month', id: 'month' }
  ];

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  locale = 'en';
  user: any = {};
  weekStart;
  weekEnd;

  private code = '';
  private action = '';

  isLoading = false;
  isUpdating = false;
  private loadSubscription: Subscription;
  private anotherLoadSubscriptions = {};
  private isRedirect = false;

  selectedTab: TabItem = this.tabs[0];
  private queryParamSubscription: Subscription;

  // Calendars
  events: CalendarEvent[] = [];
  showingEvents: CalendarEvent[] = [];
  private dayEvents: any = {};
  private supplementEvents = {};
  private supplementDays: any[] = [];

  // Event id from router
  private eventId = '';

  // Calendars
  accounts: any[] = [];
  calendars = {};
  selectedCalendars = [];

  // Overlay Relative
  @ViewChild('detailPortalContent') detailPortalContent: TemplateRef<unknown>;
  @ViewChild('creatPortalContent') creatPortalContent: TemplateRef<unknown>;
  private overlayRef: OverlayRef;
  private templatePortal: TemplatePortal;
  event: any;
  selectedDate: any;
  private overlayCloseSubscription: Subscription;

  // Relative Subscriptions
  private updateCommandSubscription: Subscription;
  private calendarLoadSubscription: Subscription;
  private profileSubscription: Subscription;
  private garbageSubscription: Subscription;
  isPackageCalendar = true;

  /**
   * Week String Mode (Check if week is on same years, same months)
   */
  get weekStringMode(): string {
    try {
      if (this.weekStart && this.weekEnd) {
        const startYear = this.weekStart.getFullYear();
        const endYear = this.weekEnd.getFullYear();
        const startMonth = this.weekStart.getMonth();
        const endMonth = this.weekEnd.getMonth();
        if (startYear !== endYear) {
          return 'year';
        } else if (startMonth !== endMonth) {
          return 'month';
        }
        return 'day';
      } else {
        return 'day';
      }
    } catch (e) {
      return 'day';
    }
  }

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private overlayService: OverlayService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private changeDetectorRef: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private translateService: TranslateService
  ) {
    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      this.locale = event.lang;
    });
  }

  ngOnInit(): void {
    // Initialize Connection Subscription handler & Calendars Loading & Update Event Command
    this.initSubscriptions();
    // After user loading, load events
    this.locale = this.translateService.currentLang;
  }

  // When scroll, close the overview
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.updateCommandSubscription &&
      this.updateCommandSubscription.unsubscribe();
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.garbageSubscription?.unsubscribe();
  }

  /**
   * Init the View mode and View start date
   */
  private initModeAndDate(): void {
    const currentDay = new Date();
    const currentMethod = localStorage.getCrmItem('calendarTab');
    let date;
    let mode =
      this.route.snapshot.params['mode'] ||
      this.route.snapshot.params['action'] ||
      currentMethod ||
      'week';
    const year = this.route.snapshot.params['year'];
    const month = this.route.snapshot.params['month']?.padStart(2, 0);
    const day = this.route.snapshot.params['day']?.padStart(2, 0);
    const routeDay = new Date(`${year}-${month}-${day}`);
    if (isNaN(routeDay.getTime())) {
      date = moment(currentDay);
    } else {
      date = moment()
        .year(parseInt(year))
        .month(parseInt(month) - 1)
        .date(parseInt(day))
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
    }

    switch (mode) {
      case 'month':
        date = date.startOf('month');
        this.selectedTab = this.tabs[2];
        this.view = CalendarView.Month;
        break;
      case 'week':
        date = date.startOf('week');
        this.selectedTab = this.tabs[1];
        this.view = CalendarView.Week;
        break;
      case 'day':
        date = date.startOf('day');
        this.selectedTab = this.tabs[0];
        this.view = CalendarView.Day;
        break;
      default:
        mode = 'week';
        date = date.startOf('week');
        this.selectedTab = this.tabs[1];
        this.view = CalendarView.Week;
    }

    this.location.replaceState(
      `/calendar/${mode}/${date.year()}/${date.month() + 1}/${date.date()}${
        this.eventId ? '?event=' + this.eventId : ''
      }`
    );

    this.events = this.appointmentService.currentEvents.getValue() || [];
    this.filterEvents();

    const isoDate = date.toISOString(); // ex: 2022-10-01T04:00:00.000Z
    this.viewDate = new Date(isoDate);
    if (mode === 'week') {
      this.weekStart = startOfWeek(this.viewDate);
      this.weekEnd = endOfWeek(this.viewDate);
    }
    // const _date =
    //   moment.tz(isoDate, moment()['_z']?.name || moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss') +
    //   '.000Z'; // converted to 2022-10-01T00:00:00.000Z
    this.load(isoDate, mode);

    if (this.view === CalendarView.Day || this.view === CalendarView.Week) {
      const index = this.view === CalendarView.Day ? 9 : 7;
      setTimeout(() => {
        const dom = <HTMLElement>(
          document.querySelector(`.cal-hour:nth-child(${index})`)
        );
        if (dom) {
          const offsetTop = dom.offsetTop;
          window.scrollTo({ top: offsetTop });
        }
      }, 300);
    }
  }

  /**
   * Initialize the subscribers for the user load, calendars load, update command, connection redirect handle
   */
  private initSubscriptions(): void {
    // Profile Load Subscription
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
        this.isPackageCalendar = profile.calendar_info?.is_enabled;
      }
    );

    this.garbageSubscription?.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      if (res._id) {
        // Garbage Setting
        this.garbage = new Garbage().deserialize(res);
        // Load Calendars
        if (this.code) {
          this.connectCalendar(this.action);
        } else {
          this.appointmentService.loadCalendars(true, true);
        }
        // View Mode and Current Date Setting
        this.initModeAndDate();
        this.garbageSubscription?.unsubscribe();
      }
    });

    // Router Load Subscription
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.code = params['code'];
        this.action = this.route.snapshot.params['action'];
      }
      if (params['event']) {
        this.eventId = params['event'];
      }
    });

    // Load Calendars
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription =
      this.appointmentService.calendars$.subscribe((data) => {
        this.accounts = [];
        this.calendars = {};
        this.selectedCalendars =
          this.appointmentService.selectedCalendars.getValue();
        const selectedCalendars = [];
        if (data) {
          data.forEach((account) => {
            const acc = { email: account.email };
            if (account.data) {
              const calendars = [];
              account.data.forEach((e) => {
                calendars.push({ ...e, account: account.email });
                selectedCalendars.push(e.id);
                this.calendars[e.id] = e;
              });
              acc['calendars'] = calendars;
              this.accounts.push(acc);
            }
          });
          // const allCalendarIds = Object.keys(this.calendars);
          // if (this.selectedCalendars && this.selectedCalendars.length) {
          //   for (let i = this.selectedCalendars.length - 1; i >= 0; i--) {
          //     const e = this.selectedCalendars[i];
          //     if (allCalendarIds.indexOf(e) === -1) {
          //       this.selectedCalendars.splice(i, 1);
          //     }
          //   }
          // }

          if (!this.selectedCalendars) {
            this.selectedCalendars = [...selectedCalendars];
          }
        }
      });

    // Event Update Command Handler
    this.updateCommandSubscription &&
      this.updateCommandSubscription.unsubscribe();
    this.updateCommandSubscription =
      this.appointmentService.updateCommand$.subscribe((data) => {
        if (data) {
          if (data.command === 'delete') {
            if (data.data.recurrence_id) {
              const events = this.events.filter((e) => {
                if (e.meta.recurrence_id !== data.data.recurrence_id) {
                  return true;
                }
              });
              this.events = events;
              Object.keys(this.supplementEvents).forEach((key) => {
                for (
                  let i = this.supplementEvents[key].length - 1;
                  i >= 0;
                  i--
                ) {
                  const e = this.supplementEvents[key][i];
                  if (e.meta.recurrence_id == data.data.recurrence_id) {
                    this.supplementEvents[key].splice(i, 1);
                  }
                }
              });
            } else {
              this.events.some((e, index) => {
                if (e.meta.event_id === data.data.event_id) {
                  this.events.splice(index, 1);
                  return true;
                }
              });
              Object.keys(this.supplementEvents).forEach((key) => {
                for (
                  let i = this.supplementEvents[key].length - 1;
                  i >= 0;
                  i--
                ) {
                  const e = this.supplementEvents[key][i];
                  if (e.meta.event_id == data.data.event_id) {
                    this.supplementEvents[key].splice(i, 1);
                  }
                }
              });
            }
            this.filterEvents();
          } else if (data.command === 'update') {
            const event = data.data;
            const _formattedEvent = this._convertStandard2Mine(event);
            if (event.recurrence_id) {
              Object.keys(this.supplementEvents).forEach((key) => {
                for (
                  let i = this.supplementEvents[key].length - 1;
                  i >= 0;
                  i--
                ) {
                  const e = this.supplementEvents[key][i];
                  if (e.meta.recurrence_id == data.data.recurrence_id) {
                    this.supplementEvents[key].splice(i, 1);
                  }
                }
              });
              this.reload();
            } else {
              // update only this event
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === event.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              for (const key in _formattedEvent) {
                originalEvent[key] = _formattedEvent[key];
              }
              this.filterEvents();
            }
          } else if (data.command === 'accept') {
            const acceptData = data.data;
            if (acceptData.recurrence_id) {
              this.events.forEach((e) => {
                if (e.meta.recurrence_id === acceptData.recurrence_id) {
                  this.acceptEvent(e, acceptData.connected_email);
                }
              });
            } else {
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === acceptData.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              this.acceptEvent(originalEvent, acceptData.connected_email);
            }
          } else if (data.command === 'decline') {
            const declineData = data.data;
            if (declineData.recurrence_id) {
              this.events.forEach((e) => {
                if (e.meta.recurrence_id === declineData.recurrence_id) {
                  this.declineEvent(e, declineData.connected_email);
                }
              });
            } else {
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === declineData.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              this.declineEvent(originalEvent, declineData.connected_email);
            }
          } else if (data.command === 'recurrence') {
            Object.keys(this.supplementEvents).forEach((key) => {
              for (let i = this.supplementEvents[key].length - 1; i >= 0; i--) {
                const e = this.supplementEvents[key][i];
                if (e.meta.recurrence_id == data.data.recurrence_id) {
                  this.supplementEvents[key].splice(i, 1);
                }
              }
            });
            this.reload();
          }
        }
      });
  }

  connectCalendar(action: string): void {
    if (action == 'outlook') {
      this.userService.authorizeOutlookCalendar(this.code).subscribe((res) => {
        if (res['status']) {
          const data = {
            connected_calendar_type: 'outlook',
            connected_email: res?.data?.account,
            id: res?.data?.id,
            outlook_refresh_token: this.code
          };
          const index = this.user.calendar_list.findIndex(
            (e) => e.connected_email === res?.data?.account
          );
          if (index === -1) {
            this.user.calendar_list.push(data);
          }
          this.user.calendar_connected = true;
          if (
            !this.user.onboard.connect_calendar &&
            this.user.user_version >= 2.1
          ) {
            this.user.onboard.connect_calendar = true;
            this.isRedirect = true;
            this.userService
              .updateProfile({
                onboard: this.user.onboard
              })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard,
                  calendar_connected: this.user.calendar_connected
                });
              });
          } else {
            this.isRedirect = false;
            this.userService.updateProfileImpl(this.user);
          }
          this.appointmentService.loadCalendars(true, false);
          if (this.isRedirect) {
            this.router.navigate(['/contacts']);
          } else {
            this.router.navigate(['/settings/integration']);
          }
        }
      });
    }
    if (action == 'google') {
      this.userService.authorizeGoogleCalendar(this.code).subscribe((res) => {
        if (res['status']) {
          const data = {
            connected_calendar_type: 'google',
            connected_email: res?.data?.account,
            google_refresh_token: this.code,
            id: res?.data?.id
          };
          const index = this.user.calendar_list.findIndex(
            (e) => e.connected_email === res?.data?.account
          );
          if (index === -1) {
            this.user.calendar_list.push(data);
          }
          this.user.calendar_connected = true;
          if (!this.user.onboard.connect_calendar) {
            this.user.onboard.connect_calendar = true;
            this.isRedirect = true;
            this.userService
              .updateProfile({
                onboard: this.user.onboard
              })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard,
                  calendar_connected: this.user.calendar_connected
                });
              });
          } else {
            this.isRedirect = false;
            this.userService.updateProfileImpl(this.user);
          }
          this.appointmentService.loadCalendars(true, false);
          if (this.isRedirect) {
            this.router.navigate(['/contacts']);
          } else {
            this.router.navigate(['/settings/integration']);
          }
        }
      });
    }
  }

  load(date: string, mode: string): void {
    let durationDays = [];
    let nextStart;
    let nextDurationStart;
    let next2Start;
    let next2DurationStart;
    let prevStart;
    let prevDurationStart;
    let prev2Start;
    let prev2DurationStart;
    const defaultTimezoneName = moment()['_z']?.name
      ? moment()['_z'].name
      : moment.tz.guess();
    // Profile timezone start day of month -> 2024-12-31T18:30:00.000Z(ex: India Timezone)
    const currentMonthStart = moment(date).startOf('month');
    // UTC timezone start day of month -> 2025-01-01T00:00:00.000Z
    const currentDurationStart = moment(
      moment
        .tz(currentMonthStart, defaultTimezoneName)
        .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
    );
    switch (mode) {
      case 'month':
        nextStart = moment(date).startOf('month').add(1, 'months');
        nextDurationStart = moment(
          moment
            .tz(nextStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        next2Start = moment(date).startOf('month').add(2, 'months');
        next2DurationStart = moment(
          moment
            .tz(next2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prevStart = moment(date).startOf('month').subtract(1, 'months');
        prevDurationStart = moment(
          moment
            .tz(prevStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prev2Start = moment(date).startOf('month').subtract(2, 'months');
        prev2DurationStart = moment(
          moment
            .tz(prev2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          currentDurationStart,
          nextDurationStart,
          next2DurationStart
        ];
        break;
      case 'week':
        nextStart = moment(date).startOf('month');
        nextDurationStart = moment(
          moment
            .tz(nextStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        next2Start = moment(date).startOf('month').add(1, 'months');
        next2DurationStart = moment(
          moment
            .tz(next2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prevStart = moment(date).startOf('month').subtract(1, 'months');
        prevDurationStart = moment(
          moment
            .tz(prevStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prev2Start = moment(date).startOf('month').subtract(2, 'months');
        prev2DurationStart = moment(
          moment
            .tz(prev2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          nextDurationStart,
          next2DurationStart
        ];
        break;
      case 'day':
        nextStart = moment(date).startOf('month');
        nextDurationStart = moment(
          moment
            .tz(nextStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        next2Start = moment(date).startOf('month').add(1, 'months');
        next2DurationStart = moment(
          moment
            .tz(next2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prevStart = moment(date).startOf('month').subtract(1, 'months');
        prevDurationStart = moment(
          moment
            .tz(prevStart, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        prev2Start = moment(date).startOf('month').subtract(2, 'months');
        prev2DurationStart = moment(
          moment
            .tz(prev2Start, defaultTimezoneName)
            .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
        );
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          nextDurationStart,
          next2DurationStart
        ];
        break;
    }
    const durationsToLoad = _.differenceBy(
      durationDays,
      this.supplementDays,
      (e) => e.format('YYYY-MM-DD')
    );
    const durationsToRemove = _.differenceBy(
      this.supplementDays,
      durationDays,
      (e) => e.format('YYYY-MM-DD')
    );

    const currentDatePos = _.findIndex(
      durationsToLoad,
      (e) => e.toISOString() === date
    );
    if (currentDatePos !== -1) {
      durationsToLoad.splice(currentDatePos, 1);
    }
    this.supplementDays = durationDays;

    // Fill with Preloaded Data
    const supplementEvents = Object.values(this.supplementEvents);
    let events = [];
    supplementEvents.forEach((e) => {
      if (e instanceof Array) {
        events = [...events, ...e];
      }
    });
    this.events = [...this.events, ...events];
    this.events = _.uniqWith(
      this.events,
      (a, b) =>
        a.meta?.event_id == b.meta?.event_id &&
        a.meta?.calendar_id === b.meta?.calendar_id
    );
    this.filterEvents();
    // Main Load
    this.loadEvent(date, mode);
    // Another Load
    this.anotherLoad(durationsToLoad, durationsToRemove);
  }

  updateSupplementEvents(min_date, max_date, month_date, events): void {
    if (this.supplementEvents[month_date]) {
      for (let i = 0; i < this.supplementEvents[month_date]?.length; i++) {
        const sup_event = this.supplementEvents[month_date][i];
        const event_date = moment(sup_event.start).toISOString();
        if (event_date >= min_date && event_date <= max_date) {
          this.supplementEvents[month_date].splice(i, 1);
          i--;
        }
      }
    }
    if (events?.length > 0) {
      this.supplementEvents[month_date] = [
        ...(this.supplementEvents[month_date] || []),
        ...events
      ];
      this.supplementEvents[month_date].sort((a, b) =>
        a.start < b.start ? -1 : 1
      );
    }
  }

  private loadEvent(date: string, mode: string): void {
    this.isLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.appointmentService
      .getEvents(date, mode)
      .subscribe((res) => {
        this.isLoading = false;
        if (res) {
          const _events = this.formatEvents(res);
          this.events = _events;

          const month_date = getDateByTimeZone(moment(date).startOf('month'));
          const { min_date, max_date } = getIntervalDate(date, mode);
          this.updateSupplementEvents(
            min_date.toISOString(),
            max_date.toISOString(),
            month_date.toISOString(),
            this.events
          );

          const supplementEvents = Object.values(this.supplementEvents);
          let _supplementEvents = [];
          supplementEvents.forEach((e) => {
            if (e instanceof Array) {
              _supplementEvents = [..._supplementEvents, ...e];
            }
          });
          this.events = [...this.events, ..._supplementEvents];
          this.events = _.uniqWith(
            this.events,
            (a, b) =>
              a.meta.event_id == b.meta.event_id &&
              a.meta.calendar_id === b.meta.calendar_id
          );
          if (mode === 'month') {
            this.supplementEvents[month_date.toISOString()] = _events;
          }

          const loadedDate = new Date(date);
          const currentDate = new Date();
          if (
            loadedDate.getMonth() === currentDate.getMonth() &&
            loadedDate.getFullYear() === currentDate.getFullYear()
          ) {
            this.appointmentService.currentEvents.next([
              ...this.events,
              ..._events
            ]);
          }
          this.filterEvents();
        }
      });
  }

  private anotherLoad(daysToLoad: any[], daysToRemove: any[]): void {
    daysToRemove.forEach((duration) => {
      delete this.supplementEvents[duration.toISOString()];
    });
    daysToLoad.forEach((duration) => {
      this.anotherLoadSubscriptions[duration.toISOString()] &&
        this.anotherLoadSubscriptions[duration.toISOString()].unsubscribe();
      this.anotherLoadSubscriptions[duration.toISOString()] =
        this.appointmentService
          .getEvents(duration.toISOString(), 'month')
          .subscribe((_events) => {
            if (_events) {
              this.mergeEvents(_events, duration);
            }
          });
    });
  }

  private mergeEvents(_events, duration): void {
    const _results = this.formatEvents(_events);
    this.supplementEvents[duration.toISOString()] = _results;
    const supplementEvents = Object.values(this.supplementEvents);
    let _supplementEvents = [];
    supplementEvents.forEach((e) => {
      if (e instanceof Array) {
        _supplementEvents = [..._supplementEvents, ...e];
      }
    });
    this.events = [...this.events, ..._supplementEvents];
    this.events = _.uniqWith(
      this.events,
      (a, b) =>
        a.meta.event_id == b.meta.event_id &&
        a.meta.calendar_id === b.meta.calendar_id
    );

    const loadedDate = new Date(duration.toISOString());
    const currentDate = new Date();
    if (
      loadedDate.getMonth() === currentDate.getMonth() &&
      loadedDate.getFullYear() === currentDate.getFullYear()
    ) {
      this.appointmentService.currentEvents.next([...this.events, ..._results]);
    }
    this.filterEvents();
  }

  private reload(): any {
    const date = this.viewDate.toISOString();
    const mode = this.view;
    this.isUpdating = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.appointmentService
      .getEvents(date, mode)
      .subscribe((res) => {
        if (res) {
          const _events = this.formatEvents(res);
          this.events = _events;

          const month_date = getDateByTimeZone(moment(date).startOf('month'));
          const { min_date, max_date } = getIntervalDate(date, mode);
          this.updateSupplementEvents(
            min_date.toISOString(),
            max_date.toISOString(),
            month_date.toISOString(),
            this.events
          );

          const supplementEvents = Object.values(this.supplementEvents);
          let _supplementEvents = [];
          supplementEvents.forEach((e) => {
            if (e instanceof Array) {
              _supplementEvents = [..._supplementEvents, ...e];
            }
          });
          this.events = [...this.events, ..._supplementEvents];
          this.events = _.uniqWith(
            this.events,
            (a, b) =>
              a.meta.event_id == b.meta.event_id &&
              a.meta.calendar_id === b.meta.calendar_id
          );
          if (mode === 'month') {
            this.supplementEvents[month_date.toISOString()] = _events;
          }
          this.isUpdating = false;
          this.filterEvents();
        }
      });
  }

  private formatEvents(events) {
    const _events = [];
    events.forEach((calendar) => {
      if (calendar['status']) {
        const subCalendars =
          calendar['calendar'] && calendar['calendar']['data'];
        subCalendars.forEach((subCalendar) => {
          const events = subCalendar.items;
          events.forEach((event) => {
            // due_start, due_end is the date string with timezone info. ex: 2025-01-11T18:30:00.000+05:30
            // _start, _end are the date in local timezone.
            // But the before moment object in profile timezone (because moment default timezone is set as profile timezone already)
            let _start = moment(event.due_start).toDate();
            let _end = moment(event.due_end).toDate();
            if (event.service_type === 'outlook') {
              // For outlook events, the date should be thought as UTC timezone because it doesn't include the timezone string like
              // 2025-01-11T18:30:00.000 (It doesn't have +08:00 timezone indicator)
              if (!event.is_full) {
                if (!ZONEREG.test(event.due_start)) {
                  _start = moment(event.due_start + 'Z').toDate();
                }
                if (!ZONEREG.test(event.due_end)) {
                  _end = moment(event.due_end + 'Z').toDate();
                }
              }
              if (
                subCalendar.recurrence_info[event.recurrence_id]
                  ?.originalStartTime &&
                !ZONEREG.test(
                  subCalendar.recurrence_info[event.recurrence_id]
                    ?.originalStartTime
                )
              ) {
                subCalendar.recurrence_info[
                  event.recurrence_id
                ].originalStartTime = moment(
                  subCalendar.recurrence_info[event.recurrence_id]
                    .originalStartTime + 'Z'
                ).toDate();
              }
              if (
                subCalendar.recurrence_info[event.recurrence_id]
                  ?.originalEndTime &&
                !ZONEREG.test(
                  subCalendar.recurrence_info[event.recurrence_id]
                    ?.originalEndTime
                )
              ) {
                subCalendar.recurrence_info[
                  event.recurrence_id
                ].originalEndTime = moment(
                  subCalendar.recurrence_info[event.recurrence_id]
                    .originalEndTime + 'Z'
                ).toDate();
              }
            }
            // console.log(
            //   moment(event.due_start),
            //   moment(event.due_end),
            //   _start,
            //   _end,
            //   event.due_start,
            //   event.due_end
            // );
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
            if (event.recurrence_id) {
              _formattedEvent.meta = {
                ..._formattedEvent.meta,
                recurrence:
                  subCalendar.recurrence_info[event.recurrence_id]?.recurrence,
                originalStartTime:
                  subCalendar.recurrence_info[event.recurrence_id]
                    ?.originalStartTime,
                originalEndTime:
                  subCalendar.recurrence_info[event.recurrence_id]
                    ?.originalEndTime,
                until: subCalendar.recurrence_info[event.recurrence_id]?.until
              };
            }
            if (event.is_full) {
              _formattedEvent['date'] = event.due_start;
            }
            _events.push(_formattedEvent);
          });
        });
      }
    });
    return _events;
  }

  private filterEvents(): void {
    const { startHour, startMin, endHour, endMin } = GetTime(
      this.garbage.calendar_info?.start_time,
      this.garbage.calendar_info?.end_time
    );
    this.dayEvents = {};
    this.showingEvents = [];
    this.events.forEach((e) => {
      if (
        this.selectedCalendars &&
        this.selectedCalendars.indexOf(e.meta.calendar_id) !== -1
      ) {
        const startTimeEvent = moment.tz(e.start, moment()['_z']?.name);
        const endTimeEvent = moment.tz(e.start, moment()['_z']?.name);
        const startHourEvent = startTimeEvent.get('hour');
        const startMinEvent = startTimeEvent.get('minute');
        const endHourEvent = endTimeEvent.get('hour');
        const endMinEvent = endTimeEvent.get('minute');
        if (
          !e.meta.is_full &&
          (startHour < startHourEvent ||
            (startHour == startHourEvent && startMin <= startMinEvent)) &&
          (endHour > endHourEvent ||
            (endHour == endHourEvent && endMin >= endMinEvent))
        ) {
          this.showingEvents.push(e);
        }
        try {
          if (e.meta.is_full) {
            const key = e['date'];
            if (this.dayEvents[key]) {
              this.dayEvents[key].push(e);
            } else {
              this.dayEvents[key] = [e];
            }
            if (this.view === 'month') {
              this.showingEvents.push(e);
            }
          }
        } catch (e) {
          console.log('date compare error');
        }
      }
    });

    // Open the popup if the router has event id
    if (this.eventId) {
      this.events.some((e) => {
        if (
          this.eventId === e.meta.event_id ||
          e.meta.event_id.indexOf(this.eventId) !== -1
        ) {
          const domEle = `${moment
            .tz(e.start, moment()['_z']?.name)
            .format('YYYY-MM-DD')}`;
          setTimeout(() => {
            const dom = document.querySelector(`[event^='${domEle}']`);
            if (dom) {
              this.openDetail(e, dom);
            }
            return true;
          }, 1000);
        }
      });
    }

    this.changeDetectorRef.detectChanges();
  }

  getDayEvent(date: any): any {
    if (date) {
      try {
        const key = moment.tz(date, moment()['_z']?.name).format('YYYY-MM-DD');
        return this.dayEvents[key];
      } catch (err) {
        return [];
      }
    } else {
      const datesArr = Object.values(this.dayEvents);
      if (datesArr && datesArr.length) {
        return datesArr[0];
      } else {
        return [];
      }
    }
  }

  toggleCalendar(calendar): void {
    const pos = this.selectedCalendars.indexOf(calendar.id);
    if (pos === -1) {
      this.selectedCalendars.push(calendar.id);
    } else {
      this.selectedCalendars.splice(pos, 1);
    }
    this.filterEvents();
    this.appointmentService.selectedCalendars.next(this.selectedCalendars);
  }

  /***********************************************************************
   *                    Overlay Event Handlers
   ***********************************************************************/
  createEvent($event): void {
    this.reload();
  }

  acceptEvent(event, user_email): void {
    event.meta.guests.some((guest) => {
      if (guest.email === user_email) {
        guest.response = 'accepted';
        return true;
      }
    });
  }

  declineEvent(event, user_email): void {
    event.meta.guests.some((guest) => {
      if (guest.email === user_email) {
        guest.response = 'declined';
        return true;
      }
    });
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    switch (this.selectedTab.id) {
      case 'month':
        this.location.replaceState(
          `/calendar/month/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/1`
        );
        this.view = CalendarView.Month;
        break;
      case 'week':
        this.location.replaceState(
          `/calendar/week/${this.viewDate.getFullYear()}/${
            startOfWeek(this.viewDate).getMonth() + 1
          }/${startOfWeek(this.viewDate).getDate()}`
        );
        this.view = CalendarView.Week;
        this.weekStart = startOfWeek(this.viewDate);
        this.weekEnd = endOfWeek(this.viewDate);
        break;
      case 'day':
        const todayWeekStart = startOfWeek(this.today);
        const todayWeekEnd = endOfWeek(this.today);
        const weekStart = startOfWeek(this.viewDate);
        const weekEnd = endOfWeek(this.viewDate);
        if (
          todayWeekStart.getTime() === weekStart.getTime() &&
          todayWeekEnd.getTime() === weekEnd.getTime()
        ) {
          this.viewDate = this.today;
        }
        this.location.replaceState(
          `/calendar/day/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/${this.viewDate.getDate()}`
        );
        this.view = CalendarView.Day;
        break;
    }
    const isoDate = this.viewDate.toISOString();
    // const _date =
    //   moment.tz(isoDate, moment()['_z']?.name || moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss') +
    //   '.000Z';
    this.load(isoDate, this.selectedTab.id);

    if (this.view === CalendarView.Day || this.view === CalendarView.Week) {
      const index = this.view === CalendarView.Day ? 9 : 7;
      setTimeout(() => {
        const dom = <HTMLElement>(
          document.querySelector(`.cal-hour:nth-child(${index})`)
        );
        if (dom) {
          const offsetTop = dom.offsetTop;
          window.scrollTo({ top: offsetTop });
        }
      }, 300);
    }

    localStorage.setCrmItem('calendarTab', this.selectedTab.id);
  }

  calendarDateChange(mode = ''): void {
    switch (this.view) {
      case 'month':
        this.location.replaceState(
          `/calendar/month/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/1`
        );
        break;
      case 'week':
        this.location.replaceState(
          `/calendar/week/${this.viewDate.getFullYear()}/${
            startOfWeek(this.viewDate).getMonth() + 1
          }/${startOfWeek(this.viewDate).getDate()}`
        );
        this.weekStart = startOfWeek(this.viewDate);
        this.weekEnd = endOfWeek(this.viewDate);
        break;
      case 'day':
        this.location.replaceState(
          `/calendar/day/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/${this.viewDate.getDate()}`
        );
        break;
    }
    const isoDate = this.viewDate.toISOString();
    // const _date =
    //   moment.tz(isoDate, moment()['_z']?.name || moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss') +
    //   '.000Z';
    this.load(isoDate, this.selectedTab.id);
  }

  /***********************************************************************
   *                    Dialog Management
   ***********************************************************************/
  addCalendar(): void {
    this.dialog.open(ConnectNewCalendarComponent, {
      width: '98vw',
      maxWidth: '420px'
    });
  }

  calendarSetting(): void {
    this.dialog
      .open(CalendarSettingComponent, {
        width: '100vw',
        maxWidth: '500px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const subscription = this.userService.garbage$.subscribe(
            (_garbage) => {
              if (_garbage._id) {
                this.garbage = new Garbage().deserialize(_garbage);
                this.reload();
                subscription?.unsubscribe();
              }
            }
          );
        }
      });
  }

  newEvent(): void {
    this.overlayService.close(null);
    this.dialog
      .open(CalendarEventDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        data: {
          mode: 'dialog',
          user_email: this.user.email
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reload();
        }
      });
  }

  /***********************************************************************
   *                    Convert Helpers
   ***********************************************************************/
  _convertStandard2Mine(event: any) {
    const res = {
      title: event.title,
      start: new Date(event.due_start),
      end: new Date(event.due_end),
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
        is_full: event.is_full,
        originalStartTime: event.originalStartTime,
        originalEndTime: event.originalEndTime,
        until: event.until
      }
    };
    return res;
  }
  _convertStandard2Original(event: any) {
    if (event.guests && event.guests.length) {
      const guests = [];
      event.guests.forEach((e) => {
        let guest;
        if (typeof e === 'string') {
          guest = {
            response: 'needsAction',
            email: e
          };
        } else {
          guest = e;
        }
        guests.push(guest);
      });
      event.guests = guests;
    }
    return event;
  }

  /**
   * Check the start and end date are in morning or afternoon
   * @param start: Start Date
   * @param end: End Date
   * @returns: boolean
   */
  getDurationOption(start, end): boolean {
    let startDate, endDate;
    if (typeof start === 'string') {
      startDate = new Date(start);
    } else {
      startDate = start;
    }
    if (typeof end === 'string') {
      endDate = new Date(end);
    } else {
      endDate = end;
    }
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();

    return (
      (startHour >= 12 && endHour >= 12) || (startHour <= 12 && endHour <= 12)
    );
  }

  /***********************************************************************
   *                    Overlay Management
   ***********************************************************************/
  openOverlay(day: any, trigger: any): void {
    if (day && day.date) {
      day = {
        ...day,
        date: day.date
      };
    } else {
      day = day;
    }

    const triggerEl = <HTMLElement>trigger;
    const originBounding = triggerEl.getBoundingClientRect();
    const originX = originBounding.x;
    const originY = originBounding.y;
    const originW = originBounding.width;
    const originH = originBounding.height;
    const originEndX = originX + originW;
    let originEndY = originY + originH;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    originEndY = originEndY > screenH - 30 ? screenH - 30 : originEndY;

    const size = {
      maxWidth: '550px',
      minWidth: '300px',
      maxHeight: 700,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (originX > 570) {
      // Set Right of overlay
      positionStrategy.left(originX - 570 + 'px');
    } else if (originX > 500) {
      positionStrategy.left(10 + 'px');
    } else if (screenW - originEndX > 570) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else if (screenW - originEndX > 500) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 600) {
      positionStrategy.centerVertically();
      size['height'] = screenH - 70;
    } else if (screenH - originY > 710) {
      positionStrategy.top(originY - 10 + 'px');
      size['height'] = 690;
    } else if (originEndY > 710) {
      positionStrategy.bottom(screenH - originEndY - 10 + 'px');
      size['height'] = 690;
    } else {
      positionStrategy.top('100px');
      size['height'] = screenH - 120;
    }

    this.templatePortal = new TemplatePortal(
      this.creatPortalContent,
      this._viewContainerRef
    );

    if (day && day.date) {
      this.selectedDate = day.date;
    } else {
      this.selectedDate = day;
    }

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.eventId = '';
      } else {
        this.overlayRef.updatePositionStrategy(positionStrategy);
        this.overlayRef.updateSize(size);
        this.overlayRef.attach(this.templatePortal);
      }
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.attach(this.templatePortal);
    }
    if (this.overlayRef) {
      this.overlayCloseSubscription &&
        this.overlayCloseSubscription.unsubscribe();
      this.overlayCloseSubscription = this.overlayRef
        .outsidePointerEvents()
        .subscribe((event) => {
          const targetEl = <HTMLElement>event.target;
          console.log(
            'calendar contact select trigger',
            targetEl,
            targetEl.closest('.cal-event'),
            targetEl.closest('.cal-month-cell'),
            targetEl.closest('.event-backdrop'),
            targetEl.closest('.event-panel'),
            targetEl.closest('.calendar-contact')
          );
          if (targetEl.closest('.cal-hour')) {
            return;
          }
          if (targetEl.closest('.cal-event')) {
            return;
          }
          if (targetEl.closest('.cal-month-cell')) {
            return;
          }
          if (targetEl.closest('.event-backdrop')) {
            return;
          }
          if (targetEl.closest('.event-panel')) {
            return;
          }
          if (targetEl.closest('.calendar-contact')) {
            return;
          }
          if (targetEl.closest('.dropdown-timezone')) {
            return;
          }
          this.overlayRef.detach();
          this.eventId = '';
          return;
        });
    }
  }
  onShowMoreDetail(item: any): void {
    if (item.event && item.trigger) {
      this.openDetail(item.event, item.trigger);
    }
  }
  openDetail(event: any, trigger: any): void {
    this.event = event;

    const triggerEl = <HTMLElement>trigger;
    const originBounding = triggerEl.getBoundingClientRect();
    const originX = originBounding.x;
    const originY = originBounding.y;
    const originW = originBounding.width;
    const originH = originBounding.height;
    const originEndX = originX + originW;
    let originEndY = originY + originH;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    originEndY = originEndY > screenH - 30 ? screenH - 30 : originEndY;

    const size = {
      maxWidth: '300px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (originX > 310) {
      // Set Right of overlay
      positionStrategy.left(originX - 310 + 'px');
    } else if (screenW - originEndX > 310) {
      positionStrategy.left(originEndX + 10 + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 380) {
      positionStrategy.centerVertically();
      // size['height'] = screenH - 40;
    } else if (screenH - originY > 420) {
      positionStrategy.top(originY + 'px');
      // size['height'] = 420;
    } else if (originEndY > 420) {
      positionStrategy.bottom(screenH - originEndY + 'px');
      // size['height'] = 420;
    } else {
      positionStrategy.top('30px');
      // size['height'] = screenH - 50;
    }
    size['height'] = 'unset';

    this.templatePortal = new TemplatePortal(
      this.detailPortalContent,
      this._viewContainerRef
    );

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.eventId = '';
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.attach(this.templatePortal);
    }
    if (this.overlayRef) {
      this.overlayCloseSubscription &&
        this.overlayCloseSubscription.unsubscribe();
      this.overlayCloseSubscription = this.overlayRef
        .outsidePointerEvents()
        .subscribe((event) => {
          const targetEl = <HTMLElement>event.target;
          if (targetEl.closest('.cal-event')) {
            return;
          }
          if (targetEl.closest('.cal-month-cell')) {
            return;
          }
          if (targetEl.closest('.event-backdrop')) {
            return;
          }
          if (targetEl.closest('.event-panel')) {
            return;
          }
          this.overlayRef.detach();
          this.eventId = '';
          return;
        });
    }
  }

  closeOverlay(event: any): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
    if (event) {
      if (event.command === 'delete' && event.data) {
        this.events.some((e, index) => {
          if (e.meta.event_id === event.data.event_id) {
            this.events.splice(index, 1);
            return true;
          }
        });
        if (event.data.recurrence_id) {
          Object.keys(this.supplementEvents).forEach((key) => {
            for (let i = this.supplementEvents[key].length - 1; i >= 0; i--) {
              const e = this.supplementEvents[key][i];
              if (e.meta.recurrence_id == event.data.recurrence_id) {
                this.supplementEvents[key].splice(i, 1);
              }
            }
          });
        } else {
          Object.keys(this.supplementEvents).forEach((key) => {
            for (let i = this.supplementEvents[key].length - 1; i >= 0; i--) {
              const e = this.supplementEvents[key][i];
              if (e.meta.event_id == event.data.event_id) {
                this.supplementEvents[key].splice(i, 1);
              }
            }
          });
        }
        this.filterEvents();
      }
    }
  }

  moreView(event: any, origin: any, content: any): void {
    this.overlayService.open(
      origin,
      content,
      this.viewContainerRef,
      'automation',
      {
        data: event
      }
    );
  }
}
