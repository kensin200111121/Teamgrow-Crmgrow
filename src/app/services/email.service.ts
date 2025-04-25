import { Injectable } from '@angular/core';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '@services/store.service';
import { Observable } from 'rxjs';
import { DRAFT, SEND, VIDEO, EMAIL } from '@constants/api.constant';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmailService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  send(mail, mailType = 'email'): Observable<any[]> {
    const type = mailType.toUpperCase();
    return this.httpClient.post(this.server + SEND[type], mail).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('SEND EMAIL OF AFFILIATE', []))
    );
  }

  shareUrl(body): Observable<any[]> {
    return this.httpClient.post(this.server + SEND.SHARE, body).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('SHARE URL OF AFFILIATE', []))
    );
  }

  sendMaterial(
    materials: any,
    materialType: string,
    mediaType: string,
    media: any,
    contacts: any
  ): any {
    let materialsArray = [];
    if (materialType === 'video') {
      materials.forEach((e) => {
        materialsArray.push(e._id);
      });
    } else {
      materialsArray = materials;
    }
    const apiName = (materialType + '_' + mediaType).toUpperCase();
    const materialParamName = materialType + 's';
    const api = SEND[apiName];
    const param = {
      subject: media.subject,
      content: media.content,
      contacts,
      [materialParamName]: materialsArray
    };
    return this.httpClient.post(this.server + api, param).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('SEND MATERIAL OF AFFILIATE', []))
    );
  }

  sendEmail(data): Observable<any> {
    return this.httpClient.post(this.server + SEND.SEND_EMAIL, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEND EMAIL OF CANCELING CALL', []))
    );
  }

  createDraft(data): Observable<any> {
    return this.httpClient.post(this.server + DRAFT.CREATE, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('CREATE DRAFT', []))
    );
  }

  getDraft(data): Observable<any> {
    return this.httpClient.post(this.server + DRAFT.GET, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DRAFT', []))
    );
  }

  updateDraft(id, data): Observable<any> {
    return this.httpClient.put(this.server + DRAFT.UPDATE + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE DRAFT', []))
    );
  }

  removeDraft(id): Observable<any> {
    return this.httpClient.delete(this.server + DRAFT.REMOVE + id).pipe(
      map((res) => res),
      catchError(this.handleError('REMOVE DRAFT', []))
    );
  }
  getGmailMessage(id): Observable<any> {
    return this.httpClient.get(this.server + EMAIL.GET_GMAIL_MESSAGE + id).pipe(
      map((res) => res),
      catchError(this.handleError('GETEMAIL MESSAGE', []))
    );
  }
  getGmailAttachment(data): Observable<any> {
    return this.httpClient
      .post(this.server + EMAIL.GET_GMAIL_ATTACHMENT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GETEMAIL ATTACHMENT', []))
      );
  }
}
