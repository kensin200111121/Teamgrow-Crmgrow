import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { StoreService } from '@services/store.service';
import {
  AUTOMATION,
  MAILLIST,
  TEAM,
  TEMPLATE
} from '@constants/api.constant';
import { MailList } from '@models/maillist.model';
import { STATUS } from '@constants/variable.constants';
import { Automation } from '@models/automation.model';
import { Contact, ContactActivity } from '@models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class MailListService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  mailLists: BehaviorSubject<MailList[]> = new BehaviorSubject([]);
  mailLists$ = this.mailLists.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  listContacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject([]);
  listContacts$ = this.listContacts.asObservable();
  listContactsLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadListContactsSubscription: Subscription;
  listContactsTotal: BehaviorSubject<number> = new BehaviorSubject(0);
  listContactsTotal$ = this.listContactsTotal.asObservable();

  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAllImpl().subscribe((mailLists) => {
      mailLists
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.mailLists.next(mailLists || []);
    });
  }

  loadAllImpl(): Observable<MailList[]> {
    return this.httpClient.get(this.server + MAILLIST.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new MailList().deserialize(e))
      ),
      catchError(this.handleError('LOAD ALL MAILLIST', []))
    );
  }

  get(id): Observable<MailList[]> {
    return this.httpClient.get(this.server + MAILLIST.GET + id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET MAILLIST', []))
    );
  }

  createList(title): Observable<MailList> {
    return this.httpClient.post(this.server + MAILLIST.CREATE, { title }).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('CREATE MAILLIST', []))
    );
  }

  updateList(id: string, list): Observable<any> {
    return this.httpClient.put(this.server + MAILLIST.UPDATE + id, list).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE MAIL LIST', false))
    );
  }

  removeList(id: string): Observable<Automation[]> {
    return this.httpClient.delete(this.server + MAILLIST.DELETE + id).pipe(
      map((res) => res['status']),
      catchError(this.handleError('DELETE MAIL LIST', false))
    );
  }

  addContacts(mail_list, contacts): Observable<any[]> {
    return this.httpClient
      .post(this.server + MAILLIST.ADD_CONTACTS, { mail_list, contacts })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('ADD CONTACTS', []))
      );
  }
  removeContacts(mail_list, contacts): Observable<any> {
    return this.httpClient
      .post(this.server + MAILLIST.REMOVE_CONTACTS, { mail_list, contacts })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE CONTACTS', []))
      );
  }
  bulkRemove(ids): Observable<any> {
    return this.httpClient
      .post(this.server + MAILLIST.BULK_REMOVE, { ids })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('BULK REMOVE MAILLIST', []))
      );
  }
  loadContacts(data): void {
    this.listContactsLoadStatus.next(STATUS.REQUEST);
    this.loadListContactsSubscription &&
      this.loadListContactsSubscription.unsubscribe();
    this.loadListContactsSubscription = this.loadContactsImpl(data).subscribe(
      (res) => {
        res
          ? this.listContactsLoadStatus.next(STATUS.SUCCESS)
          : this.listContactsLoadStatus.next(STATUS.FAILURE);
        if (res && res.contacts) {
          const pageContacts = [];
          for (const contact of res.contacts) {
            pageContacts.push(new ContactActivity().deserialize(contact));
          }
          this.listContacts.next(pageContacts);
        }
        if (res && res.count) {
          this.listContactsTotal.next(res.count);
        }
      }
    );
  }
  loadContactsImpl(data): Observable<any> {
    return this.httpClient
      .post(this.server + MAILLIST.LOAD_CONTACTS, data)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET MAIL LIST CONTACTS', []))
      );
  }
  selectAllContacts(id): Observable<any> {
    return this.httpClient
      .post(this.server + MAILLIST.SELECT_ALL_CONTACTS, { mail_list: id })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('GET ALL SELECT CONTACT', []))
      );
  }
}
