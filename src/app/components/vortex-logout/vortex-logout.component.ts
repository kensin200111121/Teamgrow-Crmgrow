import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-vortex-logout',
  templateUrl: './vortex-logout.component.html',
  styleUrls: ['./vortex-logout.component.scss']
})
export class VortexLogoutComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<VortexLogoutComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  handleLogout(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef.close(true);
  }
}
