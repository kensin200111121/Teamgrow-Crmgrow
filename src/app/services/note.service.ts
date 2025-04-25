import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NOTE } from '@constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { StoreService } from '@services/store.service';

@Injectable({
  providedIn: 'root'
})
export class NoteService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  create(data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + NOTE.CREATE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('NOTE CREATE', null))
      );
  }

  /**
   * Create the notes for bulk contacts
   * @param data : {title: string, content: string, contacts: contact ids array}
   */
  bulkCreate(data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + NOTE.BULK_CREATE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('BULK NOTE CREATE', false))
      );
  }

  update(id: string, data: any): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .put(this.server + NOTE.UPDATE + id, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('NOTE UPDATE', false))
      );
  }

  delete(id: string, data: any): Observable<boolean> {
    return this.httpClient.post(this.server + NOTE.DELETE + id, data).pipe(
      map((res) => res['lastActivity']),
      catchError(this.handleError('NOTE DELETE', false))
    );
  }
}
