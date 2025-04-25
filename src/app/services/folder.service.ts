import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FOLDER } from '@app/constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FolderService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  getParentFolders(data): Observable<any> {
    return this.httpClient
      .post(this.server + FOLDER.GET_ALL_PARENTS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET ALL PARENTS', null))
      );
  }
}
