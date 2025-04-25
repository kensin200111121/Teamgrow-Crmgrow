import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ASSETS } from '@constants/api.constant';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {
  constructor(private httpClient: HttpClient) {}

  loadAssets(page) {
    return this.httpClient.get(environment.api + ASSETS.LOAD + page);
  }

  updateAsset(data) {
    return this.httpClient.post(environment.api + ASSETS.UDPATE, data);
  }

  createAsset(data) {
    return this.httpClient.post(environment.api + ASSETS.CREATE, data);
  }

  replaceAsset(data) {
    return this.httpClient.post(environment.api + ASSETS.REPLACE, data);
  }

  deleteAssets(ids) {
    return this.httpClient.post(environment.api + ASSETS.DELETE, { ids });
  }
}
