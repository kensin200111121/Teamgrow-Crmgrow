import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  ViewChild
} from '@angular/core';
import moment from 'moment-timezone';
import * as _ from 'lodash';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '@services/appointment.service';
import { GetTime } from '@app/helper';
import { Garbage } from '@models/garbage.model';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { environment } from '@environments/environment';
const ZONEREG = /-[0-1][0-9]:00|Z/;
@Component({
  selector: 'app-overview-calendar',
  templateUrl: './overview-calendar.component.html',
  styleUrls: ['./overview-calendar.component.scss']
})
export class OverviewCalendarComponent implements OnInit {
  user: any = {};
  dayEvents: any = {};
  events: CalendarEvent[] = [];
  event: any;
  viewDate: Date = new Date();
  showingEvents: CalendarEvent[] = [];
  supplementEvents = {};
  supplementDays: any[] = [];
  garbage: Garbage = new Garbage();
  // Calendars
  accounts: any[] = [];
  calendars = {};
  selectedCalendars = [];
  view: CalendarView = CalendarView.Day;

  queryParamSubscription: Subscription;
  loadSubscription: Subscription;
  anotherLoadSubscriptions = {};
  // Relative Subscriptions
  updateCommandSubscription: Subscription;
  calendarLoadSubscription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  isPackageCalendar = true;
  scrollFlag = false;
  @ViewChild('dailyCard') cardBody: ElementRef;

  @ViewChild('detailPortalContent') detailPortalContent: TemplateRef<unknown>;
  @ViewChild('creatPortalContent') creatPortalContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  // event: any;
  selectedDate: any;
  overlayCloseSubscription: Subscription;

  // Event id from router
  eventId = '';

  isLoading = false;

  isSspa = environment.isSspa;
  constructor(
    private overlay: Overlay,
    private router: Router,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private route: ActivatedRoute,
    private _viewContainerRef: ViewContainerRef
  ) {}
  ngOnInit(): void {
    // Initialize Connection Subscription handler & Calendars Loading & Update Event Command
    this.initSubscriptions();
    // After user loading, load events
    this.garbageSubscription?.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      if (res._id) {
        // Garbage Setting
        this.garbage = new Garbage().deserialize(res);

        //Load Calendars
        this.appointmentService.loadCalendars(true, false);

        // View Mode and Current Date Setting
        this.initModeAndDate();
        this.garbageSubscription?.unsubscribe();
      }
    });
  }
  ngAfterViewInit(): void {
    setTimeout(this.setFocusStartHour, 10);
  }
  /**
   * Initialize the subscribers for the user load, calendars load, update command, connection redirect handle
   */
  initSubscriptions(): void {
    // Profile Load Subscription
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
        this.isPackageCalendar = !!(profile.calendar_list?.length > 0);
      }
    );

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
                this.calendars[e.id] = { ...e, account: account.email };
              });
              acc['calendars'] = calendars;
              this.accounts.push(acc);
            }
          });

          if (!this.selectedCalendars) {
            this.selectedCalendars = [...selectedCalendars];
          }
        }
      });
  }

  /**
   * Init the View mode and View start date
   */
  initModeAndDate(): void {
    const currentDay = new Date();
    const currentMethod = localStorage.getCrmItem('calendarTab');
    let date;
    const mode = 'day';
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

    this.events = this.appointmentService.currentEvents.getValue() || [];
    this.filterEvents();

    const isoDate = date.toISOString(); // ex: 2022-10-01T04:00:00.000Z
    this.viewDate = new Date(isoDate);

    this.load(isoDate, mode);
  }

  setFocusStartHour = () => {
    if (
      (this.view === CalendarView.Day || this.view === CalendarView.Week) &&
      this.cardBody.nativeElement
    ) {
      const hour = new Date().getHours();
      const dom = document.querySelector<HTMLElement>(
        `.cal-hour:nth-child(${hour})`
      );
      this.cardBody.nativeElement.scroll(
        0,
        dom.offsetTop + dom.offsetHeight + 24
      );
    }
  };

  openOverlay(day: any, trigger: any): void {
    if (this.isPackageCalendar) {
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
    const currentMonthStart = moment(date).startOf('month');
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
        a.meta.event_id == b.meta.event_id &&
        a.meta.calendar_id === b.meta.calendar_id
    );
    this.filterEvents();
    // Main Load
    this.loadEvent(date, mode);
    // Another Load
    this.anotherLoad(durationsToLoad, durationsToRemove);
  }

  loadEvent(date: string, mode: string): void {
    this.isLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.appointmentService
      .getEvents(date, mode)
      .subscribe((res) => {
        this.isLoading = false;
        if (res) {
          const _events = this.formatEvents(res);
          this.events = _events;
          this.supplementEvents[date] = _events;
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
            const end_date_string = moment(date).startOf('month');
            const defaultTimezoneName = moment()['_z']?.name
            ? moment()['_z'].name
            : moment.tz.guess();
            const duration = moment(
              moment
                .tz(end_date_string, defaultTimezoneName)
                .format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
            );
            this.supplementEvents[duration.toISOString()] = _events;
          }

          const loadedDate = new Date(date);
          const currentDate = new Date();
          if (
            loadedDate.getMonth() === currentDate.getMonth() &&
            loadedDate.getFullYear() === currentDate.getFullYear()
          ) {
            this.appointmentService.currentEvents.next([..._events]);
          }
          this.filterEvents();
        }
      });
  }

  anotherLoad(daysToLoad: any[], daysToRemove: any[]): void {
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

  mergeEvents(_events, duration): void {
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
      this.appointmentService.currentEvents.next([..._results]);
    }
    this.filterEvents();
  }

  formatEvents(events) {
    const _events = [];
    events.forEach((calendar) => {
      if (calendar['status']) {
        const subCalendars =
          calendar['calendar'] && calendar['calendar']['data'];
        subCalendars.forEach((subCalendar) => {
          const events = subCalendar.items;
          events.forEach((event) => {
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

  filterEvents(): void {
    const { startHour, startMin, endHour, endMin } = GetTime(
      this.garbage.calendar_info?.start_time,
      this.garbage.calendar_info?.end_time
    );
    this.dayEvents = {};
    this.showingEvents = [];
    this.events.forEach((e) => {
      if (e.meta.is_full) {
        //console.log('full filter event', e);
      }
      if (
        this.selectedCalendars &&
        this.selectedCalendars.indexOf(e.meta.calendar_id) !== -1
      ) {
        if (
          !e.meta.is_full &&
          (startHour < e.start.getHours() ||
            (startHour == e.start.getHours() &&
              startMin <= e.start.getMinutes())) &&
          (endHour > e.end.getHours() ||
            (endHour == e.end.getHours() && endMin >= e.end.getMinutes()))
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
  }

  goToCalendar() {
    this.router.navigate(['/calendar']);
  }

  getDayEvent(date: any): any {
    if (date) {
      try {
        const key = moment(date).format('YYYY-MM-DD');
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

  onSelectCalendar(item: any) {
    if (!this.selectedCalendars.includes(item.key)) {
      this.selectedCalendars.push(item.key);
    } else {
      this.selectedCalendars = this.selectedCalendars.filter(
        (e) => e !== item.key
      );
    }
    this.filterEvents();
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
      this.initSubscriptions();
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
}
