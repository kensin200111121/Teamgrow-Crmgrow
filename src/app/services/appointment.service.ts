import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { APPOINTMENT } from '@constants/api.constant';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { STATUS } from '@constants/variable.constants';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
    this.calendars$.subscribe((calendars) => {
      const subCalendars = {};
      if (calendars) {
        calendars.forEach((account) => {
          if (account.data) {
            account.data.forEach((e) => {
              subCalendars[e.id] = { ...e, account: account.email };
            });
          }
        });
        this.subCalendars.next(subCalendars);
      }
    });
    const pageOption = localStorage.getCrmItem(KEY.CALENDAR.PAGE_OPTION);
    const parsedPageOption = JSONParser(pageOption);
    if (pageOption && parsedPageOption) {
      this.calendarPageOption = parsedPageOption;
      if (this.calendarPageOption['selectedCalendars']) {
        this.selectedCalendars.next(
          this.calendarPageOption['selectedCalendars']
        );
      }
    }

    this.selectedCalendars$.subscribe((res) => {
      this.calendarPageOption = {
        ...this.calendarPageOption,
        selectedCalendars: res
      };
      localStorage.setCrmItem(
        KEY.CALENDAR.PAGE_OPTION,
        JSON.stringify(this.calendarPageOption)
      );
    });
  }

  loadCalendarsStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingCalendars$ = this.loadCalendarsStatus.asObservable();
  calendars: BehaviorSubject<any[]> = new BehaviorSubject([]);
  calendars$ = this.calendars.asObservable();
  subCalendars: BehaviorSubject<any> = new BehaviorSubject(null);
  subCalendars$ = this.subCalendars.asObservable();

  updateCommand = new Subject<any>();
  updateCommand$ = this.updateCommand.asObservable();

  currentMethod: BehaviorSubject<string> = new BehaviorSubject('week');
  currentEvents: BehaviorSubject<any[]> = new BehaviorSubject([]);
  selectedCalendars: BehaviorSubject<string[]> = new BehaviorSubject(null);
  selectedCalendars$ = this.selectedCalendars.asObservable();
  calendarPageOption = {};

  public loadCalendars(force = false, showError = true): void {
    if (!force) {
      const loadStatus = this.loadCalendarsStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
      showError = false;
    }
    this.loadCalendarsStatus.next(STATUS.REQUEST);
    this.loadCalendarsImpl(showError).subscribe((calendars) => {
      calendars
        ? this.loadCalendarsStatus.next(STATUS.SUCCESS)
        : this.loadCalendarsStatus.next(STATUS.FAILURE);
      this.calendars.next(calendars);
    });
  }

  public loadCalendarsImpl(showError): Observable<any> {
    return this.httpClient.get(this.server + APPOINTMENT.LOAD_CALENDARS).pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD CALENDARS', [], null, !showError))
    );
  }

  public getEvents(date: string, mode: string): Observable<any> {
    return this.httpClient
      .get(
        this.server + APPOINTMENT.GET_EVENT + '?date=' + date + '&mode=' + mode
      )
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('LOAD EVENTS', null))
      );
  }
  public createEvents(event: any): any {
    return this.httpClient.post(this.server + APPOINTMENT.GET_EVENT, event);
  }
  public updateEvents(event: any, id: string): any {
    return this.httpClient
      .put(this.server + APPOINTMENT.UPDATE_EVENT + id, event)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE EVENT', null))
      );
  }
  public removeEvents(
    event_id: string,
    recurrence_id: string,
    calendar_id: string,
    connected_email: string
  ): any {
    const recurrence = {
      event_id: event_id,
      recurrence_id: recurrence_id,
      calendar_id: calendar_id,
      connected_email
    };
    return this.httpClient
      .post(this.server + APPOINTMENT.DELETE_EVENT, recurrence)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE EVENT', null))
      );
  }

  public acceptEvent(
    event_id: string,
    recurrence_id: string,
    calendar_id: string,
    connected_email: string,
    organizer: string
  ): Observable<boolean> {
    const event = {
      event_id,
      recurrence_id,
      calendar_id,
      connected_email,
      organizer
    };

    return this.httpClient.post(this.server + APPOINTMENT.ACCEPT, event).pipe(
      map((res) => res['status']),
      catchError(this.handleError('ACCEPT EVENT', false))
    );
  }

  public declineEvent(
    event_id: string,
    recurrence_id: string,
    calendar_id: string,
    connected_email: string,
    organizer: string,
    message: string
  ): Observable<boolean> {
    const event = {
      event_id,
      recurrence_id,
      calendar_id,
      connected_email,
      organizer,
      message
    };

    return this.httpClient.post(this.server + APPOINTMENT.DECLINE, event).pipe(
      map((res) => res['status']),
      catchError(this.handleError('DECLINE EVENT', false))
    );
  }

  public getEvent(data): Observable<any> {
    return this.httpClient.post(this.server + APPOINTMENT.DETAIL, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET DETAIL EVENT', null))
    );
  }

  public removeGuest(data): Observable<any> {
    return this.httpClient
      .post(this.server + APPOINTMENT.REMOVE_CONTACT, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE CONTACT APPOINTMENT', null))
      );
  }
}
