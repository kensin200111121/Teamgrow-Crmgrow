import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Guest } from '@models/guest.model';
import { GuestService } from '@services/guest.service';

@Component({
  selector: 'app-assistant-create',
  templateUrl: './assistant-create.component.html',
  styleUrls: ['./assistant-create.component.scss']
})
export class AssistantCreateComponent implements OnInit {
  assistant: Guest = new Guest();
  confirm_password = '';
  creating = false;
  constructor(
    private dialogRef: MatDialogRef<AssistantCreateComponent>,
    private guestService: GuestService
  ) {}

  ngOnInit(): void {}

  submit(): void {
    if (this.assistant.password != this.confirm_password) {
      return;
    }
    this.creating = true;
    this.guestService.create(this.assistant).subscribe(
      (newGeust) => {
        this.creating = false;
        this.dialogRef.close(newGeust);
      },
      () => {
        this.creating = false;
      }
    );
  }
}
