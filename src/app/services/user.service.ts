import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AUTH, GARBAGE, PAGE_BUILDER, USER } from '@constants/api.constant';
import { Garbage } from '@models/garbage.model';
import { Template } from '@models/template.model';
import { Account, User } from '@models/user.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import {
  ADMIN_CALL_LABELS,
  OTHER_THEMES,
  STATUS,
  THEME_DATA
} from '@constants/variable.constants';
import { SmartCode } from '@models/smart-code.model';
import { Cookie } from 'src/app/utils/cookie';
import { KEY } from '@app/constants/key.constant';
import { IPageTemplate } from '@app/core/interfaces/page-template.interface';
import { IPageSite } from '@app/core/interfaces/page-site.interface';
import { convertURLToIdOnSMS } from '@app/utils/functions';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends HttpService {
  profile: BehaviorSubject<User> = new BehaviorSubject(new User());
  profile$: Observable<User> = this.profile.asObservable();

  accounts: BehaviorSubject<any> = new BehaviorSubject(null);
  accounts$: Observable<any> = this.accounts.asObservable();

  garbage: BehaviorSubject<Garbage> = new BehaviorSubject(new Garbage());
  garbage$: Observable<Garbage> = this.garbage.asObservable();

  invoice: BehaviorSubject<any> = new BehaviorSubject(null);
  invoice$ = this.invoice.asObservable();
  loadInvoiceSubscription: Subscription;

  payment: BehaviorSubject<any> = new BehaviorSubject(null);
  payment$ = this.payment.asObservable();
  loadPaymentSubscription: Subscription;

  sms: BehaviorSubject<Template> = new BehaviorSubject(new Template());
  email: BehaviorSubject<Template> = new BehaviorSubject(new Template());

  themes: BehaviorSubject<any[]> = new BehaviorSubject(OTHER_THEMES);
  themes$ = this.themes.asObservable();

  callLabels: BehaviorSubject<string[]> = new BehaviorSubject(
    ADMIN_CALL_LABELS
  );
  callLabels$ = this.callLabels.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  pages: BehaviorSubject<any[]> = new BehaviorSubject([]);
  pages$ = this.pages.asObservable();

  smartCodes: BehaviorSubject<SmartCode[]> = new BehaviorSubject([]);
  smartCodes$ = this.smartCodes.asObservable();

  smartCodesLoading: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  smartCodesLoading$ = this.smartCodesLoading.asObservable();

  emailAliasList: BehaviorSubject<any[]> = new BehaviorSubject([]);
  emailAliasList$ = this.emailAliasList.asObservable();

  tokenPageSize: BehaviorSubject<any> = new BehaviorSubject(null);
  tokenPageSize$ = this.tokenPageSize.asObservable();

  private sentSMS: BehaviorSubject<number> = new BehaviorSubject(Date.now());
  sentSMS$ = this.sentSMS.asObservable();

  private teamInfo: BehaviorSubject<any> = new BehaviorSubject(null);
  teamInfo$ = this.teamInfo.asObservable();

  constructor(
    private httpClient: HttpClient,
    errorService: ErrorService,
    private storeService: StoreService
  ) {
    super(errorService);

    const pageSize = localStorage.getCrmItem(KEY.TOKEN.PAGE_SIZE);
    if (pageSize) {
      this.tokenPageSize.next(parseInt(pageSize));
    }

    this.tokenPageSize$.subscribe((value) => {
      localStorage.setCrmItem(KEY.TOKEN.PAGE_SIZE, value + '');
    });
  }

  public register(): any {}
  public login(user: { email: string; password: string }): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SIGNIN, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SIGNIN REQUEST'))
      );
  }

  public socialSignIn(user): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SOCIAL_SIGNIN, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL SIGNIN REQUEST'))
      );
  }

  public socialSignUp(user): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SOCIAL_SIGNUP, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL SIGNUP REQUEST'))
      );
  }

  public signup(user: any): any {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SIGNUP, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SIGNUP REQUEST', null))
      );
  }

  public extensionUpgrade(user: any, token: string): any {
    const method = 'POST';
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', token);
    return fetch(this.server + AUTH.EXTENSIONUPGRADE, {
      method,
      headers: myHeaders,
      body: JSON.stringify(user)
    }).then(
      (res) => res.json(),
      catchError(this.handleError('EXTENSION UPGRADE', null))
    );
    // return this.httpClient
    //   .post(this.server + AUTH.EXTENSIONUPGRADE, JSON.stringify(user))
    //   .pipe(
    //     map((res) => res),
    //     catchError(this.handleError('EXTENSION UPGRADE', null))
    //   );
  }

  /**
   * LOG OUT -> CALL API
   */
  public logout(): Observable<boolean> {
    return this.httpClient.post(this.server + AUTH.LOG_OUT, {}).pipe(
      map((res) => res['status']),
      catchError(this.handleError('LOG OUT', false))
    );
  }
  /**
   * LOG OUT -> Clear Token And profile Informations
   */
  public logoutImpl(): void {
    localStorage.removeItem('token');
    const contactColumns = localStorage.getCrmItem('contact_columns');
    const taskColumns = localStorage.getCrmItem('task_columns');
    const activitiesColumns = localStorage.getCrmItem('activity_columns');
    localStorage.clear();
    this.profile.next(new User());
    this.garbage.next(new Garbage());
    localStorage.setCrmItem('contact_columns', contactColumns);
    localStorage.setCrmItem('task_columns', taskColumns);
    localStorage.setCrmItem('activity_columns', activitiesColumns);
  }
  public requestOAuthUrl(type: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.OAUTH_REQUEST + type, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL OAUTH REQUEST', false))
      );
  }

  public requestOutlookProfile(code: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.OUTLOOK_PROFILE_REQUEST + code, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST OUTLOOK PROFILE', false))
      );
  }

  public requestGoogleProfile(code: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.GOOGLE_PROFILE_REQUEST + code, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST GOOGLE PROFILE', false))
      );
  }
  public checkEmail(email): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.CHECK_EMAIL, JSON.stringify({ email }), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK EMAIL'))
      );
  }
  public checkPhone(cell_phone): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.CHECK_PHONE, JSON.stringify({ cell_phone }), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK PHONE'))
      );
  }

  public authorizeOutlook(code: string): Observable<any> {
    const source = environment.isSspa ? 'vortex' : 'crmgrow';
    return this.httpClient
      .get(
        this.server + USER.AUTH_OUTLOOK + '?code=' + code + '&source=' + source
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE OUTLOOK'))
      );
  }
  public authorizeGoogle(code: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    const query = `?source=${source}&code=${code}`;
    return this.httpClient.get(this.server + USER.AUTH_GOOGLE + query).pipe(
      map((res) => res),
      catchError(this.handleError('AUTHORIZE GOOGLE'))
    );
  }
  public authorizeOutlookCalendar(code: string): Observable<any> {
    const source = environment.isSspa ? 'vortex' : 'crmgrow';
    return this.httpClient
      .get(
        this.server +
          USER.AUTH_OUTLOOK_CALENDAR +
          '?code=' +
          code +
          '&source=' +
          source
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE OUTLOOK CALENDAR'))
      );
  }
  public authorizeGoogleCalendar(code: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    const query = `?source=${source}&code=${code}`;
    return this.httpClient
      .get(this.server + USER.AUTH_GOOGLE_CALENDAR + query)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE GOOGLE CALENDAR'))
      );
  }
  public requestResetPassword(email): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(
        this.server + AUTH.FORGOT_PASSWORD,
        { email: email },
        {
          headers: reqHeader
        }
      )
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REQUEST RESET PASSWORD', false))
      );
  }
  public resetPassword(requestData): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.RESET_PASSWORD, JSON.stringify(requestData), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('RESET PASSWORD', false))
      );
  }
  public isAuthenticated(): boolean {
    if (localStorage.getCrmItem('token') != null) {
      return true;
    } else {
      return false;
    }
  }

  public isAuthenticatedSupportTeam(): boolean {
    const token = Cookie.get('access_token');
    if (token != null) {
      localStorage.setCrmItem('token', token);
      return true;
    } else {
      return false;
    }
  }

  public saveAccessDate(): Observable<any> {
    return this.httpClient.get(this.server + USER.SAVE_ACCESS).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SAVE LAST LOGIN'))
    );
  }

  public loadProfile(): Observable<any> {
    return this.httpClient.get(this.server + USER.PROFILE).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET PROFILE'))
    );
  }
  public loadDefaults(): Observable<any> {
    return this.httpClient.get(this.server + GARBAGE.LOAD_DEFAULT).pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD DEFAULT TEMPLATES', null))
    );
  }
  public updateProfile(profile: any): Observable<any> {
    return this.httpClient.put(this.server + USER.UPDATE_PROFILE, profile).pipe(
      map((res) => res['data']),
      catchError(this.handleError('UPDATE PROFILE'))
    );
  }

  public addNickName(): Observable<any> {
    return this.httpClient.get(this.server + USER.ADD_NICK_NAME).pipe(
      map((res) => res),
      catchError(this.handleError('ADD NICKNAME'))
    );
  }
  public enableDesktopNotification(
    subscription: any,
    option: any
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.ENABLE_DESKTOP_NOTIFICATION, {
        subscription,
        option
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('ENABLE DESKTOP NOTIFICATION', false))
      );
  }
  public updateUser(field, value): void {
    const user = JSON.parse(localStorage.getCrmItem('user'));
    user[field] = value;
    localStorage.setCrmItem('user', JSON.stringify(user));
  }
  public updatePassword(
    oldPwd: string,
    newPwd: string
  ): Observable<{ status: boolean; data: { token: string } }> {
    const data = {
      old_password: oldPwd,
      new_password: newPwd
    };
    return this.httpClient
      .post(this.server + USER.UPDATE_PASSWORD, JSON.stringify(data))
      .pipe(
        map((res) => res),
        catchError(this.handleError('Password Change', null))
      );
  }
  public createPassword(password: string): Observable<boolean> {
    const data = {
      password: password
    };
    return this.httpClient
      .post(this.server + USER.CREATE_PASSWORD, JSON.stringify(data))
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('CREATE PASSWORD', false))
      );
  }
  /**
   * Load the User Payment Information
   * @param id : Payment Information Id
   */

  public loadPayment(id: string): void {
    this.loadPaymentSubscription && this.loadPaymentSubscription.unsubscribe();
    this.loadPaymentSubscription = this.loadPaymentImpl(id).subscribe((res) => {
      if (res) {
        this.payment.next(res);
      }
    });
  }

  public loadPaymentImpl(id: string): Observable<any> {
    return this.httpClient.get(this.server + USER.PAYMENT + id).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PAYMENT'))
    );
  }

  public cancelPayment(is_delete: boolean): any {
    return this.httpClient
      .post(this.server + USER.CANCEL_PAYMENT, { is_delete })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL PAYMENT', false))
      );
  }

  public getCards(): Observable<any> {
    return this.httpClient.get(this.server + USER.CARDS).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PAYMENT'))
    );
  }

  public addCard(token: any): Observable<any> {
    return this.httpClient.post(this.server + USER.ADD_CARD, { token }).pipe(
      map((res) => res),
      catchError(this.handleError('ADD CARD', false))
    );
  }

  public setPrimaryCard(card_id: any): Observable<any> {
    return this.httpClient
      .post(this.server + USER.SET_PRIMARY_CARD, { card_id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SET PRIMARY CARD', false))
      );
  }

  public getPrimaryCard(): Observable<any> {
    return this.httpClient.get(this.server + USER.GET_PRIMARY_CARD).pipe(
      map((res) => res),
      catchError(this.handleError('GET PRIMARY CARD'))
    );
  }

  public deleteCard(card_id: any): Observable<any> {
    return this.httpClient
      .post(this.server + USER.DELETE_CARD, { card_id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SET CARD', false))
      );
  }

  public updateCard(card: any): Observable<any> {
    const { card_id, exp_year, exp_month } = card;
    return this.httpClient
      .post(this.server + USER.UPDATE_CARD, { card_id, exp_year, exp_month })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE CARD', false))
      );
  }

  public updatePayment(payment: any): any {
    return this.httpClient
      .post(this.server + USER.UPDATE_PAYMENT, payment)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE PAYMENT', false))
      );
  }

  public proceedInvoice(): any {
    return this.httpClient.post(this.server + USER.PROCEED_INVOICE, {}).pipe(
      map((res) => res),
      catchError(this.handleError('PROCEED INVOICE', false))
    );
  }

  public resumeAccount(): any {
    return this.httpClient.post(this.server + USER.RESUME_ACCOUNT, {}).pipe(
      map((res) => res),
      catchError(this.handleError('RESUME ACCOUNT', false))
    );
  }

  public renewAccount(): any {
    return this.httpClient.post(this.server + USER.RENEW_ACCOUNT, {}).pipe(
      map((res) => res),
      catchError(this.handleError('RENEW ACCOUNT', false))
    );
  }
  public loadInvoice(data: {
    starting_after?: string;
    ending_before?: string;
  }): void {
    console.log('load invoice');
    this.loadInvoiceSubscription && this.loadInvoiceSubscription.unsubscribe();
    this.loadInvoiceSubscription = this.loadInvoiceImpl(data).subscribe(
      (res) => {
        if (res) {
          this.invoice.next(res);
        }
      }
    );
  }

  public loadInvoiceImpl(data: {
    starting_after?: string;
    ending_before?: string;
  }): any {
    return this.httpClient.post(this.server + USER.GET_INVOICE, data).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD INVOICE', null))
    );
  }

  public setToken(token: string): void {
    localStorage.setCrmItem('token', token);
  }
  public getToken(): any {
    return localStorage.getCrmItem('token');
  }
  public updateLocalStorageItem(item: string, value: string): void {
    localStorage.setCrmItem(item, value);
  }
  public clearLocalStorageItem(item: string): void {
    localStorage.removeCrmItem(item);
  }

  /**
   * Init the User data from API call
   * @param profile: User
   */
  public setProfile(profile: User): void {
    this.profile.next(profile);
    if (profile && profile._id) {
      const company = profile.company;
      this.themes.next(THEME_DATA[company] || OTHER_THEMES);
      this.storeService.profileInfo.next({
        source: profile.source,
        dialer_info: profile.dialer_info,
        dialer_token: profile.dialer_token,
        twilio_number: profile.twilio_number,
        wavv_number: profile.wavv_number
      });
    }
  }
  /**
   * Update the profile and submit the subject
   * @param data: Update Profile Imple
   */
  public updateProfileImpl(data: any): void {
    const profile = this.profile.getValue();
    this.profile.next({ ...profile, ...data });
    if (profile && profile._id) {
      const updated = { ...profile, ...data };
      const company = updated.company;
      this.themes.next(THEME_DATA[company] || OTHER_THEMES);
    }
    return;
  }
  /**
   * Init the Garbage from API call
   * @param garbage: Garbage
   */
  public setGarbage(garbage: Garbage): void {
    this.garbage.next(garbage);
    return;
  }
  public updateGarbage(garbage: any): Observable<boolean> {
    return this.httpClient.put(this.server + USER.UPDATE_GARBAGE, garbage).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE GARBAGE', false))
    );
  }
  public bulkRemoveToken(updateData: any): Observable<any> {
    return this.httpClient
      .post(this.server + USER.BULK_REMOVE_TOKEN, updateData)
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK REMOVE TOKEN', null))
      );
  }
  /**
   * Update the Garbage
   * @param garbage : Garbage
   */
  public updateGarbageImpl(data: any): void {
    const garbage = this.garbage.getValue();
    this.garbage.next({ ...garbage, ...data });
    return;
  }
  public requestSyncUrl(type: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    switch (type) {
      case 'gmail':
        return this.httpClient.get(this.server + USER.SYNC_GMAIL).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST GOOGLE EMAIL SYNC', null))
        );
      case 'outlook':
        return this.httpClient.get(this.server + USER.SYNC_OUTLOOK).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST OUTLOOK EMAIL SYNC', null))
        );
    }
  }
  public connectAnotherService(): Observable<any> {
    return this.httpClient.get(this.server + USER.SET_ANOTHER_MAIL).pipe(
      map((res) => res),
      catchError(this.handleError('CONNECT OTHER SERVICE', null))
    );
  }
  public requestCalendarSyncUrl(type: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    switch (type) {
      case 'gmail':
        return this.httpClient.get(this.server + USER.CALENDAR_SYNC_GMAIL).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST GOOGLE CALENDAR SYNC'))
        );
      case 'outlook':
        return this.httpClient
          .get(this.server + USER.CALENDAR_SYNC_OUTLOOK)
          .pipe(
            map((res) => res),
            catchError(this.handleError('REQUEST OUTLOOK CALENDAR SYNC'))
          );
    }
  }
  public disconnectMail(data): any {
    return this.httpClient.post(this.server + USER.DISCONNECT_MAIL, data).pipe(
      map((res) => res),
      catchError(this.handleError('DISCONNECT EMAIL', null))
    );
  }
  public disconnectCalendar(data): any {
    return this.httpClient
      .post(this.server + USER.DISCONNECT_CALENDAR, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DISCONNECT CALENDAR', null))
      );
  }
  public requestZoomSyncUrl(): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    return this.httpClient.get(this.server + USER.SYNC_ZOOM + source);
  }
  public authorizeZoom(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_ZOOM + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE ZOOM'))
      );
  }
  public loadAffiliate(): Observable<any> {
    return this.httpClient.get(this.server + USER.LOAD_AFFILIATE).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER AFFILIATE'))
    );
  }
  public createAffiliate(): Observable<any> {
    return this.httpClient.post(this.server + USER.CREATE_AFFILIATE, {}).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE AFFILIATE'))
    );
  }
  public loadReferrals(page): Observable<any> {
    return this.httpClient.get(this.server + USER.LOAD_REFERRALS).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER REFERRALS'))
    );
  }
  public updateAffiliate(data): Observable<any> {
    return this.httpClient.put(this.server + USER.CREATE_AFFILIATE, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('UPDATE PROFILE'))
    );
  }
  public connectSMTP(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CONNECT_SMTP, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CONNECT SMTP'))
      );
  }

  public verifySMTP(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.VERIFY_SMTP, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('VERIFY SMTP'))
      );
  }

  public verifySMTPCode(code): Observable<any> {
    return this.httpClient
      .post(this.server + USER.VERIFY_SMTP_CODE, { code })
      .pipe(
        map((res) => res),
        catchError(this.handleError('VERIFY SMTP CODE'))
      );
  }

  public cancelAccount(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CANCEL_ACCOUNT, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL ACCOUNT'))
      );
  }

  public sleepAccount(): Observable<any> {
    return this.httpClient.get(this.server + USER.SLEEP_ACCOUNT).pipe(
      map((res) => res),
      catchError(this.handleError('SLEEP ACCOUNT'))
    );
  }

  /**
   * Create the email alias
   * @param email: email address
   * @param name: sender name
   * @returns
   */
  public createEmailAlias(email: string, name: string): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.CREATE_ALIAS, { email, name })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('Create Email Alias'))
      );
  }

  /**
   * Send the verification code with current alias
   * @param email: email address
   * @returns
   */
  public requestAliasVerification(email: string): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.REQUEST_ALIAS_VERIFY, { email })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('LOAD EMAIL ALIAS'))
      );
  }

  /**
   * Verify the verification code
   * @param email: Alias email address
   * @param code: Alias code
   * @returns
   */
  public verifyAlias(email: string, code: string): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.VERIFY_ALIAS, { email, code })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('LOAD EMAIL ALIAS'))
      );
  }

  /**
   * Update the sender name or Set as Primary
   * @param email: Email
   * @param name: Name
   * @param primary: Primary Status
   * @returns: Observable
   */
  public editEmailAlias(
    email: string,
    name: string,
    primary: boolean
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.EDIT_ALIAS, { email, name, primary })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('LOAD EMAIL ALIAS'))
      );
  }

  public updatePackage(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.UPDATE_PACKAGE, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE PACKAGE'))
      );
  }

  public checkDowngrade(selectedPackage): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CHECK_DOWNGRADE, { selectedPackage })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK DOWNGRADE PACKAGE'))
      );
  }

  public getUserInfo(id): Observable<any> {
    return this.httpClient.get(this.server + USER.INFO + id).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER INFO'))
    );
  }

  public getUserInfoItem(type: string): any {
    const user = this.getUser();
    return user[type];
  }
  public getUser(): any {
    const user = localStorage.getCrmItem('user');
    if (user) {
      return JSON.parse(localStorage.getCrmItem('user'));
    } else {
      return {};
    }
  }
  public setUser(user: User): any {
    localStorage.setCrmItem('user', JSON.stringify(user));
  }

  public easyLoadSubAccounts(): any {
    return this.httpClient.get(this.server + USER.LOAD_SUB_ACCOUNTS).pipe(
      map((res) => res),
      catchError(this.handleError('GET ACCOUNTS', null))
    );
  }
  public getSubAccount(): any {
    return this.httpClient.get(this.server + USER.GET_SUB_ACCOUNT).pipe(
      map((res) => res),
      catchError(this.handleError('GET SUB ACCOUNT', null))
    );
  }
  // public buySubAccount(data): any {
  //   return this.httpClient.post(this.server + USER.BUY_SUB_ACCOUNT, data).pipe(
  //     map((res) => res),
  //     catchError(this.handleError('BUY SUB ACCOUNT'))
  //   );
  // }
  public newSubAccount(data): any {
    return this.httpClient.post(this.server + USER.NEW_SUB_ACCOUNT, data).pipe(
      map((res) => res),
      catchError(this.handleError('BUY SUB ACCOUNT'))
    );
  }
  public recallSubAccount(data): any {
    return this.httpClient
      .post(this.server + USER.RECALL_SUB_ACCOUNT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('RECALL SUB ACCOUNT'))
      );
  }
  public createSubAccount(data: any): any {
    return this.httpClient.post(this.server + USER.SUB_ACCOUNT, data).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE SUB ACCOUNT'))
    );
  }
  public removeSubAccount(id: string, data): any {
    return this.httpClient
      .delete(this.server + USER.SUB_ACCOUNT + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE SUB ACCOUNT'))
      );
  }
  public updateSubAccount(id: string, data: any): any {
    return this.httpClient.put(this.server + USER.SUB_ACCOUNT + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE SUB ACCOUNT'))
    );
  }
  public changeAccount(id: string): any {
    const authToken = localStorage.getCrmItem('token');
    const accountRef = localStorage.getCrmItem('primary_loggin');
    const contactColumns = localStorage.getCrmItem('contact_columns');
    const taskColumns = localStorage.getCrmItem('task_columns');
    const activitiesColumns = localStorage.getCrmItem('activity_columns');
    localStorage.clear();
    localStorage.setCrmItem('token', authToken);
    localStorage.setCrmItem('primary_loggin', accountRef);
    localStorage.setCrmItem('contact_columns', contactColumns);
    localStorage.setCrmItem('task_columns', taskColumns);
    localStorage.setCrmItem('activity_columns', activitiesColumns);
    return this.httpClient
      .post(this.server + USER.CHANGE_SUB_ACCOUNT, { user_id: id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHANGE SUB ACCOUNT'))
      );
  }

  public updateEmailDraft(data): any {
    return this.httpClient
      .put(this.server + USER.UPDATE_DRAFT, { email_draft: data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE EMAIL DRAFT'))
      );
  }
  public updateTextDraft(data): any {
    return this.httpClient
      .put(this.server + USER.UPDATE_DRAFT, {
        text_draft: { ...data, content: convertURLToIdOnSMS(data.content) }
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE TEXT DRAFT'))
      );
  }

  public scheduleDemo(): any {
    return this.httpClient.get(this.server + USER.SCHEDULE).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('SCHEDULE', false))
    );
  }

  public scheduled(): any {
    return this.httpClient.get(this.server + USER.SCHEDULED_ONE).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('SCHEDULE', false))
    );
  }

  public getUserStatistics(): any {
    return this.httpClient.get(this.server + USER.STATISTICS).pipe(
      map((res) => res),
      catchError(this.handleError('STATISTICS', false))
    );
  }

  public loadTemplates(): Observable<IPageTemplate[]> {
    return this.httpClient.get(this.server + PAGE_BUILDER.LOAD_TEMPLATES).pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD TEMPLATES', []))
    );
  }

  public loadSites(token: string): Observable<IPageSite[]> {
    return this.httpClient
      .post(this.server + PAGE_BUILDER.LOAD_SITES, { token })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('LOAD SITES', []))
      );
  }

  public createSite(data: any): Observable<IPageSite> {
    return this.httpClient
      .post(this.server + PAGE_BUILDER.CREATE_SITE, { data })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE SITE', null))
      );
  }

  public removeSite(site: string, token: string): Observable<any> {
    return this.httpClient
      .post(this.server + PAGE_BUILDER.DELETE_SITE + site, { token })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE SITE', null))
      );
  }

  public loadPages(token: string, force = false): any {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadPagesImpl(token).then((pages) => {
      pages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.pages.next(pages || []);
    });
  }

  public loadPagesImpl(token: string): any {
    const method = 'GET';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(
      environment.pageBuilder + '/api/v1/sites?limit=false&offset=0',
      {
        method,
        headers: myHeaders
      }
    ).then((res) => res.json(), catchError(this.handleError('PAGES', null)));
  }

  public loadTeamInfo(): void {
    this.httpClient.get(this.server + USER.LOAD_TEAM_INFO)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET LOAD TEAM INFO'))
      )
      .subscribe((res) => {
        this.teamInfo.next(res);
      });
  }

  public deleteSite(token: string, site_id: string): any {
    const method = 'DELETE';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(environment.pageBuilder + '/api/v1/sites/' + site_id, {
      method,
      headers: myHeaders
    }).then((res) => res.json());
  }

  public publishSite(token: string, site_id: string): any {
    const method = 'POST';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(
      environment.pageBuilder + '/api/v1/sites/' + site_id + '/publish',
      {
        method,
        headers: myHeaders
      }
    ).then((res) => res.json());
  }
  public syncSMTP(data): Observable<any> {
    return this.httpClient.post(this.server + USER.SYNC_SMTP, { ...data }).pipe(
      map((res) => res),
      catchError(this.handleError('SYNC SMTP'))
    );
  }

  public authorizeSMTP(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.AUTHORIZE_SMTP, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE SMTP'))
      );
  }

  public authorizeSMTPCode(code): Observable<any> {
    return this.httpClient
      .post(this.server + USER.AUTHORIZE_SMTP_CODE, { code })
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE SMTP CODE'))
      );
  }

  public getTeamSettings(): Observable<any> {
    return this.httpClient.get(this.server + GARBAGE.PERMISSION_SETTINGS).pipe(
      map((res) => res['data']),
      catchError(this.handleError('UPDATE TEAM SETTINGS'))
    );
  }

  public updateTeamSettings(team_settings): any {
    return this.httpClient
      .post(this.server + GARBAGE.PERMISSION_SETTINGS, { team_settings })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('REQUEST OUTLOOK CALENDAR SYNC'))
      );
  }
  public loadSmartCodes(): any {
    this.smartCodesLoading.next(STATUS.REQUEST);
    this.httpClient
      .get(this.server + GARBAGE.SMART_CODES)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('REQUEST OUTLOOK CALENDAR SYNC'))
      )
      .subscribe((data) => {
        data
          ? this.smartCodesLoading.next(STATUS.SUCCESS)
          : this.smartCodesLoading.next(STATUS.FAILURE);
        this.smartCodes.next(data);
      });
  }

  syncGoogleContact(): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    return this.httpClient.get(this.server + USER.SYNC_GOOGLE_CONTACT).pipe(
      map((res) => res['data'] || ''),
      catchError(this.handleError('SYNC GOOGLE CONTACT'))
    );
  }

  authorizeGoogleContact(code: string): Observable<any> {
    let source = 'crmgrow';
    if (environment.isSspa) {
      source = 'vortex';
    }
    const query = `?source=${source}&code=${code}`;
    return this.httpClient
      .get(this.server + USER.AUTH_GOOGLE_CONTACT + query)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING CONTACTS FROM GOOGLE ACCOUNT'))
      );
  }

  public onAddedPaymentToSubAccount(): any {
    return this.httpClient
      .post(this.server + USER.ADD_PAYMENT_SUB_ACCOUNT, {})
      .pipe(
        map((res) => res),
        catchError(this.handleError('ADD_PAYMENT_SUB_ACCOUNT', false))
      );
  }

  public onUpdateMyLink(myLink): any {
    return this.httpClient
      .post(this.server + USER.UPDATE_MY_LINK, { myLink })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE_MY_LINK_ERROR', false))
      );
  }

  public isTextEnabled(): boolean {
    return (
      this.garbage.getValue()?.twilio_brand_info?.identityStatus === 'VERIFIED'
    );
  }

  public reports(duration): any {
    return this.httpClient.post(this.server + USER.REPORT, { duration }).pipe(
      map((res) => res['data'] || ''),
      catchError(this.handleError('GET_REPORT', false))
    );
  }

  public verifyConnectionStatus(): Observable<any> {
    return this.httpClient
      .post(this.server + USER.VERIFY_CONNECTION_STATUS, {})
      .pipe(
        map((res) => res),
        catchError(this.handleError('VERIFY CONNECTION STATUS', null))
      );
  }

  onSentSms(): void {
    this.sentSMS.next(Date.now());
  }

  isOrganization(): boolean {
    const self = this.profile.getValue();
    if (!self.organization_info?.is_owner) return true; // if this is sub-account, it should be true
    const accounts = this.accounts.getValue();
    if (accounts?.accounts?.length > 1) return true; // if length is greater than 2, it should be true, because of self and another one.
    return false;
  }
}
