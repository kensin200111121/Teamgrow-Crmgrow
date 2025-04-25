import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MESSAGE_SORT_TYPES, STATUS } from '@constants/variable.constants';
import { SMS, TASK } from '@constants/api.constant';
import { Contact } from '@models/contact.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { Conversation } from '@models/conversation.model';
import {
  BrandCampaign,
  StandardBrand,
  StandardBrandRes,
  StarterBrand,
  StarterBrandRes,
  StarterBrandStatus
} from '@utils/data.types';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';
@Injectable({
  providedIn: 'root'
})
export class SmsService extends HttpService {
  messages: BehaviorSubject<Conversation[]> = new BehaviorSubject([]);
  messages$ = this.messages.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  conversations: BehaviorSubject<any[]> = new BehaviorSubject([]);
  conversations$ = this.conversations.asObservable();
  updating: BehaviorSubject<boolean> = new BehaviorSubject(false);
  updating$ = this.updating.asObservable();
  loadSmsSubscription: Subscription;
  contactCount: number;
  sort: BehaviorSubject<any> = new BehaviorSubject(MESSAGE_SORT_TYPES[0]);
  sort$ = this.sort.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
    const sort = localStorage.getCrmItem(KEY.SMS.SORT_BY);
    console.log('sort key value get', sort);
    if (sort) {
      const parsedSort = JSONParser(sort);
      if (parsedSort) {
        this.sort.next(parsedSort);
      }
    }
    this.sort$.subscribe((value) => {
      console.log('sort key value set', value);
      localStorage.setCrmItem(KEY.SMS.SORT_BY, JSON.stringify(value));
    });
  }

  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.updating.next(true);
    this.loadAllImpl().subscribe((messages) => {
      this.updating.next(false);
      messages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.messages.next(messages || []);
    });
  }

  updateConversations(data: any): void {
    this.updating.next(true);

    this.loadImplCount(data).subscribe((messages) => {
      this.updating.next(false);
      this.messages.next(messages || []);
    });
  }

  getSmsWithSearchStr(data: any): void {
    this.updating.next(true);

    this.loadSmsSubscription && this.loadSmsSubscription.unsubscribe();
    this.loadSmsSubscription = this.loadImplCount(data).subscribe(
      (messages) => {
        this.updating.next(false);
        this.messages.next(messages || []);
      }
    );
  }

  loadAllImpl(): Observable<Conversation[]> {
    return this.httpClient.get(this.server + SMS.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Conversation().deserialize(e))
      ),
      catchError(this.handleError('SMS GET ALL', null))
    );
  }

  loadImplCount(data: any): Observable<Conversation[]> {
    return this.httpClient
      .post(this.server + SMS.GET_MESSAGE_OF_COUNT, data)
      .pipe(
        map((res) => {
          this.contactCount = res['count'];
          return (res['data'] || []).map((e) =>
            new Conversation().deserialize(e)
          );
        }),
        catchError(this.handleError('SMS GET ALL', null))
      );
  }

  loadCount(force = false, data: any): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.updating.next(true);
    this.loadImplCount(data).subscribe((messages) => {
      this.updating.next(false);
      messages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.messages.next(messages || []);
    });
  }

  getMessage(contact: Contact | Conversation): any {
    return this.httpClient
      .post(this.server + SMS.GET_MESSAGE, { contact: contact._id })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('SMS GET MESSAGE', null))
      );
  }

  markRead(id: string, contact: string): any {
    return this.httpClient
      .put(this.server + SMS.MARK_READ + '/' + id, { contact })
      .pipe(
        map((res) => res),
        catchError(this.handleError('MARK AS READ', null))
      );
  }

  searchNumbers(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.SEARCH_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEARCH NUMBER', null))
    );
  }

  buyNumbers(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.BUY_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('BUY NUMBER', null))
    );
  }

  buyCredit(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.BUY_CREDIT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SMS CREDITS', null))
    );
  }

  loadFiles(contact_id: string, activities: any[]): Observable<any> {
    return this.httpClient
      .post(this.server + SMS.LOAD_FILES, { contact: contact_id, activities })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('LOAD FILE ACTIVITY', null))
      );
  }

  moveCurrentNumber(): Observable<boolean> {
    return this.httpClient.get(this.server + SMS.MOVE_NUMBER).pipe(
      map((res) => res['status']),
      catchError(this.handleError('MOVE NUMBER', null))
    );
  }

  createSubAccount(): Observable<boolean> {
    return this.httpClient.get(this.server + SMS.CREATE_SUB_ACCOUNT).pipe(
      map((res) => res['status']),
      catchError(this.handleError('CREATE SUB ACCOUNT', null))
    );
  }

  createStarterBrand(data: StarterBrand): Observable<StarterBrandRes> {
    return this.httpClient
      .post(this.server + SMS.CREATE_STARTER_BRAND, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE TWILIO BRAND', null))
      );
  }

  updateStarterBrand(data: StarterBrand): Observable<StarterBrandRes> {
    return this.httpClient
      .put(this.server + SMS.CREATE_STARTER_BRAND, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('UPDATE TWILIO BRAND', null))
      );
  }

  getStarterBrandStatus(): Observable<StarterBrandStatus> {
    return this.httpClient.get(this.server + SMS.GET_STARTER_BRAND_STATUS).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE TWILIO BRAND', null))
    );
  }

  sendStarterBrandOtp(): Observable<boolean> {
    return this.httpClient.get(this.server + SMS.SEND_STARTER_BRAND_OTP).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE TWILIO BRAND', null))
    );
  }

  createStarterBrandMessaging(): Observable<any> {
    return this.httpClient
      .get(this.server + SMS.CREATE_STARTER_BRAND_MESSAGING)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE TWILIO BRAND', null))
      );
  }

  attachPhoneNumber2Service(): Observable<boolean> {
    return this.httpClient.get(this.server + SMS.ATTACH_NUMBER).pipe(
      map((res) => res['status']),
      catchError(this.handleError('ATTACH TWILIO NUMBER', false))
    );
  }

  createStandardBrand(data: StandardBrand): Observable<StandardBrandRes> {
    return this.httpClient
      .post(this.server + SMS.CREATE_STANDARD_BRAND, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE TWILIO BRAND', null))
      );
  }

  createBrandCampaign(data: BrandCampaign): Observable<boolean> {
    return this.httpClient
      .post(this.server + SMS.CREATE_BRAND_CAMPAIGN, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE BRAND CAMPAIGN', null))
      );
  }

  getTwilioBrandStatus(): Observable<any> {
    return this.httpClient.get(this.server + SMS.GET_TWILIO_STATUS).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET BRAND STATUS', null))
    );
  }

  clear$(): void {
    this.messages.next([]);
    this.loadStatus.next(STATUS.NONE);
    this.conversations.next([]);
    this.updating.next(false);
  }
}
