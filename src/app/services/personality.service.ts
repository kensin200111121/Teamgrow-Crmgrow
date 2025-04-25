import { Injectable } from '@angular/core';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PERSONALITY } from '@constants/api.constant';
import { Personality } from '@models/personality.model';
import { map, catchError } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class PersonalityService extends HttpService {
  personalities: BehaviorSubject<Personality[]> = new BehaviorSubject([]);
  personalities$ = this.personalities.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }
  load(): void {
    this.loadImpl().subscribe((personalities) => {
      if (personalities?.length) this.personalities.next(personalities || []);
    });
  }

  loadImpl(): Observable<any> {
    return this.httpClient.get(this.server + PERSONALITY.LOAD).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Personality().deserialize(e))
      ),
      catchError(
        this.handleError('LOAD PERSONALITIES', { personalities: [], total: 0 })
      )
    );
  }

  create(person: Personality): void {
    this.createImpl(person).subscribe((res) => {
      if (res) {
        const person = res;
        const personalities = this.personalities.getValue();
        personalities.push(res);
        this.personalities.next(personalities);
      }
    });
  }
  createImpl(person: Personality): Observable<Personality> {
    return this.httpClient.post(this.server + PERSONALITY.CREATE, person).pipe(
      map((res) => new Personality().deserialize(res['data'])),
      catchError(this.handleError('PERSONALITY CREATE', null))
    );
  }

  update(id: string, person: Personality): void {
    this.updateImpl(id, person).subscribe((status) => {
      if (status === null) {
        return;
      }
      if (!status) {
        return;
      }
      const personalities = this.personalities.getValue();
      personalities.some((e) => {
        if (e._id === id) {
          Object.assign(e, person);
          return true;
        }
      });
      this.personalities.next(personalities);
    });
  }

  updateImpl(id: string, person: Personality): Observable<any> {
    return this.httpClient.put(this.server + PERSONALITY.PUT + id, person).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('PERSONALITY UPDATE', false))
    );
  }

  delete(id: string): void {
    this.deleteImpl(id).subscribe((status) => {
      if (status === null) {
        return;
      }
      if (!status) {
        return;
      }
      const personalities = this.personalities.getValue();
      _.remove(personalities, (e) => {
        return e._id === id;
      });
      this.personalities.next(personalities);
    });
  }
  deleteImpl(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + PERSONALITY.DELETE + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE LABEL', false))
    );
  }
}
