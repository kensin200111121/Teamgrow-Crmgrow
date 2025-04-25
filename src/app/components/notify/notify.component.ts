import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.scss']
})
export class NotifyComponent implements OnInit {
  isConfirm = false;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<NotifyComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {}
  close(): void {
    if (!this.data?.show_checkbox) {
      this.dialogRef.close();
      return;
    }
    if (!this.isConfirm) {
      this.dialogRef.close();
      return;
    }
    this.saving = true;
    this.userService
      .updateGarbage({ is_notification_read: true })
      .subscribe(() => {
        this.saving = false;
        this.dialogRef.close();
      });
  }
}
