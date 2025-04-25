import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PipelineType, ResourceCategory } from '@core/enums/resources.enum';
import {
  FilterParam,
  FolderResponse,
  PipelineItem,
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
export class PipelineListService extends ResourceListService<
  PipelineItem,
  PipelineType
> {
  protected ownHistory: StoredResources<PipelineItem>;
  protected libraryHistory: StoredResources<PipelineItem>;
  protected teamHistory: StoredResources<PipelineItem>;
  protected listEndpointBase = 'pipe/';
  protected teamListEndpointBase = 'team/pipeline/';
  protected listpageOptionkey: string = KEY.MATERIALS_LIST.PAGE_OPTION;
  protected libpageOptionkey: string = KEY.MATERIALS_LIBRARY.PAGE_OPTION;
  protected teampageOptionkey: string = KEY.MATERIALS_LIBRARY.PAGE_OPTION;
  constructor(errorService: ErrorService, httpClient: HttpClient) {
    super(errorService, httpClient);
    this.loadPageOption();
  }

  loadOwnList(
    param: FilterParam<PipelineType>
  ): Observable<ResourceResponse<PipelineItem>> {
    return this.httpClient.get(this.server + this.listEndpointBase).pipe(
      map((res) => {
        const results = (res?.['data'] || '').map((e) => new PipelineItem(e));
        return {
          status: true,
          data: {
            results,
            prevFolder: res?.['data']?.['prevFolder'],
            currentFolder: res?.['data']?.['currentFolder']
          }
        };
      }),
      catchError(this.handleError('LOAD OWN AUTOMATION LIST', null))
    );
  }

  loadLibraryList(
    param: FilterParam<PipelineType>
  ): Observable<ResourceResponse<PipelineItem>> {
    return this.httpClient
      .post(this.server + this.listEndpointBase + 'load-library', param)
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new PipelineItem(e)
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
        catchError(this.handleError('LOAD PIPELINE LIBRARY LIST', null))
      );
  }

  loadTeamList(
    param: FilterParam<PipelineType>,
    teamId: string
  ): Observable<ResourceResponse<PipelineItem>> {
    return this.httpClient
      .post(this.server + this.teamListEndpointBase, { ...param, teamId })
      .pipe(
        map((res) => {
          const results = (res?.['data']?.['results'] || '').map(
            (e) => new PipelineItem(e)
          );
          return {
            status: true,
            data: {
              results,
              prevFolder: res?.['data']?.['prevFolder']
            }
          };
        }),
        catchError(this.handleError('LOAD TEAM PIPELINE LIST', null))
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
}
