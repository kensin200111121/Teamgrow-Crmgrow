import { Component, OnInit, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { OnboardingService } from '@app/services/onboarding-services';

@Component({
  selector: 'app-onboarding-settings',
  templateUrl: './onboarding-setting.component.html',
  styleUrls: ['./onboarding-setting.component.scss']
})
export class OnboardingSettingComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<OnboardingSettingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    public onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    // Initialization logic
  }
  onClose(): void {
    this.dialogRef.close({});
  }
}
