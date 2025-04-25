import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  map,
  of
} from 'rxjs';
import { environment } from '@environments/environment';
import { INTEGRATION, SMS, USER } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ConnectService {
  logoutSignal = new Subject<any>();
  calendlyAll: BehaviorSubject<any[]> = new BehaviorSubject([]);
  calendlyAll$ = this.calendlyAll.asObservable();
  loadCalendlyAllStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingCalendlyAll$ = this.loadCalendlyAllStatus.asObservable();

  constructor(private httpClient: HttpClient, private toast: ToastrService) {}

  public requestSyncUrl(type: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    switch (type) {
      case 'gmail':
        return this.httpClient.get(environment.api + USER.SYNC_GMAIL).pipe(
          map((res) => res),
          catchError(this.handleError('Sync Error gmail', null))
        );
      case 'outlook':
        return this.httpClient.get(environment.api + USER.SYNC_OUTLOOK).pipe(
          map((res) => res),
          catchError(this.handleError('Sync Error outlook', null))
        );
    }
  }

  public connectAnotherService(): Observable<any> {
    return this.httpClient.get(environment.api + USER.SET_ANOTHER_MAIL).pipe(
      map((res) => res),
      catchError(this.handleError('Connect Service Error', null))
    );
  }

  public requestCalendarSyncUrl(type: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    switch (type) {
      case 'gmail':
        return this.httpClient
          .get(environment.api + USER.CALENDAR_SYNC_GMAIL)
          .pipe(
            map((res) => res),
            catchError(this.handleError('Request Calender Error', null))
          );
      case 'outlook':
        return this.httpClient
          .get(environment.api + USER.CALENDAR_SYNC_OUTLOOK)
          .pipe(
            map((res) => res),
            catchError(this.handleError('Request Calender Error', null))
          );
    }
  }

  public connectCalendly(apiKey: any): any {
    return this.httpClient
      .post(environment.api + INTEGRATION.CHECK_CALENDLY, apiKey)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Connect Calendly Error', null))
      );
  }

  public disconnectCalendly(): any {
    return this.httpClient
      .get(environment.api + INTEGRATION.DISCONNECT_CALENDLY)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Disconnect Calendly Error', null))
      );
  }

  public searchNumbers(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.SEARCH_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('Search Number Error', null))
    );
  }

  public buyNumbers(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.BUY_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('Buy Numbers Error', null))
    );
  }

  public buyCredit(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.BUY_CREDIT, data).pipe(
      map((res) => res),
      catchError(this.handleError('Buy Credit Error', null))
    );
  }
  public getToken(): any {
    return this.httpClient
      .get(environment.api + INTEGRATION.GET_JWT_TOKEN)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Get Token Error', null))
      );
  }

  public getApiKey(): any {
    return this.httpClient
      .get(environment.api + INTEGRATION.GET_CRYPTO_TOKEN)
      .pipe(
        map((res) => res),
        catchError(this.handleError('API Key Error', null))
      );
  }

  public buyWavvSubscription(): Observable<any> {
    return this.httpClient
      .get(environment.api + SMS.BUY_WAVV_SUBSCRIPTION)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Buy Wavv Subscription Error', null))
      );
  }

  public getWavvState(): Observable<any> {
    return this.httpClient.get(environment.api + SMS.GET_WAVV_STATE).pipe(
      map((res) => res),
      catchError(this.handleError('Get Wavv State Error', null))
    );
  }

  public updateSubscriptionState(data): any {
    return this.httpClient
      .put(environment.api + SMS.UPDATE_WAVV_SUBSCRIPTION, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Update Subscription Error', null))
      );
  }

  public loadCalendlyAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadCalendlyAllStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadCalendlyAllStatus.next(STATUS.REQUEST);
    this.getEvent().subscribe((calendlyList) => {
      calendlyList.data
        ? this.loadCalendlyAllStatus.next(STATUS.SUCCESS)
        : this.loadCalendlyAllStatus.next(STATUS.FAILURE);
      this.calendlyAll.next(calendlyList.data || []);
    });
  }

  public getEvent(): Observable<any> {
    return this.httpClient.get(environment.api + INTEGRATION.GET_CALENDLY).pipe(
      map((res) => res),
      catchError(this.handleError('Get Event Error', null))
    );
  }

  public setEvent(event: any): any {
    return this.httpClient
      .post(environment.api + INTEGRATION.SET_EVENT, event)
      .pipe(
        map((res) => res),
        catchError(this.handleError('Set Event Error', null))
      );
  }

  public getWavvIDForVortex(): Observable<any> {
    return this.httpClient.get(environment.api + USER.WAVV_ID).pipe(
      map((res) => res),
      catchError(this.handleError('Get Wavv Id Error', null))
    );
  }

  public sendLogout(): void {
    this.logoutSignal.next(new Date());
  }

  public receiveLogout(): Observable<any> {
    return this.logoutSignal.asObservable();
  }

  public updateCard(card: any): Observable<any> {
    const { card_id, exp_year, exp_month } = card;
    return this.httpClient
      .post(environment.api + USER.UPDATE_CARD, {
        card_id,
        exp_year,
        exp_month
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('Update Card Error', null))
      );
  }

  public addCard(token: any, captchaToken: string): Observable<any> {
    return this.httpClient
      .post(environment.api + USER.ADD_CARD, { token, captchaToken })
      .pipe(
        map((res) => res),
        catchError(this.handleError('Add Card Error', null))
      );
  }

  private handleError<T>(
    operation = 'Server Connection',
    result?: T,
    returnError = false,
    disableErrorHandler = false
  ) {
    return (error: any): Observable<T> => {
      // error message add to the Error Service
      const message = (error.error && error.error.error) || 'Unknown Error';
      this.toast.error(message);
      // Inspect the error
      // default data observable
      if (returnError) {
        return of({ ...error.error, statusCode: error.status } as T);
      } else {
        return of(result as T);
      }
      // TODO: return the error object to show the error result
    };
  }
}
