import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  Subscription
} from 'rxjs';
import { HttpService } from '../http.service';
import { ErrorService } from '../error.service';
import { ContactActivity, Contact } from '@app/models/contact.model';
import { HttpClient } from '@angular/common/http';
import { SearchOption } from '@models/searchOption.model';
import { CONTACT_SORT_OPTIONS, STATUS } from '@constants/variable.constants';
import * as _ from 'lodash';
export abstract class ContactListBaseService extends HttpService {
  pageSize: BehaviorSubject<number> = new BehaviorSubject(25);
  pageSize$ = this.pageSize.asObservable();
  pageIndex: BehaviorSubject<number> = new BehaviorSubject(1);
  contacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject([]);
  contacts$ = this.contacts.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  sort: BehaviorSubject<any> = new BehaviorSubject(
    CONTACT_SORT_OPTIONS['alpha_down']
  );
  loadSubscription: Subscription;
  protected abstract endpoint: string;
  protected abstract KEY_PAGE: string;
  protected abstract KEY_PAGE_SIZE: string;
  protected ACCEPT_SHARING = 'contact/accept-sharing';
  protected DECLINE_SHARING = 'contact/decline-sharing';

  sort$ = this.sort.asObservable();
  searchOption: BehaviorSubject<SearchOption> = new BehaviorSubject(
    new SearchOption()
  );
  searchOption$ = this.searchOption.asObservable();
  contactPage: BehaviorSubject<any> = new BehaviorSubject(null);
  contactPage$ = this.contactPage.asObservable();

  get CONTACT_KEY_PAGE(): string {
    return this.KEY_PAGE;
  }

  get CONTACT_KEY_PAGE_SIZE(): string {
    return this.KEY_PAGE_SIZE;
  }

  constructor(errorService: ErrorService, protected httpClient: HttpClient) {
    super(errorService);
    this.searchOption$.subscribe(() => {
      this.loadPage();
    });
    this.sort$.subscribe(() => {
      const searchOption = this.searchOption.getValue();
      if (searchOption.isEmpty()) {
        const sortData = this.sort.getValue();
        if (sortData.page) {
          const pageSize = this.pageSize.getValue();
          this.load(pageSize * (sortData.page - 1));
        } else {
          this.load(0);
        }
      } else {
        const sortData = this.sort.getValue();
        this.advancedSearch(sortData.page || 1);
      }
    });
  }
  loadPage(): void {
    const searchOption = this.searchOption.getValue();
    if (searchOption.isEmpty()) {
      this.load(0);
    } else {
      this.advancedSearch();
    }
  }
  load(page: number): void {
    if (this.endpoint) {
      this.loadStatus.next(STATUS.REQUEST);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.loadImpl(page).subscribe((res) => {
        res
          ? this.loadStatus.next(STATUS.SUCCESS)
          : this.loadStatus.next(STATUS.FAILURE);
        if (res && res['contacts']) {
          this.contacts.next(res['contacts']);
          this.total.next(res['total']);
        }
      });
    }
  }

  /**
   * Call API & Load Contacts
   * @param page
   */
  loadImpl(page: number): Observable<any> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + this.endpoint + page, {
        count,
        ...sort,
        name: undefined
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data']['contacts'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['data']['count'] || 0
          };
        }),
        catchError(
          this.handleError('LOAD CONTACTS', { contacts: [], total: 0 })
        )
      );
  }

  /**
   * Advanced Search Call
   * @param str : keyword in the advanced search
   */
  advancedSearch(page = 1): void {
    const searchOption = this.searchOption.getValue();
    const endpoint = this.endpoint;
    if (
      ((endpoint == 'contact/move-pending/' ||
        endpoint == 'contact/share-pending/') &&
        searchOption.searchStr) ||
      endpoint == 'contact/shared/'
    ) {
      this.loadStatus.next(STATUS.REQUEST);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.advancedSearchImpl(page).subscribe((res) => {
        res
          ? this.loadStatus.next(STATUS.SUCCESS)
          : this.loadStatus.next(STATUS.FAILURE);
        if (res && res['contacts']) {
          const uniqContacts = _.uniqBy(res['contacts'], (e) => e._id);
          this.contacts.next(uniqContacts || []);
          this.total.next(res['total']);
        }
      });
    }
  }
  advancedSearchImpl(page = 1): Observable<ContactActivity[]> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    let skip = count * (page - 1);
    if (skip < 0) {
      skip = 0;
    }
    const searchOption = this.searchOption.getValue();
    return this.httpClient
      .post(this.server + this.endpoint + 'advance-search', {
        ...searchOption,
        ...sort,
        count,
        skip
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['total'] || 0
          };
        }),
        catchError(this.handleError('ADVANCED FILTER', null))
      );
  }

  acceptSharing(data: any): Observable<any> {
    return this.httpClient.post(this.server + this.ACCEPT_SHARING, data).pipe(
      map(
        (res) => res,
        catchError(
          this.handleError('ACCEPT SHARING CONTACTS', {
            contacts: [],
            total: 0
          })
        )
      )
    );
  }

  declineSharing(contacts): Observable<any> {
    return this.httpClient
      .post(this.server + this.DECLINE_SHARING, { contacts })
      .pipe(
        map(
          (res) => res,
          catchError(
            this.handleError('ACCEPT SHARING CONTACTS', {
              contacts: [],
              total: 0
            })
          )
        )
      );
  }

  moveAcceptRequest(data: any): Observable<any> {
    return this.httpClient.post(this.server + 'contact/move-accept', data).pipe(
      map((res) => res),
      catchError(this.handleError('MOVE CONTACTS', null))
    );
  }

  moveDeclineRequest(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + 'contact/move-decline', data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MOVE CONTACTS', null))
      );
  }

  /**
   * Select All Contacts
   */
  selectAll(): Observable<any> {
    return this.httpClient.get(this.server + this.endpoint + 'get-all').pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Contact().deserialize(e))
      ),
      catchError(this.handleError('SELECT ALL CONTACTS', []))
    );
  }

  /**
   * Select Advanced Searched Contacts
   * @param searchOption: Current Search Option
   */
  advancedSelectAll(searchOption: SearchOption): Observable<any> {
    return this.httpClient
      .post(this.server + this.endpoint + 'advance-search/select', {
        ...searchOption
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SELECT FILTERED CONTACTS', []))
      );
  }
}
