import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SspaService } from '@app/services/sspa.service';

@Component({
  selector: 'app-confirm-move-contacts',
  templateUrl: './confirm-move-contacts.component.html',
  styleUrls: ['./confirm-move-contacts.component.scss']
})
export class ConfirmMoveContactsComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ConfirmMoveContactsComponent>,
    public sspaService: SspaService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  closeDialog(): void {
    this.dialogRef.close(false);
  }
  doMerge(): void {
    this.dialogRef.close({
      status: true,
      duplicatedContacts: this.data.duplicatedContacts
    });
  }
}
