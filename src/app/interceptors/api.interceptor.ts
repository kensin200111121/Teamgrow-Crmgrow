import {
  HttpInterceptor,
  HttpHandler,
  HttpEvent,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError, pipe } from 'rxjs';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private role = '';
  constructor(private userService: UserService) {
    this.userService.profile$.subscribe((user) => {
      this.role = user.role ? 'guest' : '';
    });
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      req.url.indexOf('https://api.vimeo.com/videos') !== -1 ||
      req.url.indexOf('https://www.googleapis.com/youtube') !== -1 ||
      req.url.indexOf(
        'https://f8nhu9b8o4.execute-api.us-east-2.amazonaws.com'
      ) !== -1 ||
      req.url.includes('sanity.io') ||
      req.url.includes('cloudflare.com') ||
      req.url.includes(environment.VORTEX_BASE + 'api') ||
      req.url.includes(environment.VORTEX_IDENTITY_BASE)
    ) {
      return next.handle(req);
    } else {
      if (req.url.indexOf('/assets/i18n') !== -1) {
        return next.handle(
          req.clone({
            url: environment.isSspa
              ? `WEBPACK_PUBLIC_PATH${req.url}`
              : `${environment.front}${req.url}`
          })
        );
      }
      if (!req.headers.has('Content-Type')) {
        if (!req.headers.has('No-Content')) {
          req = req.clone({
            setHeaders: {
              'Content-Type': 'application/json',
              'ngsw-bypass': 'true'
            }
          });
        }
      }
      if (!req.headers.has('No-Auth')) {
        req = req.clone({
          setHeaders: {
            Authorization: localStorage.getCrmItem('token'),
            Role: this.role,
            'ngsw-bypass': 'true'
          },
          withCredentials: true
        });
      }
      return next.handle(req).pipe(
        map((event: HttpEvent<any>) => {
          return event;
        }),
        catchError((error: HttpErrorResponse) => {
          return throwError(error);
        })
      );
    }
  }
}

/**
 * Error: code (400 - 500)
 * {
 *    message:
 *    code:
 *    error: string | array | object
 *    status: false
 * }
 */
