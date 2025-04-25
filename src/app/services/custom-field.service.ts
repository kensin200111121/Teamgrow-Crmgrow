import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { CUSTOM_FIELD } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { CustomField } from '@app/models/custom_field.model';

@Injectable({
  providedIn: 'root'
})
export class CustomFieldService extends HttpService {
  fields: BehaviorSubject<CustomField[]> = new BehaviorSubject([]);
  fields$ = this.fields.asObservable();

  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();

  dealFields: BehaviorSubject<CustomField[]> = new BehaviorSubject([]);
  dealFields$ = this.dealFields.asObservable();

  loadStatus2: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus2$ = this.loadStatus.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  loadFields(kind = 'contact', force = false): void {
    if (kind === 'contact') {
      this.loadContactFields(force);
    } else {
      this.loadDealFields(force);
    }
  }

  loadContactFields(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.getFields('contact').subscribe((fields) => {
      this.fields.next(fields);
      this.loadStatus.next(STATUS.SUCCESS);
    });
  }

  loadDealFields(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus2.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus2.next(STATUS.REQUEST);
    this.getFields('pipeline').subscribe((fields) => {
      this.dealFields.next(fields);
      this.loadStatus2.next(STATUS.SUCCESS);
    });
  }

  getFields(kind: string): Observable<CustomField[]> {
    return this.httpClient.get(this.server + CUSTOM_FIELD.GET + kind).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new CustomField().deserialize(e))
      ),
      catchError(this.handleError('GET CUSTOM FIELDS', []))
    );
  }

  createField(label: CustomField): Observable<CustomField> {
    return this.httpClient.post(this.server + CUSTOM_FIELD.CREATE, label).pipe(
      map((res) => new CustomField().deserialize(res['data'])),
      catchError(this.handleError('CREATE CUSTOM FIELD', null))
    );
  }

  updateField(id: string, label: any): Observable<boolean> {
    return this.httpClient.put(this.server + CUSTOM_FIELD.PUT + id, label).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('UPDATE CUSTOM FIELD', false))
    );
  }

  deleteFields(fields: string[]): Observable<boolean> {
    return this.httpClient
      .post(this.server + CUSTOM_FIELD.DELETES, { fields: fields })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DELETE MULTI CUSTOM FIELD', false))
      );
  }

  deleteField(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + CUSTOM_FIELD.DELETE + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE CUSTOM FIELD', false))
    );
  }

  clear$(): void {
    this.fields.next([]);
  }
}
