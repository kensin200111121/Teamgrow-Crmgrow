import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '@app/services/task.service';
import moment from 'moment-timezone';

@Component({
  selector: 'app-schedule-resend',
  templateUrl: './schedule-resend.component.html',
  styleUrls: ['./schedule-resend.component.scss']
})
export class ScheduleResendComponent implements OnInit {
  saving = false;
  emailData = null;
  constructor(
    public dialogRef: MatDialogRef<ScheduleResendComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private taskService: TaskService,
    public sspaService: SspaService
  ) {
    this.emailData = this.data.data;
  }

  ngOnInit(): void {}

  scheduleAgain(): void {
    const due_date = moment(this.emailData.due_date)
      .add(5, 'minutes')
      .seconds(0)
      .milliseconds(0);
    this.emailData = { ...this.emailData, due_date };
    const send_data = {
      contacts: this.data.contactIds,
      data: this.emailData
    };
    this.saving = true;

    this.taskService.scheduleSendCreate(send_data).subscribe((res) => {
      this.saving = false;
      if (res?.status) {
        if (res?.message === 'all_queue') {
          this.toast.info(
            'Your email requests are queued. The email queue progressing would be displayed in the header.',
            'Email Queue',
            {}
          );
        } else {
          this.toast.error('Schedules sending is failed.', 'Schedule Sent');
        }
        this.taskService.scheduleData.next({});
        this.dialogRef.close();
      } else {
        if (res?.statusCode === 405) {
          this.data = { ...res?.data };
        } else {
          this.toast.error(res?.error);
          this.dialogRef.close();
        }
      }
    });
  }
}
