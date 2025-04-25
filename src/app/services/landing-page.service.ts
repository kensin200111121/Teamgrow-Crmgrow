import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { LANDINGPAGE } from '@constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class LandingPageService extends HttpService {
  constructor(private httpClient: HttpClient, errorService: ErrorService) {
    super(errorService);
  }

  public create(data: any): any {
    return this.httpClient.post(this.server + LANDINGPAGE.CREATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE LANDING PAGE'))
    );
  }

  public update(id: string, data: any): any {
    return this.httpClient.put(this.server + LANDINGPAGE.GET + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE LANDING PAGE'))
    );
  }

  public preview(data: any): any {
    return this.httpClient.post(this.server + LANDINGPAGE.PREVIEW, data).pipe(
      map((res) => res),
      catchError(this.handleError('PREVIEW LANDING PAGE'))
    );
  }

  public load(): Observable<any> {
    return this.httpClient.get(this.server + LANDINGPAGE.CREATE).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD LANDING PAGES'))
    );
  }

  public loadPublishedPages(): Observable<any> {
    return this.httpClient.get(this.server + LANDINGPAGE.GET_PUBLISHED).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PUBLISHED LANDING PAGES'))
    );
  }

  public loadUnpublishedPages(): Observable<any> {
    return this.httpClient.get(this.server + LANDINGPAGE.GET_UNPUBLISHED).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD UNPUBLISHED LANDING PAGES'))
    );
  }

  public loadTrackCounts(): Observable<any> {
    return this.httpClient
      .post(this.server + LANDINGPAGE.GET_TRACK_COUNT, {})
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD COUNT OF TRACKS'))
      );
  }

  public getById(id): Observable<any> {
    return this.httpClient.get(this.server + LANDINGPAGE.GET + id).pipe(
      map((res) => res),
      catchError(this.handleError('GET LANDING PAGE', null))
    );
  }

  public getFormTracksById(id, data): Observable<any> {
    return this.httpClient
      .post(this.server + LANDINGPAGE.GET_FORM_TRACKS + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET LANDING PAGE', null))
      );
  }

  public getMaterialTracksById(id, data): Observable<any> {
    return this.httpClient
      .post(this.server + LANDINGPAGE.GET_MATERIAL_TRACKS + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET LANDING PAGE', null))
      );
  }

  public delete(id: string): Observable<any> {
    return this.httpClient.delete(this.server + LANDINGPAGE.CREATE + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE LANDING PAGE', null))
    );
  }
}
