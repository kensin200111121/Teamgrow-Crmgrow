import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import {
  ADMIN_CALL_LABELS,
  DialogSettings
} from '@constants/variable.constants';
import { DialerService } from '@services/dialer.service';
import { UserService } from '@services/user.service';
import { CreateCallLabelComponent } from '@components/create-call-label/create-call-label.component';
import { ConfirmComponent } from '../confirm/confirm.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-dialer-call',
  templateUrl: './dialer-call.component.html',
  styleUrls: ['./dialer-call.component.scss']
})
export class DialerCallComponent implements OnInit {
  log: any = {};
  saving = false;
  editable = false;
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<DialerCallComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialerService: DialerService,
    public userService: UserService
  ) {
    if (this.data && this.data.call) {
      this.log = { ...this.data.call };
    }
    this.editable = !ADMIN_CALL_LABELS.includes(this.log.label);
  }

  ngOnInit(): void {}

  update(): void {
    this.saving = true;
    this.dialerService.updateLog(this.log._id, this.log).subscribe((status) => {
      this.saving = false;
      if (status) {
        this.dialogRef.close({ status: true, data: this.log });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  openCallLabelManager(selector: MatSelect): void {
    selector.close();
    this.dialog
      .open(CreateCallLabelComponent, {
        ...DialogSettings.CONFIRM
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.label) {
          this.log.label = res.label;
        } else {
          selector.open();
        }
      });
  }

  is_editable(label): boolean {
    return !ADMIN_CALL_LABELS.includes(label);
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

  delete(event, selector: MatSelect, label): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete call disposition',
          message: 'Are you sure to remove this call disposition?',
          label: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          selector.close();
          event.preventDefault();
          event.stopPropagation();
          const labels = this.userService.callLabels.getValue();
          const i = labels.indexOf(label);
          if (i >= 0) {
            labels.splice(i, 1);
          }
          const ownLabels = _.difference(labels, ADMIN_CALL_LABELS);
          this.userService
            .updateGarbage({
              call_labels: ownLabels
            })
            .subscribe((res) => {
              if (res) {
                this.userService.callLabels.next([
                  ...ADMIN_CALL_LABELS,
                  ...ownLabels
                ]);
                // Update phone logs
                this.dialerService
                  .updateLogs({ oldLabel: label })
                  .subscribe((res) => {
                    console.log('Updated phone logs');
                  });
              }
              selector.open();
            });
        }
      });
  }
}
