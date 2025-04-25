import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OnboardingSettingComponent } from '@app/components/onboarding-setting/onboarding-setting.component';
@Component({
  selector: 'app-integration-vortex',
  templateUrl: './integration-vortex.component.html',
  styleUrls: ['./integration-vortex.component.scss']
})
export class IntegrationVortexComponent implements OnInit {
  constructor(private dialog: MatDialog, public sspaService: SspaService) {}
  ngOnInit(): void {}
  onTest(): void {
    this.dialog.open(OnboardingSettingComponent, {}).afterClosed();
  }

  ngOnDestroy(): void {}
}
