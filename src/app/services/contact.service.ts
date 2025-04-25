import { SspaService } from './sspa.service';
import { Injectable } from '@angular/core';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '@services/store.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ANALYTICS, CONTACT, TEAM } from '@constants/api.constant';
import {
  Contact,
  Contact2I,
  ContactActivity,
  ContactDetail
} from '@models/contact.model';
import { ActivityDetail } from '@models/activityDetail.model';
import { map, catchError } from 'rxjs/operators';
import {
  CONTACT_SORT_OPTIONS,
  DEFAULT_LIST_TYPE_IDS,
  STATUS
} from '@constants/variable.constants';
import { SearchOption } from '@models/searchOption.model';
import * as _ from 'lodash';
import { Note } from '@models/note.model';
import { Timeline } from '@models/timeline.model';
import { Country, State, City } from 'country-state-city';
import { Garbage } from '@models/garbage.model';
import {
  ActivityAnalyticsData,
  ActivityAnalyticsReq,
  DateRange,
  FieldAnalyticsData
} from '@utils/data.types';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';
import { HandlerService } from '@services/handler.service';
interface LoadResponse {
  contacts: ContactActivity[];
}
@Injectable({
  providedIn: 'root'
})
export class ContactService extends HttpService {
  forceReload: BehaviorSubject<boolean> = new BehaviorSubject(false);
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  customLoadingStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  customLoadingStatus$ = this.customLoadingStatus.asObservable();
  readDetailStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  readingDetail$ = this.readDetailStatus.asObservable();
  latestUpdateStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  latestUpdating$ = this.latestUpdateStatus.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  listTypeOption: BehaviorSubject<
    'own' | 'team' | 'private' | 'prospect' | 'assigned' | 'pending' | string
  > = new BehaviorSubject('own');

  searchOption: BehaviorSubject<SearchOption> = new BehaviorSubject(
    new SearchOption()
  );

  searchOption$ = this.searchOption.asObservable();
  listTypeOption$ = this.listTypeOption.asObservable();
  // searchStr: BehaviorSubject<string> = new BehaviorSubject('');
  // searchStr$ = this.searchStr.asObservable();
  pageIndex: BehaviorSubject<number> = new BehaviorSubject(1);
  pageIndex$ = this.pageIndex.asObservable();
  pageSize: BehaviorSubject<number> = new BehaviorSubject(50);
  pageSize$ = this.pageSize.asObservable();
  sort: BehaviorSubject<any> = new BehaviorSubject(
    CONTACT_SORT_OPTIONS['alpha_down']
  );
  garbage: BehaviorSubject<any> = new BehaviorSubject({});
  garbage$ = this.garbage.asObservable();
  sort$ = this.sort.asObservable();

  contactConversation: BehaviorSubject<any> = new BehaviorSubject(null);
  contactConversation$ = this.contactConversation.asObservable();
  loadSubscription: Subscription;
  COUNTRIES: { code: string; name: string }[] = [];
  COUNTRY_REGIONS: any[] = [];
  STATES: any[] = [];
  LOCATION_COUNTRIES = [];
  getCountryStatus = false;
  fieldsLoadSubscription: Subscription;

