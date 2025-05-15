import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DIALER } from '@constants/api.constant';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { STATUS } from '@constants/variable.constants';
import moment from 'moment-timezone';
import { EventEmitter } from 'events';
import * as Storm from '@wavv/dialer';
import { WavvStatus } from '@app/utils/wavv';
import { init, load } from '@wavv/dialer';
import { init as initMessenger } from '@wavv/messenger';
import { startRingless } from '@wavv/ringless';
import { ToastrService } from 'ngx-toastr';
import { between } from '@app/helper';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DialerService extends HttpService {
  initStatus: BehaviorSubject<WavvStatus> = new BehaviorSubject(
    WavvStatus.NONE
  );
  initStatus$ = this.initStatus.asObservable();

  isCallLogged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  isCallLogged$ = this.isCallLogged.asObservable();

  private initingWavv = false;

  rvms: BehaviorSubject<any[]> = new BehaviorSubject([]);
  rvms$ = this.rvms.asObservable();

  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();

  statusReports: BehaviorSubject<any[]> = new BehaviorSubject([]);
  statusReports$ = this.statusReports.asObservable();

  updateNotification: BehaviorSubject<any[]> = new BehaviorSubject([]);
  updateNotification$ = this.updateNotification.asObservable();

  command: any = null;

  logs: BehaviorSubject<any[]> = new BehaviorSubject([]);
  logs$: Observable<any[]> = this.logs.asObservable();

  logInputEmitter = new EventEmitter();
  logInputEvent = fromEvent(this.logInputEmitter, 'input');
  logInputSubscription = this.logInputEvent.subscribe((data: any) => {
    this.inputLog(data);
  });

  calling: BehaviorSubject<boolean> = new BehaviorSubject(false);
  calling$: Observable<boolean> = this.calling.asObservable();

  constructor(
    errorService: ErrorService,
    private http: HttpClient,
    private router: Router,
    private toast: ToastrService
  ) {
    super(errorService);
  }

  init(token?: string) {
    if (token) {
      initMessenger({ token: token })
        .then(() => {
          console.log('initialized wavv messanger');
        })
        .catch((e) => {
          console.log(e);
        });
    }
    token && this.initWavv(token);
  }

  private async initWavv(token: string) {
    // if (environment.isSspa) {
    //   this.initRedxWavv();
    //   return;
    // }
    if (this.initingWavv) {
      return;
    }
    this.initingWavv = true;
    try {
      await init({ token });
      this.initStatus.next(WavvStatus.INITED);
    } catch (err) {
      this.initStatus.next(WavvStatus.FAILED);
      this.toast.error(err.message);
    }
    this.initingWavv = false;
  }

  private async initRedxWavv() {
    console.log('[WAVV] init wavv in crmgrow using redx ui');
    const { getWavvPromise } = await import('@redx/api-ui');

    getWavvPromise();
    try {
      await Promise.race([
        load(),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject('Wavv did not load in time');
          }, 10000);
        })
      ]);
      this.initStatus.next(WavvStatus.INITED);
    } catch (e) {
      this.initStatus.next(WavvStatus.FAILED);
    }
  }

  makeCalls(contacts: any, deal?: string, dealStages?: any): void {
    this.isCallLogged.next(false);
    // if (this.initStatus.getValue() !== WavvStatus.INITED) {
    //   this.toast.error(
    //     `WAVV is not initiated. Please clear the cache and cookies on your browser and try again`,
    //     'Call Request'
    //   );
    //   return;
    // }
    const filtered = contacts.filter((e) => e.numbers[0]);
    if (!contacts?.length) {
      this.toast.error(`These contacts don't have cell phone.`, 'Call Request');
      return;
    }
    this.logs.next([]);
    const dialerMini = document.getElementById('wavv-dialer-mini');
    const minWidth = parseInt(dialerMini.style.minWidth);
    const minHeight = parseInt(dialerMini.style.minHeight);
    const centerX = (window.innerWidth - minWidth) / 2;
    const centerY = (window.innerHeight - minHeight) / 2;
    Storm.startCampaign({ contacts: filtered, mini: true })
      .then(() => {
        if (dialerMini) {
          dialerMini.style.position = 'fixed';
          dialerMini.style.left = `${centerX}px`;
          dialerMini.style.top = `${centerY}px`;
          dialerMini.style.zIndex = '1000';
          environment.isSspa && this.setWavvCallStatus(true);
        }
        this._onStartedCampaign({
          contacts: filtered,
          deal,
          dealStages
        });
      })
      .catch((err) => {
        this._onStartedCampaign(null);
        this.toast.error(err.message || err, 'Calling Request');
      });
  }

  setWavvCallStatus(status: boolean) {
    this.calling.next(status);
  }

  makeRvms(contacts: any): void {
    if (contacts) {
      startRingless({
        contacts
      });
    }
  }

  private _onStartedCampaign(command): void {
    if (!command) {
      this.command = null;
      return;
    }
    const { contacts, deal, dealStages } = command;
    const uuid = new Date().getTime() + '_' + between(1000, 9999);
    this.command = {
      contacts,
      ...(deal ? { deal, uuid } : {}),
      ...(dealStages ? { dealStages, uuid } : {})
    };
  }

  cleanLogs(): void {
    this.logs.next([]);
  }

  register(data: any): Observable<any> {
    return this.http.post(this.server + DIALER.REGISTER, data).pipe(
      map((res) => res),
      catchError(this.handleError('REGISTER CALL HISTORY', null))
    );
  }

  inputLog(log: any, isClosingLog = false): void {
    // update the log data for inputLogs, waitingLogs, savingLog
    let existLog;
    const logs = this.logs.getValue();
    logs.some((e: any) => {
      if (e.contactId === log.contactId) {
        for (const key in log) {
          if (log[key]) {
            e[key] = log[key];
          }
        }
        existLog = e;
        return true;
      }
    });
    if (!existLog) {
      logs.push(log);
    }

    this.logs.next([...logs]);
  }

  updateCall(log: any): void {
    this.logInputEmitter.emit('input', log);
  }

  loadRecording(id): Observable<any> {
    return this.http
      .post(this.server + DIALER.GET_RECORDING, { recording: id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING RECORDING', null))
      );
  }

  updateLog(id, data): Observable<any> {
    return this.http.put(this.server + DIALER.EDIT + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATING RECORDING', null))
    );
  }

  saveDealDialer(data): Observable<any> {
    return this.http.post(this.server + DIALER.DEAL_DIALER, data).pipe(
      map((res) => res),
      catchError(this.handleError('REGISTER DEAL CALL HISTORY', null))
    );
  }

  loadReportData(): void {
    this.loadStatistics().subscribe((data) => {
      this.statusReports.next(data);
    });
  }

  /**
   * Load the call log count by grouping (date, labels, ...)
   * @returns
   */
  loadStatistics(data = null): Observable<any> {
    const timezone = moment()['_z']?.name
      ? moment()['_z'].name
      : moment.tz.guess();
    return this.http
      .post(this.server + DIALER.LOAD_STATISTICS, { timezone, data })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('Load call log report'))
      );
  }

  /**
   * Load the call history
   * @param req: {query, skip, limit}
   * @returns
   */
  loadLogs(req = null): Observable<any> {
    return this.http.post(this.server + DIALER.LOAD_HISTORY, { ...req }).pipe(
      map((res) => res),
      catchError(this.handleError('Load call logs'))
    );
  }

  updateLogs(data): Observable<any> {
    return this.http.post(this.server + DIALER.UPDATE_LOGS, data).pipe(
      map((res) => res),
      catchError(this.handleError('Update phone logs', null))
    );
  }
}
