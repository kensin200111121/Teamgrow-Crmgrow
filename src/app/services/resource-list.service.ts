import {
  CheckingResponse,
  RelatedResourceResponse,
  CheckRequest,
  DownloadRequest,
  FilterParam,
  FolderHistoryData,
  ResourceResponse,
  ShareRequest,
  StopShareRequest,
  StoredResources,
  FolderItemInfo,
  MaterialItem
} from '@core/interfaces/resources.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { ListType } from '@core/enums/resources.enum';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { JSONParser } from '@utils/functions';
export abstract class ResourceListService<
  ListItem,
  ResourceType
> extends HttpService {
  protected abstract listEndpointBase: string;
  protected abstract teamListEndpointBase: string;
  protected abstract listpageOptionkey: string;
  protected abstract libpageOptionkey: string;
  protected abstract teampageOptionkey: string;
  protected ownHistory: StoredResources<ListItem> = {};
  protected libraryHistory: StoredResources<ListItem> = {};
  protected teamHistory: StoredResources<ListItem> = {};
  constructor(errorService: ErrorService, protected httpClient: HttpClient) {
    super(errorService);
  }

  listPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 25,
    sort: 'title',
    selectedFolder: null,
    searchStr: '',
    matType: '',
    teamOptions: [],
    userOptions: [],
    folderOptions: [],
    isAdmin: false,
    filterTypes: [],
    sortType: null
  });
  listPageOption$ = this.listPageOption.asObservable();

  updateItem: BehaviorSubject<{
    updateAction: string | null;
    itemId?: string | null;
    updateData?: any | null;
  }> = new BehaviorSubject({
    updateAction: null,
    itemId: null,
    updateData: null
  });
  updateItem$ = this.updateItem.asObservable();

  libPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 25,
    sort: 'title',
    selectedFolder: null,
    searchStr: '',
    matType: '',
    teamOptions: [],
    userOptions: [],
    folderOptions: [],
    isAdmin: false,
    filterTypes: [],
    sortType: null
  });
  libPageOption$ = this.libPageOption.asObservable();
  teamPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 25,
    sort: 'title',
    selectedFolder: null,
    searchStr: '',
    matType: '',
    teamOptions: [],
    userOptions: [],
    folderOptions: [],
    isAdmin: false,
    filterTypes: [],
    sortType: null
  });
  teamPageOption$ = this.teamPageOption.asObservable();

  load(
    param: FilterParam<ResourceType>,
    listType: ListType,
    teamId?: string
  ): Observable<ResourceResponse<ListItem>> {
    switch (listType) {
      case ListType.OWN:
        return this.loadOwnList(param);
        break;
      case ListType.LIBRARY:
        return this.loadLibraryList(param);
        break;
      default:
        //ListType.TEAM
        return this.loadTeamList(param, teamId);
        break;
    }
  }

  requestFolderId(param: FolderItemInfo): Observable<any> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'req-folderid', param)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST FOLDER ID', null))
      );
  }

  loadPageOption(): void {
    const listPageOption = localStorage.getCrmItem(this.listpageOptionkey);
    if (listPageOption) {
      const parsedListOption = JSONParser(listPageOption);
      if (parsedListOption) {
        this.listPageOption.next(parsedListOption);
      }
    }
    const libPageOption = localStorage.getCrmItem(this.libpageOptionkey);
    if (libPageOption) {
      const parsedLibOption = JSONParser(libPageOption);
      if (parsedLibOption) {
        this.libPageOption.next(parsedLibOption);
      }
    }
    const teamPageOption = localStorage.getCrmItem(this.teampageOptionkey);
    if (teamPageOption) {
      const parsedLibOption = JSONParser(teamPageOption);
      if (parsedLibOption) {
        this.teamPageOption.next(parsedLibOption);
      }
    }

    this.listPageOption.subscribe((value) => {
      localStorage.setCrmItem(this.listpageOptionkey, JSON.stringify(value));
    });
    this.libPageOption.subscribe((value) => {
      localStorage.setCrmItem(this.libpageOptionkey, JSON.stringify(value));
    });
    this.teamPageOption.subscribe((value) => {
      localStorage.setCrmItem(this.teampageOptionkey, JSON.stringify(value));
    });
  }
  updateListPageOption(data): void {
    let option = this.listPageOption.getValue();
    option = { ...option, ...data };
    this.listPageOption.next({ ...option });
  }
  updateLibPageOption(data): void {
    let option = this.libPageOption.getValue();
    option = { ...option, ...data };
    this.libPageOption.next({ ...option });
  }
  updateTeamPageOption(data): void {
    let option = this.teamPageOption.getValue();
    option = { ...option, ...data };
    this.teamPageOption.next({ ...option });
  }
  abstract loadOwnList(
    param: FilterParam<ResourceType>
  ): Observable<ResourceResponse<ListItem>>;

  abstract loadLibraryList(
    param: FilterParam<ResourceType>
  ): Observable<ResourceResponse<ListItem>>;

  abstract loadTeamList(
    param: FilterParam<ResourceType>,
    teamId: string
  ): Observable<ResourceResponse<ListItem>>;

  checkShare(data: CheckRequest): Observable<CheckingResponse> {
    // return;
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'check-share', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK SHARE', null))
      );
  }

  getTemplateResources(data: CheckRequest): Observable<CheckingResponse> {
    // return;
    return this.httpClient
      .post(
        this.server + this.teamListEndpointBase + 'get-template-resources',
        data
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET TEMPLATE RESOURCES', null))
      );
  }

  getRelatedResources(id: string): Observable<RelatedResourceResponse> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'get-related-resources', {
        _id: id
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET RELATED RESOURCES', null))
      );
  }

  share(data: ShareRequest): Observable<any> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'share', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('SHARE', null))
      );
  }

  checkStopShare(data: StopShareRequest): Observable<CheckingResponse> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'check-stop-share', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK STOP SHARE', null))
      );
  }

  bulkStopShare(data: StopShareRequest): Observable<boolean> {
    return this.httpClient
      .post(this.server + 'team/bulk-stop-share', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK STOP SHARE', null))
      );
  }

  stopShare(data: StopShareRequest): Observable<boolean> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'stop-share', data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('STOP SHARE', null))
      );
  }

  checkDownload(data: CheckRequest): Observable<CheckingResponse> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'check-download', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK DOWNLOAD', null))
      );
  }

  download(data: DownloadRequest): Observable<any> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase + 'download', data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DOWNLOAD', null))
      );
  }

  getHistory(historyType: ListType): StoredResources<ListItem> {
    let history = this.ownHistory;
    if (historyType === ListType.LIBRARY) {
      history = this.libraryHistory;
    } else if (historyType === ListType.TEAM) {
      history = this.teamHistory;
    }
    return history;
  }

  storeFolderHistory(
    historyType: ListType,
    data: FolderHistoryData<ListItem>,
    folder?: string
  ): void {
    let history = this.ownHistory;
    if (historyType === ListType.LIBRARY) {
      history = this.libraryHistory;
    } else if (historyType === ListType.TEAM) {
      history = this.teamHistory;
    }
    const folderId = folder || 'root';
    if (folderId === 'root') {
      history[folderId] = data;
      return;
    }
    // Check the deep current page
    if (Object.keys(history).length > 4) {
      const folderToRemove = Object.keys(history).filter(
        (e) => e !== 'root'
      )[0];
      delete history[folderToRemove];
    }
    history[folderId] = data;
  }
  clear$(): void {
    this.ownHistory = {};
    this.libraryHistory = {};
    this.teamHistory = {};
  }

  downloadDuplicatedTokens(tokens: any): Observable<any> {
    return this.httpClient
      .post(this.server + 'team/download-duplicated-tokens', { tokens })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DOWNLOAD', null))
      );
  }
}
