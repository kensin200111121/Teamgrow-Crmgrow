import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { STATUS } from '@constants/variable.constants';
import { AgentFilter } from '@app/models/agent-filter.model';
import { AGENTFILTER } from '@app/constants/api.constant';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class AgentFilterService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  filters: BehaviorSubject<AgentFilter[]> = new BehaviorSubject([]);
  filters$ = this.filters.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();

  load(): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.get().subscribe((filters) => {
      if (filters) this.loadStatus.next(STATUS.SUCCESS);
      else this.loadStatus.next(STATUS.FAILURE);

      this.filters.next(filters);
    });
  }

  get(): Observable<AgentFilter[]> {
    return this.httpClient.get(this.server + AGENTFILTER.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new AgentFilter().deserialize(e))
      ),
      catchError(this.handleError('GET AGENT FILTER', []))
    );
  }

  create(data: AgentFilter): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.createImpl(data).subscribe((res) => {
      if (res) {
        this.loadStatus.next(STATUS.SUCCESS);
        const filterList = this.filters.getValue();
        filterList.push(res);
        this.filters.next(filterList);
      }
    });
  }

  createImpl(data: AgentFilter): Observable<AgentFilter> {
    return this.httpClient.post(this.server + AGENTFILTER.GET, data).pipe(
      map((res) => new AgentFilter().deserialize(res['data'])),
      catchError(this.handleError('CREATE AGENT FILTER', null))
    );
  }

  update(data: AgentFilter): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.updateImpl(data).subscribe((status) => {
      if (status === null) {
        this.loadStatus.next(STATUS.FAILURE);
        return;
      }
      if (!status) {
        this.loadStatus.next(STATUS.FAILURE);
        return;
      }
      this.loadStatus.next(STATUS.SUCCESS);
      const filterList = this.filters.getValue();
      filterList.some((e) => {
        if (e._id === data._id) {
          Object.assign(e, data);
          return true;
        }
      });
      this.filters.next(filterList);
    });
  }

  updateImpl(data: AgentFilter): Observable<any> {
    return this.httpClient
      .put(this.server + AGENTFILTER.GET + data._id, data)
      .pipe(
        map((res) => res['status'] || false),
        catchError(this.handleError('UPDATE AGENT FILTER', null))
      );
  }

  delete(id: string): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.deleteImpl(id).subscribe((status) => {
      if (status === null) {
        this.loadStatus.next(STATUS.FAILURE);
        return;
      }
      if (!status) {
        this.loadStatus.next(STATUS.FAILURE);
        return;
      }
      this.loadStatus.next(STATUS.SUCCESS);
      const filterList = this.filters.getValue();
      _.remove(filterList, (e) => {
        return e._id === id;
      });
      this.filters.next(filterList);
    });
  }

  deleteImpl(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + AGENTFILTER.GET + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE AGENT FILTER', null))
    );
  }
}
