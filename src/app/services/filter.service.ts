import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FILTER } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService extends HttpService {
  constructor(errorService: ErrorService, private http: HttpClient) {
    super(errorService);
  }

  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  loadSubscription: Subscription;
  filters: BehaviorSubject<any[]> = new BehaviorSubject([]);
  filters$ = this.filters.asObservable();

  loadAll(): void {
    const loadStatus = this.loadStatus.getValue();
    if (loadStatus === STATUS.NONE) {
      this.loadStatus.next(STATUS.REQUEST);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.loadAllImpl().subscribe((filters) => {
        this.loadStatus.next(STATUS.SUCCESS);
        this.filters.next(filters);
      });
    }
  }

  loadAllImpl(): Observable<any> {
    return this.http.get(this.server + FILTER.API).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD FILTERS', []))
    );
  }

  create(data): Observable<any> {
    return this.http.post(this.server + FILTER.API, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE FILTER', null))
    );
  }

  create$(data): void {
    const filters = this.filters.getValue();
    filters.push(data);
    this.filters.next(filters);
  }

  update(_id: string, data: any): Observable<any> {
    return this.http.put(this.server + FILTER.API + _id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE FILTER', null))
    );
  }

  update$(_id: string, data: any): void {
    const filters = this.filters.getValue();
    filters.some((e) => {
      if (e._id === _id) {
        e.content = data.content;
        e.description = data.description;
        e.title = data.title;
        e.type = data.type;
        return true;
      }
    });
    this.filters.next(filters);
  }

  remove(_id: string): Observable<boolean> {
    return this.http.delete(this.server + FILTER.API + _id).pipe(
      map((res) => res['status']),
      catchError(this.handleError('REMOVE FILTER', false))
    );
  }

  remove$(_id: string): void {
    const filters = this.filters.getValue();
    filters.some((e, index) => {
      if (e._id === _id) {
        filters.splice(index, 1);
        return true;
      }
    });
    this.filters.next(filters);
  }

  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
  }
}
