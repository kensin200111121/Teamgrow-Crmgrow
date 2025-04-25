import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-leave-team',
  templateUrl: './confirm-leave-team.component.html',
  styleUrls: ['./confirm-leave-team.component.scss']
})
export class ConfirmLeaveTeamComponent implements OnInit {
  onOtherAction = new EventEmitter();
  onConfirmAction = new EventEmitter();
  submitting = false;
  d_status = {};

  constructor(
    public dialogRef: MatDialogRef<ConfirmLeaveTeamComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  closeWithAnswer(answer): void {
    this.dialogRef.close(answer.value);
  }

  close(): void {
    this.dialogRef.close(0);
  }

  doRemove(answer: number): void {
    this.dialogRef.close(answer);
  }

  expandDetails(id: string | number): void {
    if (this.d_status[id]) {
      this.d_status[id] = false;
    } else {
      this.d_status[id] = true;
    }
  }
  fullName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  avatarName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name) {
      return contact.first_name.substring(0, 2);
    } else if (contact.last_name) {
      return contact.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }
}
