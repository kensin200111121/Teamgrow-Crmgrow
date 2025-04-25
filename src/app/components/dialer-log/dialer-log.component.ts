import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Subject, Subscription } from 'rxjs';
import {
  ADMIN_CALL_LABELS,
  DialogSettings
} from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { CreateCallLabelComponent } from '@components/create-call-label/create-call-label.component';
import { DialerService } from '@services/dialer.service';
import { finalize } from 'rxjs/operators';
@Component({
  selector: 'app-dialer-log',
  templateUrl: './dialer-log.component.html',
  styleUrls: ['./dialer-log.component.scss']
})
export class DialerLogComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private _contactNameDic: Record<string, string> = {};

  contactId: string = null;
  log: any = null;
  saving = false;

  private _logSyncSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<DialerLogComponent>,
    private dialerService: DialerService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._contactNameDic = (this.dialerService.command?.contacts || []).reduce(
      (names, e) => ({ ...names, [e.contactId]: e.name }),
      {}
    );
    this.initDialogData(this.data.contactId);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this._logSyncSubscription && this._logSyncSubscription.unsubscribe();
  }

  update(): void {
    this.saving = true;
    const log = {
      ...this.log,
      deal: this.dialerService.command?.deal,
      uuid: this.dialerService.command?.uuid,
      saved: true
    };
    const data = [log];
    this.dialerService
      .register(data)
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(() => {
        this.updateLog();
        this.checkNextLogAndClose();
        this.dialogRef.close(log);
      });
  }

  close(): void {
    const log = {
      ...this.log,
      deal: this.dialerService.command?.deal,
      uuid: this.dialerService.command?.uuid,
      saved: true
    };
    const data = [log];
    this.dialogRef.close();
  }

  /**
   * Sync the active log data with the service logs
   * @param id: contactId
   */
  private initDialogData(id: string): void {
    this.contactId = id;
    this.log = null;
    // unsubscribe sync subscription
    this._logSyncSubscription && this._logSyncSubscription.unsubscribe();
    // init subscription again to sync the current log data
    this._logSyncSubscription = this.dialerService.logs$.subscribe((logs) => {
      let log = null;
      if (!this.contactId) {
        log = logs.find((e) => !e.saved && e.started);
        this.contactId = log.contactId;
      } else {
        log = logs.find((e) => e.contactId === this.contactId);
      }
      if (log) {
        this.log = { ...this.log, ...log };
        this.log.label = this.getLabel(this.log);
        this.log.name = this._contactNameDic[this.log.contactId];
      } else {
        this.dialogRef.close();
      }
    });
  }

  private updateLog(): void {
    var logs = this.dialerService.logs.getValue();
    logs.some((item) => {
      if (item.contactId === this.contactId) {
        item.saved = true;
        item.status = this.log.label;
        item.content = this.log.content;
        return true;
      }
    });
    this.dialerService.logs.next([...logs]);
  }

  /**
   * Check the next log. If there is no closed log, close the dialog. If it exists, reinit the dialog
   */
  private checkNextLogAndClose(): void {
    const logs = this.dialerService.logs.getValue();
    const unsavedLog = logs.find((e) => e.ended && !e.saved);
    if (unsavedLog) {
      if (unsavedLog.contactId === 'callCursor') {
        this.dialogRef.close({ isClosed: true });
        return;
      }
      // change cursor log and reinit the dialog
      this.initDialogData(unsavedLog.contactId);
    } else {
      // close dialog
      this.dialogRef.close();
    }
  }

  private getLabel(log): string {
    if (log.outcome === 'VOICEMAIL') {
      return 'Voice Message';
    } else if (log.outcome === 'CALLBACK') {
      return 'Callback Set';
    } else if (log.answered) {
      return 'Interested';
    }
    return 'No Answer';
  }

  is_editable(label): boolean {
    return !ADMIN_CALL_LABELS.includes(label);
  }

  openCallLabelManager(log: any, selector: MatSelect): void {
    selector.close();
    this.dialog
      .open(CreateCallLabelComponent, {
        ...DialogSettings.CONFIRM
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.label) {
          log.label = res.label;
        } else {
          selector.open();
        }
      });
  }

  edit(event, selector: MatSelect, label): void {
    selector.close();
    event.preventDefault();
    event.stopPropagation();
    this.dialog
      .open(CreateCallLabelComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          editable: true,
          label
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.label) {
          this.log.label = res.label;
        }
        selector.open();
      });
  }
}
