import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MaterialType, ResourceCategory } from '@core/enums/resources.enum';
import {
  FilterParam,
  FolderResponse,
  MaterialItem,
  ResourceResponse,
  StoredResources
} from '@core/interfaces/resources.interface';
import { ResourceListService } from '@services/resource-list.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { KEY } from '@constants/key.constant';
@Injectable({
  providedIn: 'root'
})
export class MaterialListService extends ResourceListService<
  MaterialItem,
  MaterialType
> {
  protected ownHistory: StoredResources<MaterialItem>;
  protected libraryHistory: StoredResources<MaterialItem>;
  protected teamHistory: StoredResources<MaterialItem>;
  protected listEndpointBase = 'material/';
  protected teamListEndpointBase = 'team/material/';
  protected listpageOptionkey: string = KEY.MATERIALS_LIST.PAGE_OPTION;
  protected libpageOptionkey: string = KEY.MATERIALS_LIBRARY.PAGE_OPTION;
  protected teampageOptionkey: string = KEY.MATERIALS_LIBRARY.PAGE_OPTION;
  constructor(errorService: ErrorService, httpClient: HttpClient) {
    super(errorService, httpClient);
    this.loadPageOption();
  }
  loadOwnList(
    param: FilterParam<MaterialType>
  ): Observable<ResourceResponse<MaterialItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-own', param)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new MaterialItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder'],
              currentFolder: res?.['data']?.['currentFolder']
            }
          };
        }),
        catchError(this.handleError('LOAD OWN MATERIAL LIST', null))
      );
  }

  loadLibraryList(
    param: FilterParam<MaterialType>
  ): Observable<ResourceResponse<MaterialItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-library', param)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new MaterialItem(e)
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
        }),
        catchError(this.handleError('LOAD MATERIAL LIBRARY LIST', null))
      );
  }

  loadTeamList(
    param: FilterParam<MaterialType>,
    teamId: string
  ): Observable<ResourceResponse<MaterialItem>> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase, { ...param, teamId })
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new MaterialItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder']
            }
          };
        }),
        catchError(this.handleError('LOAD TEAM MATERIAL LIST', null))
      );
  }

  loadFolder(
    type: ResourceCategory,
    folder: string
  ): Observable<FolderResponse> {
    return this.httpClient
      .get(
        this.server + 'material/folders' + '?' + `type=${type}&folder=${folder}`
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD FOLDER LIST', null))
      );
  }

  moveFiles(files, target: string, source: string): Observable<boolean> {
    return this.httpClient
      .post(this.server + 'material/move', { files, target, source })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('LOAD FOLDER LIST', null))
      );
  }

  loadViews(_ids: any): any {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-views', _ids)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new MaterialItem(e)
          );
          return {
            status: true,
            data: {
              results
            }
          };
        }),
        catchError(this.handleError('LOAD OWN MATERIAL VIEWS', null))
      );
  }
}
