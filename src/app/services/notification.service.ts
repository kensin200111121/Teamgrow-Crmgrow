import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NOTIFICATION, SCHEDULESEND } from '@constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { KEY } from '@constants/key.constant';
@Injectable({
  providedIn: 'root'
})
export class NotificationService extends HttpService {
  notifications: BehaviorSubject<any[]> = new BehaviorSubject([]);
  pageNotifications: BehaviorSubject<any[]> = new BehaviorSubject([]);
  systemAlerts: BehaviorSubject<any[]> = new BehaviorSubject([]);
  notifications$ = this.notifications.asObservable();
  systemAlerts$ = this.systemAlerts.asObservable();
  pageNotifications$ = this.pageNotifications.asObservable();
  lastTextSend: BehaviorSubject<number> = new BehaviorSubject(0);
  lastTextSend$ = this.lastTextSend.asObservable();

  lastEmailSend: BehaviorSubject<number> = new BehaviorSubject(0);
  lastEmailSend$ = this.lastEmailSend.asObservable();
  queuedPageSize: BehaviorSubject<number> = new BehaviorSubject(20);
  queuedPageSize$ = this.queuedPageSize.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
    const queuedPageSize = localStorage.getCrmItem(KEY.QUEUED.PAGE_SIZE);
    if (queuedPageSize) {
      this.queuedPageSize.next(parseInt(queuedPageSize));
    }
    this.queuedPageSize$.subscribe((value) => {
      localStorage.setCrmItem(KEY.QUEUED.PAGE_SIZE, value + '');
    });
  }

  loadNotifications(): void {
    this.loadNotificationsImpl().subscribe((res) => {
      if (res['status']) {
        this.notifications.next(res['personal_notifications'] || []);
        this.systemAlerts.next(res['system_notifications'] || []);
      }
    });
  }

  loadNotificationsImpl(): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.GET + `?limit=${5}`)
      .pipe(
        map((res) => res),
        catchError(this.handleError('RECENT NOTIFICATIONS', null))
      );
  }

  getByPage(page = 1, contact: string = null): Observable<any> {
    let api = this.server + NOTIFICATION.LOAD_PAGE + page;
    if (contact) {
      api += '?id=' + contact;
    }
    return this.httpClient.get(api).pipe(
      map((res) => res),
      catchError(this.handleError('GET PAGE', null))
    );
  }

  setAsRead(ids: string[], mode = null): Observable<boolean> {
    return this.httpClient
      .post(this.server + NOTIFICATION.READ_MARK, { ids, mode })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MARK AS READ', false))
      );
  }

  setAsUnread(ids: string[]): Observable<boolean> {
    return this.httpClient
      .post(this.server + NOTIFICATION.UNREAD_MARK, { ids })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MARK AS UNREAD', false))
      );
  }

  delete(ids: string[], mode = ''): Observable<boolean> {
    return this.httpClient
      .post(this.server + NOTIFICATION.DELETE, { ids, mode })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DELETE NOTIFICATIONS', false))
      );
  }

  getTextDeliverStatus(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.TEXT_DELIVERY).pipe(
      map((res) => res['notification']),
      catchError(this.handleError('GET TEXT DELIVERY STATUS', null))
    );
  }

  getNotificationStatus(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.STATUS).pipe(
      map((res) => res),
      catchError(this.handleError('GET NOTIFICATION DELIVERY STATUS', null))
    );
  }

  getEmailQueue(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.QUEUE_TASK, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET EMAIL QUEUE STATUS', null))
      );
  }

  getAllTasks(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.ALL_TASKS).pipe(
      map((res) => res),
      catchError(this.handleError('GET ALL TASKS', null))
    );
  }
  getAll(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.ALL).pipe(
      map((res) => res),
      catchError(this.handleError('GET ALL NOTIFICATIONS', null))
    );
  }

  /**
   * Update the task queue
   * @param _id : Task Process id
   * @param payload : object to update
   */
  updateTaskQueue(_id: string, payload: any): Observable<any> {
    return this.httpClient
      .put(this.server + NOTIFICATION.UPDATE_TASK + _id, payload)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE TASK', null))
      );
  }

  /**
   * Call the backend endpoint to remove the tasks
   * @param _id: process id of the tasks to remove
   * @returns: Observable
   */
  removeTask(_id: string): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.REMOVE_TASK + _id)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE TASKS', null))
      );
  }

  /**
   * Call the backend to reschedule the time
   * @param payload {id, time}
   */
  rescheduleTask(payload: any): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.RESCHEDULE_TASK, payload)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE TASKS', null))
      );
  }

  /**
   * Call the backend to update the status(active or draft) with the reschedule or update recurrence
   * @param payload
   */
  updateTaskStatus(payload: any): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.UPDATET_TASK_STATUS, payload)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE TASKS', null))
      );
  }

  checkTasks(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.CHECK_TASKS).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD TASKS', null))
    );
  }

  removeEmailTask(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.REMOVE_EMAIL_TASK, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE EMAIL TASK', null))
      );
  }

  removeEmailContact(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.REMOVE_EMAIL_CONTACT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE CONTACT FROM EMAIL QUEUE', null))
      );
  }

  loadTaskContact(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.LOAD_TASK_CONTACTS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD EMAIL TASK CONTACTS', null))
      );
  }

  loadQueueContact(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.LOAD_QUEUE_CONTACTS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD EMAIL QUEUE CONTACTS', null))
      );
  }

  getTextQueue(data): Observable<any> {
    return this.httpClient
      .post(this.server + NOTIFICATION.TEXT_QUEUE, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET TEXT QUEUE STATUS', null))
      );
  }

  create(data): Observable<any> {
    return this.httpClient.post(this.server + NOTIFICATION.GET, data).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE NOTIFICATION', null))
    );
  }

  loadTextQueues(): Observable<any> {
    return this.httpClient.get(this.server + NOTIFICATION.LOAD_TEXT_QUEUE).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD SENDING TEXTS', null))
    );
  }

  loadEmailQueues(): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.LOAD_EMAIL_QUEUE)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD SENDING EMAILS', null))
      );
  }

  loadAutomationQueues(): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.LOAD_AUTOMATION_QUEUE)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD ASSIGNING AUTOMATIONS', null))
      );
  }

  loadUnreadTexts(): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.LOAD_UNREAD_TEXTS)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD UNREAD TEXTS', null))
      );
  }

  loadMassTasks(): Observable<any> {
    return this.httpClient.get(this.server + SCHEDULESEND.MASS_TASKS).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('CHECK TASKS', null))
    );
  }

  loadUpdate(): Observable<any> {
    return this.httpClient
      .get(
        `https://qne5c1zy.api.sanity.io/v1/data/query/production?query=*[_type == 'update'] | order(publishedAt desc)[0...1]`
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('Checking Update', null))
      );
  }

  getSystemNotification(): Observable<any> {
    return this.httpClient
      .get(this.server + NOTIFICATION.GET_SYSTEM_NOTIFICATION)
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET SYSTEM NOTIFICATION', null))
      );
  }
}
