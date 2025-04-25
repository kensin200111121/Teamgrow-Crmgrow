import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { THEME } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { Theme } from '@models/theme.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class ThemeService extends HttpService {
  newsletters: BehaviorSubject<any[]> = new BehaviorSubject([]);
  newsletters$ = this.newsletters.asObservable();

  newslettersLoading: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  newslettersLoading$ = this.newslettersLoading.asObservable();

  templates: BehaviorSubject<any[]> = new BehaviorSubject([]);
  templates$ = this.templates.asObservable();

  themes: BehaviorSubject<Theme[]> = new BehaviorSubject([]);
  themes$ = this.themes.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  constructor(private httpClient: HttpClient, errorService: ErrorService) {
    super(errorService);
  }

  public getNewsletters(force = false): Observable<any> {
    if (!force) {
      const loadStatus = this.newslettersLoading.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.newslettersLoading.next(STATUS.REQUEST);
    this.httpClient
      .get(this.server + THEME.NEWSLETTERS)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('LOADING NEWSLETTERS', []))
      )
      .subscribe((list) => {
        list
          ? this.newslettersLoading.next(STATUS.SUCCESS)
          : this.newslettersLoading.next(STATUS.FAILURE);
        this.newsletters.next(list || []);
      });
  }

  public getStandarTemplates(page: number, perPage: number): Observable<any> {
    return this.httpClient
      .post(this.server + THEME.STANDARD_TEMPLATES, { page, perPage })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING TEMPLATES', null))
      );
  }

  public getTemplate(id: string): Observable<any> {
    return this.httpClient
      .post(this.server + THEME.STANDARD_TEMPLATE, { id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING TEMPLATE', null))
      );
  }

  /**
   * LOAD ALL THEMES
   * @param force Flag to load force
   */

  getAllTheme(force = false): Observable<Theme[]> {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.getAllThemeImpl().subscribe((themes) => {
      themes
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.themes.next(themes || []);
    });
  }

  getAllThemeImpl(): Observable<Theme[]> {
    return this.httpClient.get(this.server + THEME.GET_THEME).pipe(
      map((res) => (res['data'] || []).map((e) => new Theme().deserialize(e))),
      catchError(this.handleError('LOAD THEMES', null))
    );
  }

  public getAllThemes(): Observable<any> {
    return this.httpClient.get(this.server + THEME.GET_THEME).pipe(
      map((res) => res),
      catchError(this.handleError('LOADING NEWSLETTERS'))
    );
  }

  public setTheme(data): Observable<any> {
    return this.httpClient.post(this.server + THEME.SET_THEME, data).pipe(
      map((res) => res),
      catchError(this.handleError('SET NEWSLETTERS'))
    );
  }
  public getTheme(id: string): Observable<any> {
    return this.httpClient.get(this.server + THEME.GET_THEME + id).pipe(
      map((res) => res),
      catchError(this.handleError('LOADING NEWSLETTER DETAIL'))
    );
  }
  public saveTheme(theme): Observable<any> {
    return this.httpClient.post(this.server + THEME.GET_THEME, theme).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE NEWSLETTERS'))
    );
  }
  public updateTheme(id: string, data: any): Observable<any> {
    return this.httpClient.put(this.server + THEME.GET_THEME + id, data);
  }
  deleteTheme(id: string): void {
    this.deleteImpl(id).subscribe((status) => {
      if (status === null) {
        return;
      }
      if (!status) {
        return;
      }
      const themes = this.themes.getValue();
      _.remove(themes, (e) => {
        return e._id === id;
      });
      this.themes.next(themes);
    });
  }

  deleteNewsletter(id: string): void {
    this.deleteImpl(id).subscribe((status) => {
      if (status) {
        const newsletters = this.newsletters.getValue();
        _.remove(newsletters, (e) => {
          return e._id === id;
        });
        this.newsletters.next([...newsletters]);
      }
    });
  }

  deleteImpl(id: string): Observable<Theme[]> {
    return this.httpClient.delete(this.server + THEME.GET_THEME + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE THEME', null))
    );
  }

  create$(template: any): void {
    const newsletters = this.newsletters.getValue();
    newsletters.push(template);
    this.newsletters.next([...newsletters]);
  }

  update$(id: string, data: any): void {
    const templates = this.newsletters.getValue();
    templates.some((e) => {
      if (e._id === id) {
        Object.assign(e, data);
        return true;
      }
    });
    if (data.templates) {
      this.newsletters.next([...templates]);
    }
  }

  public clear$(): void {
    this.newsletters.next([]);
    this.newslettersLoading.next(STATUS.NONE);
    this.themes.next([]);
    this.loadStatus.next(STATUS.NONE);
  }

  bulkRemove(ids): Observable<any> {
    return this.httpClient
      .post(this.server + THEME.BULK_REMOVE, { data: ids })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE TEMPLATE', false))
      );
  }

  reload(): void {
    this.loadOwn(true);
  }

  loadOwn(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadOwnImpl().subscribe((newsletters) => {
      newsletters
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.newsletters.next(newsletters || []);
    });
  }

  loadOwnImpl(): Observable<Theme[]> {
    return this.httpClient.get(this.server + THEME.GET_THEME).pipe(
      map((res) => (res['data'] || []).map((e) => new Theme().deserialize(e))),
      catchError(this.handleError('LOAD MY CAMPAIGN TEMPLATE', null))
    );
  }
}
