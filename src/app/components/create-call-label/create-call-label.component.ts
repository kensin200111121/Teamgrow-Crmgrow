import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import * as _ from 'lodash';
import { ADMIN_CALL_LABELS } from '@constants/variable.constants';
import { DialerService } from '@app/services/dialer.service';

@Component({
  selector: 'app-create-call-label',
  templateUrl: './create-call-label.component.html',
  styleUrls: ['./create-call-label.component.scss']
})
export class CreateCallLabelComponent implements OnInit {
  label = '';
  old_label = '';
  saving = false;
  editable = false;
  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<CreateCallLabelComponent>,
    private dialerService: DialerService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editable = this.data?.editable;
    this.old_label = this.data?.label;
    this.label = this.old_label;
  }

  ngOnInit(): void {}

  create(): void {
    const labels = this.userService.callLabels.getValue();
    if (this.editable) {
      if (this.old_label === this.label) {
        this.dialogRef.close({ label: this.label });
        return;
      } else {
        const i = labels.indexOf(this.old_label);
        if (i >= 0) labels[i] = this.label;
      }
    } else {
      if (labels.indexOf(this.label) !== -1 && !this.editable) {
        this.dialogRef.close({ label: this.label });
        return;
      }
    }

    const ownLabels = _.difference(labels, ADMIN_CALL_LABELS);
    if (!this.editable) ownLabels.push(this.label);
    this.saving = true;
    this.userService
      .updateGarbage({
        call_labels: ownLabels
      })
      .subscribe((status) => {
        this.saving = false;
        if (status) {
          this.userService.callLabels.next([
            ...ADMIN_CALL_LABELS,
            ...ownLabels
          ]);
          // Update phone logs with new label
          this.dialerService
            .updateLogs({
              oldLabel: this.old_label,
              newLabel: this.label
            })
            .subscribe((res) => {
              this.dialogRef.close({ label: this.label });
            });
        }
      });
  }
}
