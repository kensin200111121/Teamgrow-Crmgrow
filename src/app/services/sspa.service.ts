import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * Prefix image assets with absolute domain path
 *
 * WEBPACK_PUBLIC_PATH will be replaced with an actual baseUrl
 * during the sspa webpack build process. The value is obtained
 * by weback from looking at the process.env.WEBPACK_PUBLIC_PATH
 * during the build process. If it's not set, the default
 * value will be http://localhost:4200
 **/
@Injectable({
  providedIn: 'root'
})
export class SspaService {

  toAsset(path: string): string {
    return environment.isSspa
      ? `WEBPACK_PUBLIC_PATH/assets/${path}`
      : `/assets/${path}`;
  }

  imgError(event: any, path: string): void {
    event.target.src = this.toAsset(path);
  }
}
