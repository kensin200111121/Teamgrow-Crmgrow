import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { Label } from '@models/label.model';
import { LABEL } from '@constants/api.constant';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { STATUS } from '@constants/variable.constants';
import { LabelItem } from '@utils/data.types';
import { Contact } from '@models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService extends HttpService {
  labels: BehaviorSubject<Label[]> = new BehaviorSubject([]);
  labels$ = this.labels.asObservable();
  allLabels: BehaviorSubject<Label[]> = new BehaviorSubject([]);
  allLabels$ = this.allLabels.asObservable();
  labelItems: BehaviorSubject<LabelItem[]> = new BehaviorSubject([]);
  labelItems$ = this.labelItems.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  //Subscribe to open Manage Label Panel
  manageLabel: BehaviorSubject<boolean> = new BehaviorSubject(false);
  manageLabel$ = this.manageLabel.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();
  loadDetailStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadDetailStatus$ = this.loadDetailStatus.asObservable();
  filteredResult: BehaviorSubject<any[]> = new BehaviorSubject([]);
  filteredResult$ = this.filteredResult.asObservable();
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  loadLabels(): void {
    this.getLabels().subscribe((labels) => {
      this.labels.next(labels);
      const currentAllLabels = this.allLabels.getValue();
      labels.forEach((e) => {
        if (e.role !== 'admin') {
          e.mine = true;
        }
      });
      this.allLabels.next([...currentAllLabels, ...labels]);
    });
    this.getSharedLabels().subscribe((shared_labels) => {
      const currentAllLabels = this.allLabels.getValue();
      this.allLabels.next([...currentAllLabels, ...shared_labels]);
    });
  }

  // getAllLabels(force: boolean = true): void {
  //   this.getLabelsWithCount().subscribe((labels) => {
  //     labels
  //       ? this.loadStatus.next(STATUS.SUCCESS)
  //       : this.loadStatus.next(STATUS.FAILURE);
  //     this.labelItems.next(labels);
  //   });
  // }

  loadLabelsWithCount(): void {
    this.loadLabelsWithContacts().subscribe((labels) => {
      if (labels) this.loadStatus.next(STATUS.SUCCESS);
      else this.loadStatus.next(STATUS.FAILURE);

      this.labelItems.next(labels);
    });
  }

  loadLabelsWithContacts(): Observable<LabelItem[]> {
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient.get(this.server + LABEL.LOAD_WITH_CONTACTS).pipe(
      map((res) =>
        (res['data'] || []).map((e) => {
          const labelItem: LabelItem = {
            label: new Label().deserialize({ ...e, count: e.contacts }),
            contacts: []
          };
          return labelItem;
        })
      ),
      catchError(this.handleError('LOAD LABELS WITH CONTACTS', []))
    );
  }

  getLabelsWithCount(): Observable<Label[]> {
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient.get(this.server + LABEL.LOAD).pipe(
      map((res) =>
        (res['data'] || []).map((e) =>
          new Label().deserialize({ ...e, ...e.detail })
        )
      ),
      catchError(this.handleError('LOAD LABELS', []))
    );
  }
  getLabels(): Observable<Label[]> {
    return this.httpClient.get(this.server + LABEL.GET).pipe(
      map((res) => (res['data'] || []).map((e) => new Label().deserialize(e))),
      catchError(this.handleError('GET LABELS', []))
    );
  }
  getSharedLabels(): Observable<Label[]> {
    return this.httpClient.get(this.server + LABEL.SHARED_LABELS).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET SHARED LABELS', []))
    );
  }
  createLabel(label: Label): Observable<Label> {
    return this.httpClient.post(this.server + LABEL.CREATE, label).pipe(
      map((res) => new Label().deserialize(res['data'])),
      catchError(this.handleError('CREATE LABEL', null))
    );
  }
  create$(label: Label): void {
    label.mine = true;

    const labels = this.labels.getValue();
    labels.unshift(label);
    this.labels.next(labels);

    const allLabels = this.allLabels.getValue();
    allLabels.unshift(label);
    this.allLabels.next(allLabels);

    const labelItems = this.labelItems.getValue();
    const newItem: LabelItem = {
      label: label,
      contacts: []
    };
    labelItems.push(newItem);
    this.labelItems.next(labelItems);
  }

  bulkCreateLabel(labels: any[]): Observable<any> {
    return this.httpClient
      .post(this.server + LABEL.BULK_CREATE, { labels })
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK CREATE LABEL', null))
      );
  }

  updateLabel(id: string, label: any): Observable<boolean> {
    return this.httpClient.put(this.server + LABEL.PUT + id, label).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('UPDATE LABEL', false))
    );
  }
  update$(label: Label): void {
    const labels = this.labels.getValue();
    labels.some((e) => {
      if (e._id === label._id) {
        e.deserialize({ ...label });
        return true;
      }
    });
    this.labels.next(labels);

    const allLabels = this.allLabels.getValue();
    allLabels.some((e) => {
      if (e._id === label._id) {
        e.deserialize({ ...label });
        return true;
      }
    });
    this.allLabels.next(allLabels);

    const labelItems = this.labelItems.getValue();
    labelItems.some((e) => {
      if (e.label._id === label._id) {
        e.label.deserialize({ ...label });
        return true;
      }
    });
    this.labelItems.next(labelItems);
  }

  mergeLabels(mergeLabels: Label[], mergeTo: string): Observable<boolean> {
    const mergeLabelIds = mergeLabels.map((label) => label._id).concat();
    return this.httpClient
      .post(this.server + LABEL.MERGE, {
        mergeLabels: mergeLabelIds,
        mergeTo: mergeTo
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MERGE LABEL', false))
      );
  }

  merge$(mergeLabels: Label[], mergeTo: string): void {
    mergeLabels.map((label) => {
      if (label.name !== mergeTo) {
        this.delete$(label._id);
      }
    });
  }

  deleteLabels(labels: Label[]): Observable<boolean> {
    const ids = labels.map((label) => label._id).concat();
    return this.httpClient
      .post(this.server + LABEL.MULTI_DELETE, { labels: ids })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DELETE MULTI LABELS', false))
      );
  }

  deleteLabel(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + LABEL.DELETE + id).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('DELETE LABEL', false))
    );
  }

  delete$(_id: string): void {
    const labels = this.labels.getValue();
    labels.some((e, index) => {
      if (e._id === _id) {
        labels.splice(index, 1);
        return true;
      }
    });
    this.labels.next(labels);

    const allLabels = this.allLabels.getValue();
    allLabels.some((e, index) => {
      if (e._id === _id) {
        allLabels.splice(index, 1);
        return true;
      }
    });
    this.allLabels.next(allLabels);

    const labelItems = this.labelItems.getValue();
    labelItems.some((e, index) => {
      if (e.label._id === _id) {
        labelItems.splice(index, 1);
        return true;
      }
    });
    this.labelItems.next(labelItems);
  }
  /**
   * Change the Order of the labels
   * @param prevIndex : Prev Index of the Priority
   * @param currentIndex : Current Index of the Priority
   */
  changeOrder(prevIndex: number, currentIndex: number): void {
    const labelList = this.labels.getValue();
    moveItemInArray(labelList, prevIndex, currentIndex);
    const data = [];
    labelList.forEach((e) => {
      if (e.role !== 'admin') {
        data.push({ _id: e._id, name: e.name });
      }
    });

    this.changeOrderImpl(data).subscribe((status) => {
      if (status) {
        this.labels.next(labelList);

        this.allLabels.next(labelList);

        const i = 0;
        const labelItems = this.labelItems.getValue();
        const labelPriorityIndexes = {};
        let priority = 0;
        for (let i = labelList.length - 1; i >= 0; i--) {
          if (labelList[i]['role'] !== 'admin') {
            labelPriorityIndexes[labelList[i]['_id']] = priority;
            priority++;
          }
        }
        labelItems.forEach((labelItem) => {
          if (labelItem.label.role !== 'admin') {
            labelItem.label.priority =
              labelPriorityIndexes[labelItem.label._id];
          }
        });
        this.labelItems.next(labelItems);
      }
    });
  }

  changeOrderImpl(data: any[]): Observable<boolean> {
    return this.httpClient
      .post(this.server + LABEL.CHANGE_ORDER, { data: data.reverse() })
      .pipe(
        map((res) => res['status'] || false),
        catchError(this.handleError('UPDATE LABEL', false))
      );
  }

  public loadLabelContacts(
    label: string,
    page: number,
    pageSize: number,
    searchStr: string
  ): Observable<any> {
    this.loadDetailStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + LABEL.LOAD_CONTACTS, {
        label,
        page,
        pageSize,
        searchStr
      })
      .pipe(
        map((res) => res || []),
        catchError(this.handleError('LOAD LABEL CONTACTS', []))
      );
  }

  clear$(): void {
    this.labels.next([]);
    this.allLabels.next([]);
    this.labelItems.next([]);
  }
}
