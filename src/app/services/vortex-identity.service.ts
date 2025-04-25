import { Injectable } from '@angular/core';
import { HttpService } from '@services/http.service';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from './error.service';
import { environment } from '@environments/environment';
import { Courses } from '@app/models/courses.model.js';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VortexIdentityService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  loadCourses(): Observable<Courses[]> {
    return this.httpClient
      .get(environment.VORTEX_IDENTITY_BASE + 'users/thinkific-courses', {
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      .pipe(
        map((res) => {
          console.log('response', res);
          return res['courses'];
        }),
        catchError((error) => {
          if (error.status !== 404) {
            this.handleError('LOAD THINKIFIC COURSES', []);
          }
          return of([]);
        })
      );
  }

  loadUniversityJwt(): Observable<{ jwt: string }> {
    return this.httpClient
      .get(environment.VORTEX_IDENTITY_BASE + 'users/redx-university-jwt', {
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      .pipe(
        map((res) => res['jwt']),
        catchError(this.handleError('LOAD UNIVERSITY JWT', []))
      );
  }
}
