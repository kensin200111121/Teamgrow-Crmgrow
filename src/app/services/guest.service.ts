import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GUEST } from '@constants/api.constant';
import { Guest } from '@models/guest.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';

@Injectable({
  providedIn: 'root'
})
export class GuestService extends HttpService {
  constructor(errorService: ErrorService, private http: HttpClient) {
    super(errorService);
  }

  /**
   * Load Guests and return Guests Array Observable
   */
  loadGuests(): Observable<Guest[]> {
    return this.http.get(this.server + GUEST.LOAD).pipe(
      map((res) => (res['data'] || []).map((e) => new Guest().deserialize(e))),
      catchError(this.handleError('LOAD ASSISTANTS', []))
    );
  }
  /**
   * Return the Created Guest Object
   * @param guest : Guest Object
   */
  create(guest: Guest): Observable<Guest> {
    return this.http.post(this.server + GUEST.CREATE, guest).pipe(
      map((res) => new Guest().deserialize(res['data'])),
      catchError(this.handleError('CREATE ASSISTANTS', null))
    );
  }
  /**
   * Remove Guests and return status
   * @param _id: Guest id to delete
   */
  remove(_id: string): Observable<boolean> {
    return this.http.delete(this.server + GUEST.DELETE + _id).pipe(
      map((res) => (res['data'] ? true : false)),
      catchError(this.handleError('DELETE ASSISTANTS', false))
    );
  }
  /**
   * Update Guests and return status
   * @param _id : Guest id to update
   * @param guest : Guest data to update
   */
  update(_id: string, guest: Guest): Observable<boolean> {
    return this.http.put(this.server + GUEST.EDIT + _id, guest).pipe(
      map((res) => (res['data'] ? true : false)),
      catchError(this.handleError('UPDATE ASSISTANTS', false))
    );
  }
}