  analytics: BehaviorSubject<any> = new BehaviorSubject(null);
  analytics$ = this.analytics.asObservable();
  handlerService: HandlerService;
  private created: BehaviorSubject<number> = new BehaviorSubject(Date.now());
  created$ = this.created.asObservable();
  contactsToSort: BehaviorSubject<any> = new BehaviorSubject([]);
  contactsToSort$ = this.contactsToSort.asObservable();
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService,
    public sspaService: SspaService
  ) {
    super(errorService);

    const page = localStorage.getCrmItem(KEY.CONTACT.PAGE);
    const pageSize = localStorage.getCrmItem(KEY.CONTACT.PAGE_SIZE);
    const sort = localStorage.getCrmItem(KEY.CONTACT.SORT_BY);
    if (page) {
      this.storeService.contactPage.next(parseInt(page));
    }
    if (pageSize) {
      this.pageSize.next(parseInt(pageSize));
    }
    if (sort) {
      const parsedSort = JSONParser(sort);
      if (parsedSort) {
        this.sort.next(parsedSort);
      }
    }

    this.storeService.contactPage$.subscribe((value) => {
      localStorage.setCrmItem(KEY.CONTACT.PAGE, value + '');
    });
    this.pageSize$.subscribe((value) => {
      localStorage.setCrmItem(KEY.CONTACT.PAGE_SIZE, value + '');
    });
    this.sort$.subscribe((value) => {
      localStorage.setCrmItem(KEY.CONTACT.SORT_BY, JSON.stringify(value));
    });

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

  getCountriesAndStates(): void {
    if (this.getCountryStatus) return;
    const countryArray = Country.getAllCountries();
    for (let i = 0; i < countryArray.length; i++) {
      if (countryArray[i].isoCode == 'US') {
        this.COUNTRIES.unshift({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      } else if (countryArray[i].isoCode == 'CA') {
        this.COUNTRIES.unshift({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      } else {
        this.COUNTRIES.push({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      }

      const stateArray = State.getStatesOfCountry(countryArray[i].isoCode);
      const stateNames = stateArray.map((t) => t.name);
      this.COUNTRY_REGIONS[countryArray[i].isoCode] = stateNames;
      this.LOCATION_COUNTRIES.push(countryArray[i].isoCode);
    }
    this.getCountryStatus = true;

    // this.httpClient
    //   .get(this.sspaService.toAsset('states.csv'), { responseType: 'text' })
    //   .subscribe(
    //     (data) => {
    //       const csvToRowArray = data.split('\n');
    //       for (let index = 1; index < csvToRowArray.length - 1; index++) {
    //         const row = csvToRowArray[index].split(',');
    //         this.STATES.push({
    //           name: row[1].replace('"', '').replace('"', ''),
    //           country_code: row[3]
    //         });
    //       }
    //       this.httpClient
    //         .get(this.sspaService.toAsset('countries.csv'), { responseType: 'text' })
    //         .subscribe(
    //           (data) => {
    //             const csvToRowArray = data.split('\n');
    //             for (let index = 1; index < csvToRowArray.length - 1; index++) {
    //               const row = csvToRowArray[index].split(',');
    //               const code = row[1].replace('\r', '');
    //               this.COUNTRIES.push({
    //                 name: row[0],
    //                 code: code
    //               });
    //               this.LOCATION_COUNTRIES.push(code);
    //               const stateArray = this.STATES.filter(
    //                 (e) => e.country_code == code
    //               );
    //               this.COUNTRY_REGIONS[code] = stateArray;
    //             }
    //             this.getCountryStatus = true;
    //           },
    //           (error) => {
    //             console.log(error);
    //           }
    //         );
    //     },
    //     (error) => {
    //       console.log(error);
    //     }
    //   );
  }

  /**
   * Read the Detail information of the contact and Emit the Behavior Subject
   * @param _id: Contact Id to read the detail information
   * @param sortInfo: Page sort information for the next and prev contact
   */
  read(_id: string, sortInfo = {}, loadActivities = true): void {
    this.readDetailStatus.next(STATUS.REQUEST);
    this.readImpl(_id, sortInfo).subscribe((res) => {
      this.readDetailStatus.next(STATUS.SUCCESS);
      if (res) {
        this.storeService.selectedContactMainInfo.next(res);
      }
    });
  }

  /**
   * Read the Detail information of the contact
   * @param _id: Contact Id to read the detail information
   * @param sortInfo: Page sort information for the next and prev contact
   */
  readImpl(_id: string, sortInfo = {}): Observable<ContactDetail> {
    return this.httpClient
      .post(this.server + CONTACT.READ + _id, sortInfo)
      .pipe(
        map((res) => new ContactDetail().deserialize(res['data'])),
        catchError(this.handleError('CONTACT DETAIL', null))
      );
  }

  reloadDetail(): void {
    const contact = this.storeService.selectedContact.getValue();
    if (contact && contact._id) {
      this.readDetailStatus.next(STATUS.REQUEST);
      this.readImpl(contact._id, {}).subscribe((res) => {
        this.readDetailStatus.next(STATUS.SUCCESS);
        if (res) {
          this.storeService.selectedContact.next(res);
        }
      });
    }
  }

  deleteContactActivity(ids: string[]): void {
    const currentContact = this.storeService.selectedContact.getValue();
    _.remove(currentContact.activity, (e) => {
      if (ids.indexOf(e._id) !== -1) {
        return true;
      }
      return false;
    });
    this.storeService.selectedContact.next(currentContact);
  }
  deleteContactActivityByDetail(detail: string, type): void {
    const currentContact = this.storeService.selectedContact.getValue();
    _.remove(currentContact.activity, (e) => {
      if (e[type] && (e[type] === detail || e[type][0] === detail)) {
        return true;
      }
      return false;
    });
    this.storeService.selectedContact.next(currentContact);
  }

  /**
   * Create Contact
   * @param contact
   */
  create(contact: Contact): Observable<any> {
    return this.httpClient.post(this.server + CONTACT.CREATE, contact).pipe(
      map((res) => res),
      catchError(this.handleError('CONTACT CREATE', null))
    );
  }

  /**
   * Update Contact
   * @param contact
   */
  update(contact): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.UPDATE, { ...contact })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE CONTACT', []))
      );
  }

  /**
   * Update contact
   * @param id : id of contact to update
   * @param contact : data to update
   */

  updateContact(id: string, contact: any): Observable<any> {
    return this.httpClient
      .put(this.server + CONTACT.UPDATE_DETAIL + id, contact)
      .pipe(
        map((res) => {
          if (
            res?.['data'] &&
            this.storeService.selectedContactMainInfo.getValue()?._id === id
          ) {
            this.storeService.selectedContactMainInfo.next(
              new ContactDetail().deserialize(res['data'])
            );
          }
          return res;
        }),
        catchError(this.handleError('UPDATE CONTACT', null))
      );
  }

  /**
   * Delete bulk contacts
   * @param _ids : ids array of contacts to remove
   */
  bulkDelete(_ids: string[]): Observable<boolean> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_DELETE, { ids: _ids })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DELETE CONTACTS', false))
      );
  }

  /**
   *
   * @param _ids : contact id array
   * @param contact : information to update
   * @param tagData : tag information to update (remove, add)
   */
  bulkUpdate(_ids: string[], contact: any, tagData: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_UPDATE, {
        contacts: _ids,
        data: contact,
        tags: tagData
      })
      .pipe(
        map((res) => res['status'] || false),
        catchError(this.handleError('BULK UPDATE', false))
      );
  }

  /**
   * download the csv of selected contacts
   * @param _ids : contact id array
   */
  downloadCSV(_ids: string[]): Observable<any[]> {
    return this.httpClient
      .post(this.server + CONTACT.EXPORT, {
        contacts: _ids
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('DOWNLOAD CSV', []))
      );
  }

  /**
   * get contacts count depend on type
   */
  getPendingContactsCount(): Observable<{
    total: number;
  }> {
    const searchType = 'pending';
    return this.httpClient
      .post(this.server + CONTACT.GET_CONTACTS_COUNT, {
        searchType
      })
      .pipe(
        map((res) => {
          return {
            total: res['data']['count'] || 0
          };
        }),
        catchError(this.handleError('GET PENDING CONTACTS COUNT', { total: 0 }))
      );
  }

  loadPage(): void {
    const searchOption = this.searchOption.getValue();
    if (searchOption.isEmpty()) {
      this.load(0);
    } else {
      this.advancedSearch();
    }
  }

  reloadPage(): void {
    const searchOption = this.searchOption.getValue();
    // const searchStr = this.searchStr.getValue();
    if (searchOption.isEmpty()) {
      const page = this.pageIndex.getValue();
      const pageSize = this.pageSize.getValue();
      let skip = (page - 1) * pageSize;
      skip = skip < 0 ? 0 : skip;
      this.load(skip);
    } else {
      this.advancedSearch();
    }
  }
  /**
   * Load Contacts and update the store
   * @param page : Contact Page Number
   */
  load(page: number): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.loadImpl(page).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        this.storeService.pageContacts.next(res['contacts']);
        this.total.next(res['total']);
      }
    });
  }
  /**
   * Call API & Load Contacts
   * @param page
   */
  loadImpl(page: number): Observable<any> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    const searchOption = this.searchOption.getValue();
    let searchType = (searchOption.listType ?? 'own') as string;
    const listType = this.listTypeOption.getValue();
    searchType = searchType !== 'own' ? searchType : listType;
    if (!DEFAULT_LIST_TYPE_IDS.includes(searchType)) {
      searchType = 'own';
    }

    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE_WITH_TYPE + page, {
        count,
        ...sort,
        searchType,
        // check edited selected custom filter
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

  loadImpl2(page: number, count: number, sort: any): Observable<any> {
    const skip = (page - 1) * count;
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + skip, {
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

  loadContacts(
    page: number,
    count: number
  ): Observable<{ contacts: Contact[]; total: number }> {
    const skip = (page - 1) * count;
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + skip, {
        count,
        dir: true,
        field: 'name'
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data']['contacts'] || []).forEach((e) => {
            contacts.push(new Contact().deserialize(e));
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

  loadContactIds(): Observable<{ contacts: Contact[]; sphere?: Contact }> {
    return this.httpClient.get(this.server + 'contact/ids').pipe(
      map((res) => {
        return {
          contacts: (res['data']?.['contacts'] || []).map((e) =>
            new Contact().deserialize(e)
          ),
          sphere: new Contact().deserialize(res['data']?.['sphere'])
        };
      }),
      catchError(this.handleError('LOAD CONTACT IDS', { contacts: [] }))
    );
  }

  loadContactsByIds(ids: string[]): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + 'contact/load-by-ids', { ids })
      .pipe(
        map((res) => {
          return (res['data'] || []).map((e) => new Contact().deserialize(e));
        }),
        catchError(this.handleError('LOAD CONTACTS BY IDS', []))
      );
  }

  /**
   * Advanced Search Call
   * @param str : keyword in the advanced search
   */
  advancedSearch(page = 1): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.advancedSearchImpl(page).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        const uniqContacts = _.uniqBy(res['contacts'], (e) => e._id);
        this.storeService.pageContacts.next(uniqContacts || []);
        this.total.next(res['total']);
        // this.total.next((uniqContacts || []).length);
      }
      // this.sortContacts();
    });
  }
  advancedSearchImpl(page = 1): Observable<ContactActivity[]> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    let skip = count * (page - 1);
    if (skip < 0) {
      skip = 0;
    }
    const searchOption = this.searchOption.getValue();
    const searchType = searchOption.listType ?? 'own';
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SERACH, {
        ...searchOption,
        ...sort,
        searchType,
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
  advancedSearchImpl2(
    searchOption: any,
    page = 1,
    count: number,
    sort: any
  ): Observable<ContactActivity[]> {
    const skip = (page - 1) * count;
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SERACH, {
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

  customAllFields(): void {
    this.customLoadingStatus.next(STATUS.REQUEST);
    this.fieldsLoadSubscription && this.fieldsLoadSubscription.unsubscribe();
    this.fieldsLoadSubscription = this.customFieldCount().subscribe((res) => {
      res
        ? this.customLoadingStatus.next(STATUS.SUCCESS)
        : this.customLoadingStatus.next(STATUS.FAILURE);
      this.garbage.next(res);
    });
  }
  customFieldCount(): Observable<any> {
    return this.httpClient.post(this.server + CONTACT.FIELD_COUNT, {}).pipe(
      map((res) => {
        const garbage = new Garbage().deserialize(res['data']);
        for (let i = 0; i < garbage.additional_fields.length; i++) {
          Object.assign(garbage.additional_fields[i], {
            count: res['total'][i]
          });
        }
        return garbage;
      }),
      catchError(this.handleError('SELECT ALL CONTACTS', []))
    );
  }
  customFieldSearch(
    page = 1,
    field = '',
    str = '',
    option = '',
    dateRange?: DateRange
  ): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.customFieldSearchImpl(
      page,
      field,
      str,
      option,
      dateRange
    ).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        const uniqContacts = _.uniqBy(res['contacts'], (e) => e._id);
        this.storeService.pageContacts.next(uniqContacts || []);
        this.total.next(res['total']);
      }
    });
  }
  customFieldSearchImpl(
    page = 1,
    field = '',
    str = '',
    option = '',
    dateRange?: DateRange
  ): Observable<ContactActivity[]> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    let skip = count * (page - 1);
    if (skip < 0) {
      skip = 0;
    }
    const reqParam = {
      page: page,
      fieldName: field,
      str: str,
      option: option,
      dateRange: dateRange
    };
    return this.httpClient
      .post(this.server + CONTACT.SEARCH_BY_CUSTOM, {
        ...reqParam,
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
        catchError(this.handleError('CUSTOM FIELD FILTER', null))
      );
  }

  mergeAdditionalFields(
    mergeFields: string[],
    mergeToField: string
  ): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.MERGE_ADDITIONAL_FIELDS, {
        mergeFields,
        mergeToField
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('MERGE ADDITIONAL FIELDS', null))
      );
  }
  loadAdditionalFieldsConflictContactsPagination(
    ids: string[]
  ): Observable<Contact[]> {
    return this.httpClient
      .post(
        this.server +
          CONTACT.LOAD_ADDITIONAL_FIELDS_CONFLICT_CONTACTS_PAGINATION,
        { ids }
      )
      .pipe(
        map((res) => {
          const contacts: Contact[] = [];
          if (res && res['status']) {
            (res['contacts'] || []).forEach((e) => {
              contacts.push(new Contact().deserialize(e));
            });
          }
          return contacts;
        }),
        catchError(
          this.handleError(
            'LOAD ADDITIONAL FIELDS CONFLICT CONTACTS PAGINATION',
            null
          )
        )
      );
  }
  /**
   * Normal Search Call
   * @param str : keyword in the normal search
   */
  normalSearch(str: string): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.normalSearchImpl(str).subscribe((contacts) => {
      contacts
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.storeService.pageContacts.next(contacts || []);
      this.total.next((contacts || []).length);
      this.sortContacts();
    });
  }
  normalSearchImpl(str: string): Observable<ContactActivity[]> {
    return this.httpClient
      .post(this.server + CONTACT.NORMAL_SEARCH, {
        search: str
      })
      .pipe(
        map((res) =>
          (res['data']['contacts'] || []).map((e) =>
            new ContactActivity().deserialize(e)
          )
        ),
        catchError(this.handleError('FILTER', null))
      );
  }

  loadByEmails(emails: string[]): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_BY_EMAIL, { emails })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('LOAD BY EMAILS', []))
      );
  }

  filter(query): Observable<Contact[]> {
    return this.httpClient.post(this.server + CONTACT.FILTER, query).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('FILTER CONTACTS', []))
    );
  }
  getNormalSearch(str: string): any {
    return this.httpClient.post(this.server + CONTACT.NORMAL_SEARCH, {
      search: str
    });
  }
  getPageContacts(page, sort): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + page, sort)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD CONTACTS', []))
      );
  }
  sortContacts(): void {
    const sortInfo = this.sort.getValue();
    const sortGrav = sortInfo.dir == true ? 1 : -1;
    const sortField = sortInfo.field;
    const contacts = this.storeService.pageContacts.getValue();
    if (sortField == 'name') {
      contacts.sort((a, b) => {
        const aName = (
          (a['first_name'] || '') +
          ' ' +
          (a['last_name'] || '')
        ).trim();
        const bName = (
          (b['first_name'] || '') +
          ' ' +
          (b['last_name'] || '')
        ).trim();
        if (aName > bName) {
          return 1 * sortGrav;
        } else if (aName == bName) {
          return 0;
        } else {
          return -1 * sortGrav;
        }
      });
    }
    if (sortField == 'updated_at') {
      contacts.sort((a, b) => {
        const aDate = new Date(a['last_activity']['updated_at'] + '').getTime();
        const bDate = new Date(b['last_activity']['updated_at'] + '').getTime();
        if (aDate > bDate) {
          return 1 * sortGrav;
        } else if (aDate == bDate) {
          return 0;
        } else {
          return -1 * sortGrav;
        }
      });
    }
  }
  /**
   * Search the contacts using keyword.
   * @param keyword : keyword
   */
  easySearch({
    keyword,
    skip = 0,
    includeSharedContacts = false
  }): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + CONTACT.QUICK_SEARCH, {
        search: keyword,
        skip,
        includeSharedContacts
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((data) => new Contact().deserialize(data))
        ),
        catchError(this.handleError('SEARCH CONTACTS', []))
      );
  }
  /**
   * Find the contacts that sent the selected material lately
   * @param _id :Material id
   */
  latestContacts(_id: string): Observable<ActivityDetail[]> {
    return this.httpClient
      .get(this.server + CONTACT.LATEST_CONTACTS + _id)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET LATEST CONTACTS', []))
      );
  }
  /**
   * Select All Contacts
   */
  selectAll(): Observable<any> {
    const sort = this.sort.getValue();
    const searchOption = this.searchOption.getValue();
    let searchType = (searchOption.listType ?? 'own') as string;
    const listType = this.listTypeOption.getValue();
    searchType = searchType !== 'own' ? searchType : listType;
    if (!DEFAULT_LIST_TYPE_IDS.includes(searchType)) {
      searchType = 'own';
    }

    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE_WITH_TYPE + 0, {
        count: -1,
        ...sort,
        searchType,
        name: undefined
      })
      .pipe(
        map((res) =>
          (res['data']['contacts'] || []).map((e) =>
            new Contact().deserialize(e)
          )
        ),
        catchError(this.handleError('SELECT ALL CONTACTS', []))
      );
  }

  /**
   * Select Advanced Searched Contacts
   * @param searchOption: Current Search Option
   */
  advancedSelectAll(searchOption: SearchOption): Observable<any> {
    const sort = this.sort.getValue();
    const searchType = searchOption.listType ?? 'own';
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SELECT, {
        ...searchOption,
        ...sort,
        searchType
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SELECT FILTERED CONTACTS', []))
      );
  }

  /**
   * Select all of the user own contacts
   * TODO: we can merge this function with above similar ones later (selectAll)
   * @returns contacts[]
   */
  selectAllUserContacts(): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE_WITH_TYPE + 0, {
        count: -1
      })
      .pipe(
        map((res) =>
          (res['data']['contacts'] || []).map((e) =>
            new Contact().deserialize(e)
          )
        ),
        catchError(this.handleError('SELECT ALL CONTACTS', []))
      );
  }
  /**
   * Select Advanced Searched Contacts of user own contacts
   * TODO: we can merge this function with above similar ones (advanceSelectAll)
   * @param searchOption: Current Search Option
   * @return contacts[]
   */
  advancedSelectAllUserContacts(searchOption: SearchOption): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SELECT, {
        ...searchOption
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SELECT FILTERED CONTACTS', []))
      );
  }
  /**
   * Load the contacts information by contact ids
   * @param ids : contact id array
   */
  getContactsByIds(ids: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_BY_IDS, { ids })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SEARCH CONTACTS', []))
      );
  }

  /**
   * merge two contacts
   * @param data : primary, secondaries, result contacts
   */
  mergeContacts(data): Observable<Contact> {
    return this.httpClient.post(this.server + CONTACT.MERGE, { ...data }).pipe(
      map((res) => res['data']),
      catchError(this.handleError('MERGE CONTACTS', null))
    );
  }

  /**
   * Create Bulk Contact
   * @param contacts : contacts data to create
   */
  bulkCreate(contacts): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_CREATE, { contacts })
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK CREATE CONTACTS', null))
      );
  }

  /**
   * Check Email duplication
   * @param email : email
   */
  checkEmail(email: string): any {
    return this.httpClient
      .post(this.server + CONTACT.CHECK_EMAIL, { email })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('CHECKING EMAIL DUPLICATION', []))
      );
  }

  /**
   * checking cell phone number
   * @param cell_phone : cell phone number
   */
  checkPhone(cell_phone: string): any {
    return this.httpClient
      .post(this.server + CONTACT.CHECK_PHONE, {
        cell_phone
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('CHECKING PHONE DUPLICATION', []))
      );
  }

  shareContacts(data): Observable<any> {
    // teamId, userId, contacts, type = 2
    return this.httpClient.post(this.server + CONTACT.SHARE_CONTACT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SHARE CONTACTS TO TEAM', []))
    );
  }

  stopShareContacts(contacts, user, team?): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.STOP_SHARE, {
        contacts,
        user,
        team
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('STOP SHARE CONTACTS', []))
      );
  }

  loadNotes(_id: string): Observable<Note[]> {
    return this.httpClient.get(this.server + CONTACT.LOAD_NOTES + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Note().deserialize(e))),
      catchError(this.handleError('LOAD NOTES', []))
    );
  }

  loadTimeline(_id: string): Observable<any> {
    return this.httpClient.get(this.server + CONTACT.LOAD_TIMELINE + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Timeline().deserialize(e))),
      catchError(this.handleError('LOAD CONTACT TIMELINE', []))
    );
  }

  /**
   * Call api to load the tasks that be executed in the future (campaign, scheduled)
   * @param _id : contact id
   * @returns : Observable
   */
  loadTasks(_id: string): Observable<any[]> {
    return this.httpClient.get(this.server + CONTACT.LOAD_TASKS + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Timeline().deserialize(e))),
      catchError(this.handleError('LOAD CONTACT TASKS', []))
    );
  }

  /**
   * remove the contact from the task
   * @param payload: { contact, task, type }
   * @returns : Observable
   */
  removeFromTask(payload: any): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.REMOVE_FROM_TASK, payload)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE CONTACT FROM TASK', []))
      );
  }

  delete$(contacts: Contact[]): any {
    const pageContacts = this.storeService.pageContacts.getValue();
    const remainedContacts = _.differenceBy(pageContacts, contacts, '_id');
    this.storeService.pageContacts.next(remainedContacts);

    const total = this.total.getValue();
    this.total.next(total - contacts.length);
    return {
      page: remainedContacts.length,
      total: total - contacts.length
    };
  }
  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
    this.total.next(0);
    this.pageIndex.next(1);
    this.pageSize.next(50);
  }
  getCustomFieldByName(fieldName: string): any {
    const garbage = this.garbage.getValue();
    const field = garbage.additional_fields.find(
      (e) => e.name === fieldName
    )[0];
    return field;
  }

  analyticsByFields(
    options: FieldAnalyticsData[]
  ): Observable<FieldAnalyticsData[]> {
    return this.httpClient.post(this.server + ANALYTICS.BY_FIELD, options).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ANALYTICS', []))
    );
  }

  analyticsByActivities(
    req: ActivityAnalyticsReq
  ): Observable<ActivityAnalyticsData[]> {
    return this.httpClient.post(this.server + ANALYTICS.BY_ACTIVITY, req).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ANALYTICS', []))
    );
  }

  analyticsByAutomation(range: number): Observable<any> {
    return this.httpClient
      .post(this.server + ANALYTICS.BY_AUTOMATION, { range })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD ANALYTICS', []))
      );
  }

  analyticsByRate(): Observable<any> {
    return this.httpClient.post(this.server + ANALYTICS.BY_RATE, {}).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ANALYTICS', []))
    );
  }

  calculateRates(): Observable<any> {
    return this.httpClient
      .post(this.server + ANALYTICS.CALCULATE_RATES, {})
      .pipe(
        map((res) => res['status'] || []),
        catchError(this.handleError('RATING', []))
      );
  }

  unlockContact(contacts: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.UNLOCK, { contacts })
      .pipe(
        map((res) => res['data'] || 0),
        catchError(this.handleError('UNLOCK', 0))
      );
  }

  /**
   * Get count of contacts
   */
  getOverivewCount(): any {
    return this.httpClient.get(this.server + CONTACT.GET_COUNT).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET COUNT', []))
    );
  }

  onCreate(): void {
    this.created.next(Date.now());
  }

  /**
   * Assign Bucket
   */
  assignBucket(ids: string[], bucket: string, score: number): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.ASSIGN_BUCKET, { ids, bucket, score })
      .pipe(
        map((res) => res['data'] || 0),
        catchError(this.handleError('ASSIGN_BUCKET', 0))
      );
  }

  getContactActions(contactId: string, data: any) {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_ACTIONS + contactId, data)
      .pipe(
        map((res) => res['data'] || 0),
        catchError(this.handleError('LOAD_ACTIONS', 0))
      );
  }

  /**
   *
   * @param _id : contact id
   * @param phoneNumber : Phone number
   */
  setPrimaryPhone(_id: string, phoneNumber: string): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.SET_PRIMARY_PHONE, {
        contact: _id,
        phoneNumber
      })
      .pipe(
        map((res) => {
          if (
            res?.['data'] &&
            this.storeService.selectedContactMainInfo.getValue()?._id === _id
          ) {
            this.storeService.selectedContactMainInfo.next(
              new ContactDetail().deserialize(res['data'])
            );
          }
          return res;
        }),
        catchError(this.handleError('SET PRIMARY PHONE', false))
      );
  }

  /**
   *
   * @param _id : contact id
   * @param phoneNumber : Email address
   */
  setPrimaryEmail(_id: string, email: string): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.SET_PRIMARY_EMAIL, {
        contact: _id,
        email
      })
      .pipe(
        map((res) => {
          if (
            res?.['data'] &&
            this.storeService.selectedContactMainInfo.getValue()?._id === _id
          ) {
            this.storeService.selectedContactMainInfo.next(
              new ContactDetail().deserialize(res['data'])
            );
          }
          return res;
        }),
        catchError(this.handleError('SET PRIMARY EMAIL', false))
      );
  }

  /**
   *
   * @param _id : contact id
   * @param address : Address Object
   */
  setPrimaryAddress(_id: string, address: object): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.SET_PRIMARY_ADDRESS, {
        contact: _id,
        address
      })
      .pipe(
        map((res) => {
          if (
            res?.['data'] &&
            this.storeService.selectedContactMainInfo.getValue()?._id === _id
          ) {
            this.storeService.selectedContactMainInfo.next(
              new ContactDetail().deserialize(res['data'])
            );
          }
          return res;
        }),
        catchError(this.handleError('SET PRIMARY Address', false))
      );
  }

  acceptSharing(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.ACCEPT_SHARING, data)
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

  declineSharing(contacts): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.DECLINE_SHARING, { contacts })
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
    return this.httpClient.post(this.server + CONTACT.ACCEPT_MOVE, data).pipe(
      map((res) => res),
      catchError(this.handleError('MOVE CONTACTS', null))
    );
  }

  moveDeclineRequest(data: any): Observable<any> {
    return this.httpClient.post(this.server + CONTACT.DECLINE_MOVE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('MOVE CONTACTS', null))
    );
  }
}
