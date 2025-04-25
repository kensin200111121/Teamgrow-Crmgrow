import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Guest } from '@models/guest.model';
import { GuestService } from '@services/guest.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assistant-password',
  templateUrl: './assistant-password.component.html',
  styleUrls: ['./assistant-password.component.scss']
})
export class AssistantPasswordComponent implements OnInit {
  updating = false;
  confirm_password = '';
  constructor(
    private guestService: GuestService,
    private dialogRef: MatDialogRef<AssistantPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public assistant: Guest,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {}

  /**
   * Call API to update the password
   */
  submit(): void {
    if (this.confirm_password != this.assistant.password) {
      return;
    }
    this.updating = true;
    this.guestService.update(this.assistant._id, this.assistant).subscribe(
      () => {
        this.updating = false;
        // this.toast.success('Assistant Password successfully updated.');
        this.dialogRef.close(true);
      },
      () => {
        this.updating = false;
      }
    );
  }
}
