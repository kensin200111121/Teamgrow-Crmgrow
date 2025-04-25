import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ASSETS, FILE } from '@constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { StoreService } from '@services/store.service';

@Injectable({
  providedIn: 'root'
})
export class FileService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  attachImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const method = 'POST';
    return fetch(this.server + FILE.UPLOAD_IMAGE, {
      method,
      body: formData
    }).then((res) => res.json());
  }

  /**
   * Upload file
   * @param data
   */
  uploadFile(data) {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient.post(this.server + ASSETS.UPLOAD, data, {
      headers: reqHeader,
      reportProgress: true,
      observe: 'events'
    });
  }
}
