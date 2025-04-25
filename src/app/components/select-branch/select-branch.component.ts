import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AutomationService } from '@app/services/automation.service';

@Component({
  selector: 'app-select-branch',
  templateUrl: './select-branch.component.html',
  styleUrls: ['./select-branch.component.scss']
})
export class SelectBranchComponent implements OnInit {
  timelines = [];
  constructor(
    private automationService: AutomationService,
    public dialogRef: MatDialogRef<SelectBranchComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  onConfirm(type): void {
    this.dialogRef.close({ answer: type });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
