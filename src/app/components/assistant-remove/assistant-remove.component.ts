import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Guest } from '@models/guest.model';
import { GuestService } from '@services/guest.service';

@Component({
  selector: 'app-assistant-remove',
  templateUrl: './assistant-remove.component.html',
  styleUrls: ['./assistant-remove.component.scss']
})
export class AssistantRemoveComponent implements OnInit {
  deleting = false;
  constructor(
    private guestService: GuestService,
    private dialogRef: MatDialogRef<AssistantRemoveComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Guest
  ) {}

  ngOnInit(): void {}

  /**
   * Call Api to remove the assistant
   */
  delete(): void {
    this.deleting = true;
    this.guestService.remove(this.data._id).subscribe(
      () => {
        this.deleting = false;
        this.dialogRef.close(true);
      },
      () => {
        this.deleting = false;
      }
    );
  }
}
