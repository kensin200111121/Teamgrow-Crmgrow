import {
  Directive,
  ElementRef,
  Input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';
@Directive({
  selector: '[enableByFeatures]'
})
export class EnableByFeaturesDirective {
  private _feature: string;
  private _isEnabled = false;
  private _featureChangeSubscription: Subscription;
  @Input()
  set enableByFeatures(value: string) {
    this._feature = value;
    this.applyFeatures(value);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private featureService: UserFeatureService
  ) {
    this._featureChangeSubscription &&
      this._featureChangeSubscription.unsubscribe();
    this._featureChangeSubscription =
      this.featureService.changedFeatures$.subscribe(() => {
        this.applyFeatures(this._feature);
      });
  }
  applyFeatures(value) {
    if (!value || (!environment.isSspa && value === USER_FEATURES.BETA)) {
      !this._isEnabled &&
        this.viewContainer.createEmbeddedView(this.templateRef);
      this._isEnabled = true;
      return;
    }
    if (this.featureService.isEnableFeature(value?.toLocaleLowerCase())) {
      !this._isEnabled &&
        this.viewContainer.createEmbeddedView(this.templateRef);
      this._isEnabled = true;
    } else {
      this.viewContainer.clear();
    }
  }
  ngOnDestroy(): void {
    this._featureChangeSubscription &&
      this._featureChangeSubscription.unsubscribe();
  }
}
