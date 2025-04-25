import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { environment } from '@environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { OnboardingSettingComponent } from '@app/components/onboarding-setting/onboarding-setting.component';
import { OnboardStepStatusType } from '@app/models/garbage.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  readonly isSspa = environment.isSspa;
  steps = ['email', 'calendar', 'contacts'];
  onboardingStatus: Record<string, OnboardStepStatusType> = {};

  get totalStepCount(): number {
    return this.steps.length;
  }

  get inCompletedStepCount(): number {
    let count = 0;
    for (const key in this.onboardingStatus) {
      count +=
        this.steps.includes(key) && this.onboardingStatus[key] !== 'completed'
          ? 1
          : 0;
    }
    return count;
  }

  get completedStepCount(): number {
    let count = 0;
    for (const key in this.onboardingStatus) {
      count +=
        this.steps.includes(key) && this.onboardingStatus[key] === 'completed'
          ? 1
          : 0;
    }
    return count;
  }

  get pendingStepCount(): number {
    let count = 0;
    for (const key in this.onboardingStatus) {
      count +=
        this.steps.includes(key) && this.onboardingStatus[key] === 'pending'
          ? 1
          : 0;
    }
    return count;
  }

  get skippedOrCompletedStepCount(): number {
    let count = 0;
    for (const key in this.onboardingStatus) {
      const status = this.onboardingStatus[key];
      count +=
        this.steps.includes(key) &&
        (status === 'skipped' || status === 'completed')
          ? 1
          : 0;
    }
    return count;
  }

  constructor(private userService: UserService, private dialog: MatDialog) {
    this._initOnboardingSteps();
    this.reinitOnboardingSteps(true);
  }

  private _initOnboardingSteps() {
    this.userService.garbage$.subscribe((_garbage) => {
      if (!_garbage?._id) return;
      this.onboardingStatus = _garbage.onboarding_status;
    });
  }

  private _showDialog() {
    const onboardDialogStatus = localStorage.getCrmItem('onboarding');
    if (onboardDialogStatus !== '1' && this.pendingStepCount) {
      this.dialog
        .open(OnboardingSettingComponent, {
          width: '100vw',
          maxWidth: '960px'
        })
        .afterClosed();
      localStorage.setCrmItem('onboarding', '1');
    }
  }

  public reinitOnboardingSteps(isInitStep = false) {
    this.userService
      .verifyConnectionStatus()
      .subscribe(({ onboarding_status }) => {
        if (onboarding_status) {
          this.onboardingStatus = onboarding_status;
          this.userService.updateGarbageImpl({ onboarding_status });
          isInitStep && this._showDialog();
        }
      });
  }

  public toggleSkipping(section: string) {
    const onboardingStatus = { ...this.onboardingStatus };

    if (!onboardingStatus[section] || onboardingStatus[section] === 'completed')
      return;

    onboardingStatus[section] =
      onboardingStatus[section] === 'pending' ? 'skipped' : 'pending';

    this.userService
      .updateGarbage({
        onboarding_status: onboardingStatus
      })
      .subscribe((res) => {
        this.userService.updateGarbageImpl({
          onboarding_status: onboardingStatus
        });
      });
  }

  public completeOnboardingStep(step: string) {
    if (this.onboardingStatus[step] === 'completed') {
      return;
    }
    const onboardingStatus = { ...this.onboardingStatus };
    onboardingStatus[step] = 'completed';
    this.userService
      .updateGarbage({
        onboarding_status: onboardingStatus
      })
      .subscribe((res) => {
        this.userService.updateGarbageImpl({
          onboarding_status: onboardingStatus
        });
      });
  }
}
