import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-automation-header-update',
  templateUrl: './automation-header-update.component.html',
  styleUrls: ['./automation-header-update.component.scss']
})
export class AutomationHeaderUpdateComponent implements OnInit, OnDestroy {
  submitted = false;
  automation_title: string;
  automation_description: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AutomationHeaderUpdateComponent>,
    public sspaService: SspaService
  ) {
    if (this.data) {
      this.automation_title = this.data.automation_title;
      this.automation_description = this.data.automation_description;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  updateHeaderInfo(): void {
    this.submitted = true;
    this.dialogRef.close({
      automation_title: this.automation_title,
      automation_description: this.automation_description
    });
  }
}
