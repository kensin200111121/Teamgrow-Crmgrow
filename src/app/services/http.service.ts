import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '@environments/environment';
import { Strings } from '@constants/strings.constant';
import { ErrorService } from '@services/error.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  public server = environment.api;
  public automation_server = environment.automation_api;
  constructor(private errorService: ErrorService) {}

  handleError<T>(
    operation = 'Server Connection',
    result?: T,
    returnError = false,
    disableErrorHandler = false
  ) {
    return (error: any): Observable<T> => {
      // error message add to the Error Service
      !disableErrorHandler && this.errorService.addError(operation, error);
      // Inspect the error
      // default data observable
      if (returnError) {
        return of({ ...error.error, statusCode: error.status } as T);
      } else {
        return of(result as T);
      }
      // TODO: return the error object to show the error result
    };
  }

  handleSuccess<T>(operation = Strings.REQUEST_SUCCESS, result?: T) {
    return (): Observable<T> => {
      console.log(operation);
      // error message add to the Error Service
      this.errorService.showSuccess(operation);
      // Inspect the error
      // default data observable
      return of(result as T);
      // TODO: return the error object to show the error result
    };
  }
}
