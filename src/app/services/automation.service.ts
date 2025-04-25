import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AUTOMATION, CONTACT, DIALER } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { Automation } from '@models/automation.model';
import { Contact } from '@models/contact.model';
import { Deal } from '@models/deal.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { Timeline } from '@models/timeline.model';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';
import {
  CheckRequest,
  CheckingResponse,
  DownloadRequest
} from '@app/core/interfaces/resources.interface';

@Injectable({
  providedIn: 'root'
})
export class AutomationService extends HttpService {
  automations: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  automations$ = this.automations.asObservable();
  libraries: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  libraries$ = this.libraries.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  loadOwnStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingOwn$ = this.loadOwnStatus.asObservable();
  loadLibraryStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingLibrary$ = this.loadLibraryStatus.asObservable();

  listPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 10,
    searchOption: {
      title: false,
      role: false,
      created_at: false
    },
    selectedSort: 'type'
  });
  libPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 10,
    searchOption: {
      title: false,
      role: false,
      created_at: false,
      downloads: false
    },
    selectedSort: 'type'
  });

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
    const listOption = localStorage.getCrmItem(
      KEY.AUTOMATIONS_LIST.PAGE_OPTION
    );
    const libOption = localStorage.getCrmItem(KEY.AUTOMATIONS_LIB.PAGE_OPTION);
    if (listOption) {
      const parsedListOption = JSONParser(listOption);
      if (parsedListOption) {
        this.listPageOption.next(parsedListOption);
      }
    }
    if (libOption) {
      const parsedLibOption = JSONParser(libOption);
      if (parsedLibOption) {
        this.libPageOption.next(parsedLibOption);
      }
    }

    this.listPageOption.subscribe((value) => {
      localStorage.setCrmItem(
        KEY.AUTOMATIONS_LIST.PAGE_OPTION,
        JSON.stringify(value)
      );
    });
    this.libPageOption.subscribe((value) => {
      localStorage.setCrmItem(
        KEY.AUTOMATIONS_LIB.PAGE_OPTION,
        JSON.stringify(value)
      );
    });
  }

  /**
   * Load All Automations
   * @param force Flag to load force
   */
  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAllImpl().subscribe((automations) => {
      automations
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.automations.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadAllImpl(): Observable<Automation[]> {
    return this.httpClient.get(this.server + AUTOMATION.LOAD_ALL).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Automation().deserialize(e))
      ),
      catchError(this.handleError('LOAD ALL AUTOMATION', null))
    );
  }

  loadOwn(force = false, hasSharedAutomations = false): void {
    if (!force) {
      const loadStatus = this.loadOwnStatus.getValue();
      if (loadStatus == STATUS.REQUEST) {
        return;
      }
    }
    this.loadOwnStatus.next(STATUS.REQUEST);
    this.loadOwnImpl(hasSharedAutomations).subscribe((automations) => {
      automations
        ? this.loadOwnStatus.next(STATUS.SUCCESS)
        : this.loadOwnStatus.next(STATUS.FAILURE);
      this.automations.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadOwnImpl(hasSharedAutomations: boolean): Observable<Automation[]> {
    return this.httpClient
      .get(
        this.server + AUTOMATION.LOAD_OWN,
        hasSharedAutomations
          ? {
              params: {
                hasSharedAutomations
              }
            }
          : undefined
      )
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Automation().deserialize(e))
        ),
        catchError(this.handleError('LOAD MY AUTOMATION', null))
      );
  }

  loadLibrary(force = false): void {
    if (!force) {
      const loadStatus = this.loadLibraryStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadLibraryStatus.next(STATUS.REQUEST);
    this.loadLibraryImpl().subscribe((automations) => {
      automations
        ? this.loadLibraryStatus.next(STATUS.SUCCESS)
        : this.loadLibraryStatus.next(STATUS.FAILURE);
      this.libraries.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadLibraryImpl(): Observable<Automation[]> {
    return this.httpClient.post(this.server + AUTOMATION.LOAD_LIBRARY, {}).pipe(
      map((res) => {
        if (res['data'] && res['data']?.length) {
          return (res['data'] || []).map((e) =>
            new Automation().deserialize(e)
          );
        }
      }),
      catchError(this.handleError('LOAD LIBRARY(AUTOMATION)', null))
    );
  }

  reload(): void {
    // this.loadAll(true);
    this.loadOwn(true);
  }

  search(keyword: string): Observable<Automation[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH, { search: keyword })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Automation().deserialize(e))
        ),
        catchError(this.handleError('SEARCH AUTOMATION', []))
      );
  }

  getByPage(page: string): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.LOAD_PAGE).pipe(
      map((res) => res),
      catchError(this.handleError('GET AUTOMATION PAGE BY ID', []))
    );
  }
  getStatus(id, contacts): Observable<Automation[]> {
    return this.httpClient
      .post(this.server + CONTACT.DETAIL + id, { contacts })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET AUTOMATION STATUS', []))
      );
  }
  getAssignedContacts(id: string): Observable<Contact[]> {
    return this.httpClient.get(this.server + AUTOMATION.CONTACTS + id).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Contact().deserialize(e))
      ),
      catchError(this.handleError('GET AUTOMATION STATUS', []))
    );
  }
  getContactDetail(contact: string): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.CONTACT_DETAIL, {
        contact
      })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('GET CONTACT STATUS DETAIL', null))
      );
  }
  delete(folder: string, id: string): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.DELETE + id, { folder })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }
  bulkRemove(folder: string, ids): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.BULK_REMOVE, { folder, automations: ids })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }
  getChildAutomationNames(id): Observable<any[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_TITLES, { id: id })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }

  getAllChildAutomationNames(body: any): Observable<any[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_ALL_TITLES, body)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }

  get(id: string, pageSize = 50, page = 0): Observable<Automation> {
    const data = {
      id: id,
      count: pageSize,
      skip: page
    };
    return this.httpClient.post(this.server + AUTOMATION.READ, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('READ AUTOMATION', null))
    );
  }
  update(id, automation): Observable<Automation> {
    return this.httpClient
      .put(this.server + AUTOMATION.UPDATE + id, automation)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('UPDATE AUTOMATION', null))
      );
  }
  getDetail(id: string): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.UPDATE + id).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET AUTOMATION DETAIL', null))
    );
  }
  create(body): Observable<Automation> {
    return this.httpClient.post(this.server + AUTOMATION.CREATE, body).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE AUTOMATION', null))
    );
  }
  download(body): Observable<any> {
    return this.httpClient.post(this.server + AUTOMATION.DOWNLOAD, body).pipe(
      map((res) => res['status']),
      catchError(this.handleError('CREATE AUTOMATION', null))
    );
  }

  bulkDownload(body: any): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.BULK_DOWNLOAD, body)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DOWNLOAD AUTOMATION', null))
      );
  }

  bulkAssign(
    automation: string,
    contacts: string[],
    deals: string[]
  ): Observable<any> {
    if (deals) {
      return this.httpClient
        .post(this.server + AUTOMATION.ASSIGN, {
          automation_id: automation,
          deals,
          required_unique: true
        })
        .pipe(
          map((res) => res),
          catchError(this.handleError('AUTOMATION BULK ASSIGN', null))
        );
    } else {
      return this.httpClient
        .post(this.server + AUTOMATION.ASSIGN, {
          automation_id: automation,
          contacts,
          required_unique: false
        })
        .pipe(
          map((res) => res),
          catchError(this.handleError('AUTOMATION BULK ASSIGN', null))
        );
    }
  }

  reAssign(
    automation: string,
    contacts: string[],
    deals: string[]
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.ASSIGN_NEW, {
        automation_id: automation,
        contacts,
        deals
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('AUTOMATION REASSIGN', false))
      );
  }

  unAssign(
    automation_line: string,
    deal?: string,
    isOnly = false,
    contactId?: string
  ): Observable<boolean> {
    const params =
      deal && contactId
        ? { deal_id: deal, isOnly, contact_id: contactId }
        : { isOnly };
    return this.httpClient
      .get(this.automation_server + AUTOMATION.CANCEL + automation_line, {
        params
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNASSIGN AUTOMATION', false))
      );
  }

  unAssignDeal(dealId: string): Observable<boolean> {
    return this.httpClient
      .get(this.automation_server + AUTOMATION.CANCEL_DEAL + dealId)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNASSIGN DEAL AUTOMATION', false))
      );
  }

  // loadOwn(): Observable<Automation[]> {
  //   return this.httpClient.get(this.server + AUTOMATION.LOAD_OWN).pipe(
  //     map((res) => res['data'] || []),
  //     catchError(this.handleError('LOAD OWN AUTOMATION', []))
  //   );
  // }

  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
    this.automations.next([]);
  }

  searchContact(id: string, keyword: string): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH_CONTACT, {
        automation: id,
        search: keyword
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SEARCH AUTOMATION CONTACT', []))
      );
  }

  searchDeal(id: string, keyword: string): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH_DEAL, {
        automation: id,
        search: keyword
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SEARCH AUTOMATION DEAL', []))
      );
  }

  moveFiles(body: any): Observable<boolean> {
    return this.httpClient.post(this.server + AUTOMATION.MOVE_FILES, body).pipe(
      map((res) => res['status']),
      catchError(this.handleError('MOVE AUTOMATION', null))
    );
  }

  removeFolder(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.REMOVE_FOLDER, body)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE AUTOMATION FOLDER', null))
      );
  }
  removeFolders(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.REMOVE_FOLDERS, body)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE AUTOMATION FOLDER', null))
      );
  }
  downloadFolder(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.DOWNLOAD_FOLDER, body)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DOWNLOAD AUTOMATION FOLDER', null))
      );
  }

  /**
   * Get the executing automation count
   */
  getActivatedTimelinesCount(): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.GET_COUNT).pipe(
      map((res) => res),
      catchError(this.handleError('GETTING ASSIGNED AUTOMATIONS COUNT', null))
    );
  }

  /**
   * Loading executing automations and contacts
   * @returns
   */
  loadActivatedTimelines(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.LOAD_TIMELINES, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING ASSIGNED AUTOMATIONS', null))
      );
  }

  /**
   * Select All Contacts
   */
  selectAll(id): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.SELECT_ALL + id).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Contact().deserialize(e))
      ),
      catchError(this.handleError('SELECT ALL CONTACTS', []))
    );
  }

  /**
   * Select All Deals
   */
  selectAllDeals(id): Observable<any> {
    return this.httpClient
      .get(this.server + AUTOMATION.SELECT_ALL_DEALS + id)
      .pipe(
        map((res) => (res['data'] || []).map((e) => new Deal().deserialize(e))),
        catchError(this.handleError('SELECT ALL DEALS', []))
      );
  }

  /**
   * Bulk Unassign Contacts or Deals
   */
  bulkUnassign(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.BULK_CANCEL, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK CANCEL CONTACT AUTOMATION', null))
      );
  }

  create$(automation): void {
    const automations = this.automations.getValue();
    automations.push(automation);
    this.automations.next([...automations]);
  }

  update$(id, data): void {
    const automations = this.automations.getValue();
    automations.some((e) => {
      if (e._id === id) {
        Object.assign(e, data);
        return true;
      }
    });
  }

  getActionTimelines(body: any): Observable<Timeline[]> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.GET_ACTION_TIMELINES, body)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET ACTION TIMELINES', null))
      );
  }

  updateActionTimelines(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.UPDATE_ACTION_TIMELINES, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE ACTION TIMELINES', null))
      );
  }

  addActionTimelines(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.ADD_ACTION_TIMELINES, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('ADD ACTION TIMELINES', null))
      );
  }

  removeActionTimelines(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.REMOVE_ACTION_TIMELINES, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE ACTION TIMELINES', null))
      );
  }
  getAutomationLines(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_AUTOMATION_LINES, data)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET AUTOMATION LINES', null))
      );
  }

  getAutomationLine(id: string): Observable<any> {
    return this.httpClient
      .get(this.server + AUTOMATION.GET_AUTOMATION_LINE + id)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('GET AUTOMATIONLINE DETAIL', null))
      );
  }

  getTimelines(id: string): Observable<any> {
    return this.httpClient
      .get(
        this.server +
          AUTOMATION.GET_AUTOMATION_LINE +
          id +
          AUTOMATION.GET_TIMELINES
      )
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('GET TIMELINES', null))
      );
  }

  /**
   * Load the timelines by automation line id
   * @param automationLineId
   * @returns
   */
  loadAutomationTimelines(automationLineId: string) {
    return this.httpClient
      .post(this.server + AUTOMATION.LOAD_AUTOMATION_TIMELINES, {
        automationLineId
      })
      .pipe(
        map(
          (res) => res['data'] || [].map((e) => new Timeline().deserialize(e))
        ),
        catchError(this.handleError('GET TIMELINES', null))
      );
  }

  uploadAudio(data: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + AUTOMATION.UPLOAD_AUDIO, data, {
        headers
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPLOAD AUDIO'))
      );
  }

  getContactsAutomation(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_CONTACTS_AUTOMATION, data)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET CONTACTS AUTOMATION', null))
      );
  }

  updateTimelineStatus(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.UPDATE_TIMELINE_STATUS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE TIMELINE STATUS ACTION', null))
      );
  }

  processTimeline(data: any): Observable<any> {
    return this.httpClient
      .post(this.automation_server + AUTOMATION.PROCESS_TIMELINE, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('PROCESS TIMELINE ACTION', null))
      );
  }

  updateListPageOption(data): void {
    let option = this.listPageOption.getValue();
    option = { ...option, ...data };
    this.listPageOption.next(option);
  }

  updateLibPageOption(data): void {
    let option = this.libPageOption.getValue();
    option = { ...option, ...data };
    this.libPageOption.next(option);
  }

  checkDownload(data: CheckRequest): Observable<CheckingResponse> {
    return this.httpClient
      .post(this.server + 'team/automation/check-download', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK DOWNLOAD', null))
      );
  }

  downloadFromTeam(data: DownloadRequest): Observable<boolean> {
    return this.httpClient
      .post(this.server + 'team/automation/download', data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DOWNLOAD', null))
      );
  }
}
