import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, pipe, Subscription } from 'rxjs';
import { catchError, filter, map, share } from 'rxjs/operators';
import { GUEST, TASK, SCHEDULESEND } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import {
  TaskDurationOption,
  TaskSearchOption
} from '@models/searchOption.model';
import { Task, TaskDetail } from '@models/task.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { StoreService } from '@services/store.service';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';

@Injectable({
  providedIn: 'root'
})
export class TaskService extends HttpService {
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  loadSubscription: Subscription;
  searchOption: BehaviorSubject<TaskSearchOption> = new BehaviorSubject(
    new TaskSearchOption()
  );
  durationOption: BehaviorSubject<TaskDurationOption> = new BehaviorSubject(
    new TaskDurationOption()
  );
  sortOption: BehaviorSubject<number> = new BehaviorSubject(-1);
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  pageSize: BehaviorSubject<number> = new BehaviorSubject(20);
  searchOption$ = this.searchOption.asObservable();
  durationOption$ = this.durationOption.asObservable();
  total$ = this.total.asObservable();
  pageIndex: BehaviorSubject<number> = new BehaviorSubject(1);
  pageIndex$ = this.pageIndex.asObservable();
  pageSize$ = this.pageSize.asObservable();
  sortOption$ = this.sortOption.asObservable();
  scheduleData: BehaviorSubject<any> = new BehaviorSubject({});
  scheduleData$ = this.scheduleData.asObservable();
  private created: BehaviorSubject<number> = new BehaviorSubject(Date.now());
  created$ = this.created.asObservable();
  constructor(
    errorService: ErrorService,
    private http: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);

