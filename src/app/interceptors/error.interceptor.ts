import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { environment } from '@environments/environment';
import * as Sentry from '@sentry/angular-ivy';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone) {}

  handleError(error: any) {
    // Check if it's an error from an HTTP response
    if (!environment.production) {
      console.error('Global error handler caught this. ', error.message);
    }
    const userId = localStorage.getCrmItem('u_id') || 'not_found';
    const errorData = error.originalError || error.error || error;
    Sentry.captureException(errorData, {
      user: {
        id: userId
      },
      extra: {
        isVortex: environment.isSspa
      }
    });
  }
}
