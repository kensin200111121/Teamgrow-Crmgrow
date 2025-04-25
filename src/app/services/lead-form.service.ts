import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { STATUS } from '@constants/variable.constants';
import { environment } from '@environments/environment';
import { LEADFORM } from '@app/constants/api.constant';
import { LeadForm } from '@app/models/lead-form.model';
import * as _ from 'lodash';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LeadFormService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }
  forms: BehaviorSubject<LeadForm[]> = new BehaviorSubject([]);
  forms$ = this.forms.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();
  formList: BehaviorSubject<LeadForm[]> = new BehaviorSubject([]); // this will be used in the picker and other related part
  formList$ = this.formList.asObservable();

  editFormData: { type: string; form: LeadForm };

  getEditForm() {
    return this.editFormData;
  }

  setEditForm(value: { type: string; form: LeadForm }) {
    this.editFormData = value;
  }

  load(): void {
    this.loadStatus.next(STATUS.REQUEST);
    // Fetch the forms
    this.get()
      .pipe(
        switchMap((forms) => {
          if (!forms) {
            this.loadStatus.next(STATUS.FAILURE);
            return []; // No forms found, return an empty array
          }

          // Then, get tracking counts for this user
          return this.getTrackingCount().pipe(
            map((trackingData) => {
              // Merge forms with their corresponding tracking count
              return forms.map((form) => {
                const trackingInfo = trackingData.find(
                  (t) => t._id === form._id
                );
                return {
                  ...form,
                  trackerCount: trackingInfo ? trackingInfo.trackingCount : 0
                };
              });
            })
          );
        })
      )
      .subscribe(
        (mergedForms) => {
          this.loadStatus.next(STATUS.SUCCESS);
          this.forms.next(mergedForms); // Update the forms with the merged data
        },
        (error) => {
          this.loadStatus.next(STATUS.FAILURE);
          console.error('Error loading forms with tracking count:', error);
        }
      );
  }

  /**
   * This load the lead forms and set as data
   */
  loadList(): void {
    this.get().subscribe((forms) => {
      this.formList.next(forms);
    });
  }

  get(): Observable<LeadForm[]> {
    return this.httpClient.get(environment.api + LEADFORM.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new LeadForm().deserialize(e))
      ),
      catchError(this.handleError('GET LEAD FORM', null))
    );
  }

  getForm(id: string): Observable<any> {
    return this.httpClient.get(environment.api + LEADFORM.GET + id).pipe(
      map((res) => res),
      catchError(this.handleError('GET LEAD FORM', null))
    );
  }

  getFormDetailWithHistory(id: string, data): Observable<any> {
    return this.httpClient
      .post(environment.api + LEADFORM.GET_DETAIL_WITH_HISTORY + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET LEAD FORM', null))
      );
  }

  create(data: LeadForm): void {
    this.createImpl(data).subscribe((res) => {
      if (res) {
        const formList = this.forms.getValue();
        formList.push(res);
        this.forms.next(formList);
      }
    });
  }

  createImpl(data: LeadForm): Observable<LeadForm> {
    return this.httpClient.post(this.server + LEADFORM.GET, data).pipe(
      map((res) => new LeadForm().deserialize(res['data'])),
      catchError(this.handleError('CREATE LEAD FORM', null))
    );
  }

  update(data: LeadForm): void {
    this.updateImpl(data).subscribe((status) => {
      if (status === null) {
        return;
      }
      if (!status) {
        return;
      }
      const formList = this.forms.getValue();
      formList.some((e) => {
        if (e._id === data._id) {
          Object.assign(e, data);
          return true;
        }
      });
      this.forms.next(formList);
    });
  }

  updateImpl(data: LeadForm): Observable<any> {
    const req = { ...data };
    delete req['_id'];
    return this.httpClient.put(this.server + LEADFORM.GET + data._id, req).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('UPDATE LEAD FORM', null))
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
      const formList = this.forms.getValue();
      _.remove(formList, (e) => {
        return e._id === id;
      });
      this.forms.next(formList);
    });
  }

  deleteImpl(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + LEADFORM.GET + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE LEAD FORM', null))
    );
  }

  // New method to get tracking count for a form
  getTrackingCount(): Observable<{ _id: string; trackingCount: number }[]> {
    return this.httpClient
      .get<number>(environment.api + LEADFORM.GET_HISTORY_COUNT)
      .pipe(
        map((res) => res['data'] || []), // Assuming the API returns the count in 'count'
        catchError(this.handleError('GET TRACKING COUNT', 0)) // Default to 0 on error
      );
  }
}
