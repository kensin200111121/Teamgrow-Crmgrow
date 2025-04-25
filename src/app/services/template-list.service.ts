import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateType } from '@core/enums/resources.enum';
import {
  FilterParam,
  TemplateItem,
  ResourceResponse,
  StoredResources,
  ITemplateItem
} from '@core/interfaces/resources.interface';
import { ResourceListService } from '@services/resource-list.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { TEMPLATE } from '@constants/api.constant';
import { KEY } from '@constants/key.constant';
@Injectable({
  providedIn: 'root'
})
export class TemplateListService extends ResourceListService<
  TemplateItem,
  TemplateType
> {
  protected ownHistory: StoredResources<TemplateItem>;
  protected libraryHistory: StoredResources<TemplateItem>;
  protected teamHistory: StoredResources<TemplateItem>;
  protected listEndpointBase = 'template/';
  protected teamListEndpointBase = 'team/template/';
  protected listpageOptionkey: string = KEY.TEMPLATES.LIST_PAGE_OPTION;
  protected libpageOptionkey: string = KEY.TEMPLATES.LIB_PAGE_OPTION;
  protected teampageOptionkey: string = KEY.TEMPLATES.LIB_PAGE_OPTION;
  constructor(errorService: ErrorService, httpClient: HttpClient) {
    super(errorService, httpClient);
    this.loadPageOption();
  }

  formatResponse(
    res: ResourceResponse<ITemplateItem>
  ): ResourceResponse<TemplateItem> {
    const results = (res?.['data']?.['results']).map(
      (e: ITemplateItem) => new TemplateItem(e)
    );
    return {
      status: true,
      data: {
        results,
        prevFolder: res?.['data']?.['prevFolder'],
        team: res?.['data']?.['team'],
        currentFolder: res?.['data']?.['currentFolder']
      }
    };
  }

  loadOwnList(
    param: FilterParam<TemplateType>
  ): Observable<ResourceResponse<TemplateItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-own', param)
      .pipe(
        map((res: ResourceResponse<ITemplateItem>) => this.formatResponse(res)),
        catchError(this.handleError('LOAD OWN AUTOMATION LIST', null))
      );
  }

  loadLibraryList(
    param: FilterParam<TemplateType>
  ): Observable<ResourceResponse<TemplateItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-library', param)
      .pipe(
        map((res: ResourceResponse<ITemplateItem>) => this.formatResponse(res)),
        catchError(this.handleError('LOAD AUTOMATION LIBRARY LIST', null))
      );
  }

  loadTeamList(
    param: FilterParam<TemplateType>,
    teamId: string
  ): Observable<ResourceResponse<TemplateItem>> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase, { ...param, teamId })
      .pipe(
        map((res: ResourceResponse<ITemplateItem>) => this.formatResponse(res)),
        catchError(this.handleError('LOAD TEAM TEMPLATE LIST', null))
      );
  }

  deleteTemplates(folder: string, ids: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + TEMPLATE.BULK_REMOVE, { folder, ids })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE TEMPLATES', null))
      );
  }
}
