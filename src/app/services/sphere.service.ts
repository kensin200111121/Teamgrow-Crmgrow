import { Injectable } from '@angular/core';
import { HttpService } from '@services/http.service';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from './error.service';
import { BehaviorSubject, Observable, catchError, map } from 'rxjs';
import { Contact } from '@app/models/contact.model';
import { IBucket } from '@app/types/buckete';

@Injectable({
  providedIn: 'root'
})
export class SphereService extends HttpService {
  buckets: BehaviorSubject<any[]> = new BehaviorSubject([]);
  buckets$: Observable<any[]> = this.buckets.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);

    this.loadBuckets().subscribe((data) => {
      this.buckets.next(data);
    });
  }

  load(data: any): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + 'contact/load-conversation', data)
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) =>
            new Contact().deserialize({ ...e, ...e.contact })
          )
        ),
        catchError(this.handleError('LOAD SPHERE CONTACTS', []))
      );
  }

  markAsCompleted(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + 'contact/mark-as-completed', data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MARK AS COMPLETED', false))
      );
  }

  loadBuckets(): Observable<IBucket[]> {
    return this.httpClient.get(this.server + 'sphere_bucket').pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD SPHERE BUCKETS', []))
    );
  }

  createBucket(data: any): Observable<IBucket> {
    return this.httpClient.post(this.server + 'sphere_bucket', data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE SPHERE', null))
    );
  }

  updateBucket(id: string, data: any): Observable<boolean> {
    return this.httpClient.put(this.server + 'sphere_bucket/' + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE SPHERE BUCKET', null))
    );
  }

  removeBucket(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + 'sphere_bucket/' + id).pipe(
      map((res) => res['status']),
      catchError(this.handleError('DELETE SPHERE BUCKET', null))
    );
  }

  updateScores(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + 'sphere_bucket/score', data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE SPHERE SCORES', null))
    );
  }
}
