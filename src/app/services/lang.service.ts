import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';

@Injectable({
  providedIn: 'root'
})
export class LangService extends HttpService {
  lang: BehaviorSubject<string> = new BehaviorSubject(null);
  language$ = this.lang.asObservable();
  constructor(private httpClient: HttpClient, errorService: ErrorService) {
    super(errorService);
  }
  /**
   * Emit the language code
   * @param code: country code for language
   */
  changeLang(code: string): void {
    localStorage.setCrmItem('lang', code);
    this.lang.next(code);
  }

  public getCountry(): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'text/plain'
    });
    return this.httpClient
      .get('https://www.cloudflare.com/cdn-cgi/trace', {
        headers: reqHeader,
        responseType: 'text'
      })
      .pipe(map((res) => res));
  }
}
