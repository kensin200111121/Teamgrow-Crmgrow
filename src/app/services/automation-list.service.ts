import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AutomationType } from '@core/enums/resources.enum';
import {
  FilterParam,
  AutomationItem,
  ResourceResponse,
  StoredResources
} from '@core/interfaces/resources.interface';
import { ResourceListService } from '@services/resource-list.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { KEY } from '@constants/key.constant';
import { AUTOMATION } from '@constants/api.constant';

@Injectable({
  providedIn: 'root'
})
export class AutomationListService extends ResourceListService<
  AutomationItem,
  AutomationType
> {
  protected ownHistory: StoredResources<AutomationItem>;
  protected libraryHistory: StoredResources<AutomationItem>;
  protected teamHistory: StoredResources<AutomationItem>;
  protected listEndpointBase = 'automation/';
  protected teamListEndpointBase = 'team/automation/';
  protected teamEndpointBase = 'team/automation/';
  protected listpageOptionkey: string = KEY.AUTOMATIONS_LIST.PAGE_OPTION;
  protected libpageOptionkey: string = KEY.AUTOMATIONS_LIB.PAGE_OPTION;
  protected teampageOptionkey: string = KEY.AUTOMATIONS_LIB.PAGE_OPTION;
  constructor(errorService: ErrorService, httpClient: HttpClient) {
    super(errorService, httpClient);
    this.loadPageOption();
  }

  loadOwnList(
    param: FilterParam<AutomationType>
  ): Observable<ResourceResponse<AutomationItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-own', param)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new AutomationItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder'],
              currentFolder: res?.['data']?.['currentFolder'],
              folderTree: res?.['data']?.['folderTree']
            }
          };
        }),
        catchError(this.handleError('LOAD OWN AUTOMATION LIST', null))
      );
  }

  loadLibraryList(
    param: FilterParam<AutomationType>
  ): Observable<ResourceResponse<AutomationItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-library', param)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new AutomationItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder'],
              team: res?.['data']?.['team']
            }
          };
        }),
        catchError(this.handleError('LOAD AUTOMATION LIBRARY LIST', null))
      );
  }

  loadTeamList(
    param: FilterParam<AutomationType>,
    teamId: string
  ): Observable<ResourceResponse<AutomationItem>> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase, { ...param, teamId })
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new AutomationItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder']
            }
          };
        }),
        catchError(this.handleError('LOAD TEAM AUTOMATION LIST', null))
      );
  }

  getDetailWithParentFolder(id: string): any {
    return this.httpClient
      .get(this.server + AUTOMATION.GET_PARENT_FOLDER + id)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new AutomationItem(e)
          );
          return {
            status: true,
            data: {
              results,
              folder: res?.['data']?.['folder'],
              prevFolder: res?.['data']?.['prevFolder']
            }
          };
        }),
        catchError(this.handleError('GET AUTOMATION LOCATIOM', null))
      );
  }
  getActiveCounts(data): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_ACTIVE_COUNTS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTOMATION GET ACTIVE COUNTS', null))
      );
  }
}