    const page = localStorage.getCrmItem(KEY.TASK.PAGE);
    const pageSize = localStorage.getCrmItem(KEY.TASK.PAGE_SIZE);
    const sortOption = localStorage.getCrmItem(KEY.TASK.ORDER_BY_DEADLINE);
    const searchOption = localStorage.getCrmItem(KEY.TASK.SORT_BY_DEADLINE);
    if (page) {
      this.storeService.taskPage.next(parseInt(page));
    }
    if (pageSize) {
      this.pageSize.next(parseInt(pageSize));
    }
    if (sortOption) {
      this.sortOption.next(parseInt(sortOption));
    }
    if (searchOption) {
      const parsedFilterOption = JSONParser(searchOption, {});
      const value = new TaskSearchOption().deserialize(parsedFilterOption);
      this.searchOption.next(value);
    }
    this.storeService.taskPage$.subscribe((value) => {
      localStorage.setCrmItem(KEY.TASK.PAGE, value + '');
    });
    this.pageSize$.subscribe((value) => {
      localStorage.setCrmItem(KEY.TASK.PAGE_SIZE, value + '');
    });
    this.sortOption$.subscribe((value) => {
      localStorage.setCrmItem(KEY.TASK.ORDER_BY_DEADLINE, value + '');
      this.reload();
    });
    this.searchOption$.subscribe((value) => {
      localStorage.setCrmItem(KEY.TASK.SORT_BY_DEADLINE, JSON.stringify(value));
      if (localStorage.getCrmItem('token')) {
        this.reload();
      }
    });
  }

  changeDuration(duration: TaskDurationOption): void {
    this.durationOption.next(duration);
    const searchOption = this.searchOption.getValue();
    searchOption.deserialize(duration);
    if (duration.status === undefined) {
      delete searchOption.status;
    }
    this.searchOption.next(searchOption);
    this.load(1);
  }

  changeSearchOption(searchOption: TaskSearchOption): void {
    // Change the Duration Option
    console.log('searchOption', searchOption);
    this.searchOption.next(searchOption);
    this.load(1);
  }

  clearSearchOption(): void {
    const duration = this.durationOption.getValue();
    const searchOption = new TaskSearchOption();
    searchOption.deserialize(duration);
    this.searchOption.next(searchOption);
    this.load(1);
  }

  resetOption(): void {
    const duration = this.durationOption.getValue();
    const searchOption = new TaskSearchOption();
    searchOption.deserialize(duration);
    this.searchOption.next(searchOption);
  }

  loadPage(page: number): void {
    this.pageIndex.next(page);
    this.load(page);
  }
  reload(): void {
    const page = this.pageIndex.getValue();
    this.load(page);
  }
  load(page: number): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.loadImpl(page).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['tasks']) {
        const tasks_list = res['tasks'];
        const contact_list = [];
        tasks_list.forEach((task: any) => {
          const contact = task?.contact;
          if (contact) {
            contact['taskId'] = task?._id;
            contact_list.push(contact);
          }
        });
        this.storeService.taskPageContacts.next(contact_list);
        this.storeService.tasks.next(res['tasks']);
        this.total.next(res['count']);
      }
    });
  }
  loadImpl(page: number): Observable<any> {
    const pageSize = this.pageSize.getValue();
    const skip = (page - 1) * pageSize;
    const searchOption = this.searchOption.getValue();
    const sortDir = this.sortOption.getValue();
    const option = { ...searchOption, sortDir };
    // if (option?.end_date && new Date(option.end_date).getTime() < Date.now()) {
    //   if (option.status === 0) {
    //     option.status = 2;
    //   }
    // }
    let timezone = '';
    const _tz = moment()['_z']?.name;
    if (_tz) timezone = _tz;
    else timezone = moment.tz.guess();
    return this.http
      .post(this.server + TASK.LOAD, {
        skip,
        pageSize,
        searchOption: option,
        timezone
      })
      .pipe(
        map((res) => {
          return {
            tasks: (res['data']['tasks'] || []).map((e) =>
              new TaskDetail().deserialize(e)
            ),
            count: res['data']['count'] || 0
          };
        }),
        catchError(this.handleError('LOAD TASKS', { tasks: [], count: 0 }))
      );
  }

  /**
   * Select All tasks for the current search option
   */
  selectAll(): Observable<string[]> {
    const searchOption = this.searchOption.getValue();
    return this.http.post(this.server + TASK.SELECT, searchOption).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('SELECT ALL TASKS', null))
    );
  }

  /**
   * Create One Task
   * @param data : Task Data
   */
  create(data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment()['_z']?.name
        ? moment()['_z'].name
        : moment.tz.guess();
    }
    return this.http.post(this.server + TASK.CREATE, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('TASK CREATE', null))
    );
  }

  /**
   * Create Tasks to Bulk Contacts
   * @param data : {type: string, content: string, due_date: date, contacts: contact ids array}
   */
  bulkCreate(data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment()['_z']?.name
        ? moment()['_z'].name
        : moment.tz.guess();
    }
    return this.http.post(this.server + TASK.BULK_CREATE, data).pipe(
      //map((res) => res['status']),
      map((res) => res),
      catchError(this.handleError('BULK TASK CREATE', null))
    );
  }

  /**
   * Update the specified task
   * @param id : Id of task to update
   * @param data: data of task to update
   */
  update(id: string, data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment()['_z']?.name
        ? moment()['_z'].name
        : moment.tz.guess();
    }
    return this.http.put(this.server + TASK.UPDATE + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE TASK', null))
    );
  }

  /**
   * update the bulk tasks
   * @param data : data of task to update -> contains the id array
   */
  bulkUpdate(data: any): Observable<boolean> {
    if (!data.timezone) {
      data.timezone = moment()['_z']?.name
        ? moment()['_z'].name
        : moment.tz.guess();
    }
    return this.http.post(this.server + TASK.BULK_UPDATE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('BULK TASK UPDATE', false))
    );
  }

  /**
   * Remove tasks
   * @param ids : id array of tasks to remove
   * @param include_recurrence : delete all of the recurring tasks
   */
  archive(follow_ups: any, include_recurrence = false): Observable<any> {
    return this.http
      .post(this.server + TASK.BULK_ARCHIVE, {
        follow_ups: follow_ups,
        include_recurrence
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('BULK TASK ARCHIVE', false))
      );
  }

  /**
   * complete one task
   * @param id : id of task to complete
   */
  complete(id: string, comment = ''): Observable<any> {
    return this.http
      .post(this.server + TASK.COMPLETE, { follow_up: id, comment })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('TASK COMPLETE', null))
      );
  }

  /**
   * complete one task
   * @param id : id of task to complete
   */
  unComplete(id: string, comment = ''): Observable<any> {
    return this.http
      .post(this.server + TASK.UNCOMPLETE, { follow_up: id, comment })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('TASK UNCOMPLETE', null))
      );
  }

  /**
   * complete bulk tasks
   * @param tasks : array of tasks to complete
   */
  bulkComplete(tasks: any): Observable<any> {
    return this.http
      .post(this.server + TASK.BULK_COMPLETE, { follow_ups: tasks })
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK TASK COMPLETE', null))
      );
  }
  scheduleSendCreate(data: any): Observable<any> {
    data['data']['source'] = 'schedule';
    return this.http.post(this.server + SCHEDULESEND.CREATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('BULK TASK ARCHIVE', null, true, true))
    );
  }

  removeScheduleItem(data: any): Observable<boolean> {
    return this.http.post(this.server + SCHEDULESEND.REMOVE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SCHEDULE ITEM REMOVE', false))
    );
  }

  removeContactScheduleItem(data: any): Observable<boolean> {
    return this.http.post(this.server + SCHEDULESEND.REMOVE_CONTACT, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SCHEDULE ITEM REMOVE CONTACT', false))
    );
  }

  removeTask$(ids: string[], pageSize: number): void {
    const tasks = this.storeService.tasks.getValue();
    const taskObjects = [];
    ids.forEach((id) => {
      taskObjects.push({ _id: id });
    });
    _.pullAllBy(tasks, taskObjects, '_id');
    this.storeService.tasks.next([...tasks]);

    const currentTotal = this.total.getValue();
    if (currentTotal <= pageSize) {
      return;
    }
    if (tasks.length < (pageSize * 2) / 3) {
      this.reload();
    }
  }

  leaveComment(id: string, comment: string): Observable<boolean> {
    return this.http
      .post(this.server + TASK.LEAVE_COMMENT, { id, comment })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('LEAVE TASK COMMENT', false))
      );
  }

  getAutoList(searchOption: any): Observable<any> {
    return this.http.post(this.server + TASK.GET_AUTOLIST, searchOption).pipe(
      map((res) => res),
      catchError(this.handleError('GET AUTO LIST', null))
    );
  }

  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
    this.searchOption.next(new TaskSearchOption());
    this.durationOption.next(new TaskDurationOption());
    this.total.next(0);
    this.pageIndex.next(1);
    this.pageSize.next(20);
  }

  /**
   * Get Today's Task
   */
  getTodayTasks(): any {
    return this.http.get(this.server + TASK.TODAY).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET TODAT TASK', []))
    );
  }

  onCreate(): void {
    this.created.next(Date.now());
  }
}
