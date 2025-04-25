import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { TAG } from '@constants/api.constant';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { STATUS } from '@constants/variable.constants';

@Injectable({
  providedIn: 'root'
})
export class TagService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }
  tags: BehaviorSubject<any[]> = new BehaviorSubject([]);
  tags$ = this.tags.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  sources: BehaviorSubject<any[]> = new BehaviorSubject([]);
  sources$ = this.sources.asObservable();
  filteredResult: BehaviorSubject<any[]> = new BehaviorSubject([]);
  filteredResult$ = this.filteredResult.asObservable();

  companies: BehaviorSubject<any[]> = new BehaviorSubject([]);
  companies$ = this.companies.asObservable();

  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();
  loadDetailStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadDetailStatus$ = this.loadDetailStatus.asObservable();

  /**
   * Get All Tags
   */
  public getAllTagsImpl(): Observable<string[]> {
    return this.httpClient.get(this.server + TAG.ALL).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ALL TAGS', []))
    );
  }

  /**
   * Get All Tags and Set the Observable Data
   */
  public getAllTags(force: boolean = true): void {
    if (
      !force &&
      this.loadStatus.getValue() === STATUS.SUCCESS &&
      this.tags.getValue().length
    ) {
      return;
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.getAllTagsImpl().subscribe((tags) => {
      tags
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      const tagsList = [];
      tags.forEach((e) => {
        const item = Object.assign({}, e);
        tagsList.push(item);
      });
      let pos = 0;
      pos = tagsList.findIndex((tag) => tag._id == 'lead capture');
      if (pos === -1) {
        tagsList.unshift({ _id: 'lead capture', count: 0 });
      }
      this.tags.next(_.uniqBy(tagsList, '_id'));
    });
  }

  public getAllTagsForTeam(): Observable<any[]> {
    return this.httpClient.get(this.server + TAG.TEAM).pipe(
      map((res) => {
        const tags = res['data'] || [];
        const pos = tags.findIndex((tag) => tag._id == 'lead capture');
        if (pos === -1) {
          tags.unshift({ _id: 'lead capture', count: 0 });
        }
        return tags;
      }),
      catchError(this.handleError('LOAD ALL TAGS FOR TEAM', []))
    );
  }

  createTag(tag: any): Observable<any> {
    return this.httpClient.post(this.server + TAG.CREATE, { tag }).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE TAG', null))
    );
  }

  public loadTagContacts(
    tag: string,
    page: number,
    pageSize: number,
    searchStr: string
  ): Observable<any> {
    this.loadDetailStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + TAG.LOAD_CONTACTS, { tag, page, pageSize, searchStr })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD TAG CONTACTS', []))
      );
  }

  public loadAllContacts(page: number): Observable<any> {
    return this.httpClient
      .post(this.server + TAG.LOAD_ALL_CONTACTS, { page })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD TAG CONTACTS', []))
      );
  }
  /**
   * Get All Sources
   */
  public getAllSourcesImpl(): Observable<string[]> {
    return this.httpClient.get(this.server + TAG.LOAD_SOURCES).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ALL SOURCES', []))
    );
  }

  /**
   * Get All Sources and Set the Observable Data
   */
  public getAllSources(): void {
    this.getAllSourcesImpl().subscribe((tags) => {
      this.sources.next(tags);
    });
  }

  /**
   * Get All Brokerage
   */
  public getAllCompaniesImpl(): Observable<string[]> {
    return this.httpClient.get(this.server + TAG.LOAD_COMPANIES).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD ALL COMPANIES', []))
    );
  }

  /**
   * Get All Tags and Set the Observable Data
   */
  public getAllCompanies(): void {
    this.getAllCompaniesImpl().subscribe((tags) => {
      this.companies.next(tags);
    });
  }

  /**
   * Update the List with New Tags List
   */
  public mergeList(tags: string[]): void {
    const existings = this.tags.getValue();
    const news = _.difference(tags, existings);
    const newJoined = _.concat(existings, news);
    this.tags.next(newJoined);
  }

  /**
   * Tag Update
   * @param oldTag : Old Tag Name(String)
   * @param newTag : New Tag Name(String)
   */
  public tagUpdate(oldTag: string, newTag: string): any {
    const data = {
      oldTag: oldTag,
      newTag: newTag
    };
    return this.httpClient.post(this.server + TAG.UPDATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE TAG', null))
    );
  }

  /**
   * Delte the Tag
   * @param tagName : Tag Name to Delete (string)
   */
  public tagDelete(tagName: string): any {
    const data = {
      tag: tagName
    };
    return this.httpClient.post(this.server + TAG.DELETE, data).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE TAG', null))
    );
  }

  /**
   * Delte the Tag
   * @param tags : Tag Ids to Delete (string[])
   */
  public tagsDelete(tags: string[]): any {
    const data = {
      tags: tags
    };
    return this.httpClient.post(this.server + TAG.MULTI_DELETE, data).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE TAG', null))
    );
  }

  /**
   * Merge the tag
   * @param mergeTags : the tags will be merged
   * @param mergeTo : the tag which rests will be merged to
   * @returns : mergeTo value
   */
  public tagMerge(mergeTags: string[], mergeTo: string): any {
    const data = { mergeTags: mergeTags, mergeTo: mergeTo };
    return this.httpClient.post(this.server + TAG.MERGE, data).pipe(
      map((res) => res),
      catchError(this.handleError('MERGE TAG', null))
    );
  }

  public tagContactDelete(tagName: string, contactId: string): any {
    const data = {
      tag: tagName,
      contact: contactId
    };
    return this.httpClient.post(this.server + TAG.DELETE, data).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE TAG CONTACT', null))
    );
  }

  clear$(): void {
    this.tags.next([]);
    this.sources.next([]);
    this.companies.next([]);
    this.loadStatus.next(STATUS.NONE);
  }
}
