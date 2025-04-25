import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MaterialCreateComponent } from '../material-create/material-create.component';
import { MatDialog } from '@angular/material/dialog';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { StoreService } from '@app/services/store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-automation-trigger-material',
  templateUrl: './automation-trigger-material.component.html',
  styleUrls: ['./automation-trigger-material.component.scss']
})
export class AutomationTriggerMaterialComponent implements OnInit, OnDestroy {
  constructor(
    protected dialog: MatDialog,
    private storeService: StoreService
  ) {}
  material;
  readonly PERCENTAGES = [
    { value: 0, name: 'Any amount' },
    { value: 5, name: '5%' },
    { value: 10, name: '10%' },
    { value: 25, name: '25%' },
    { value: 50, name: '50%' },
    { value: 75, name: '75%' },
    { value: 100, name: '100%' }
  ];
  percentage = 0;
  private _automationTrigger: any = null;
  @Input('automationTrigger')
  set automationTrigger(value) {
    this._automationTrigger = value;
    this.percentage = this._automationTrigger?.detail?.amount || 0;
    !this._materialSubscription && this._initMaterialSubscription();
  }
  get automationTrigger() {
    if (this.material) {
      this._automationTrigger = {
        type: 'material_viewed',
        detail: {
          type: this.getMaterialType(this.material.type),
          id: this.material._id
        }
      };
      if (this.material.material_type === 'video')
        this._automationTrigger['detail']['amount'] = parseInt(
          this.percentage + ''
        );
    } else {
      this._automationTrigger = null;
    }
    return this._automationTrigger;
  }
  @Output() onChanged = new EventEmitter();

  private _materialSubscription: Subscription;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._materialSubscription && this._materialSubscription.unsubscribe();
  }

  private _initMaterialSubscription(): void {
    this._materialSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        if (!!this._automationTrigger?.detail?.id) {
          const material = materials.find(
            (e) => e._id === this._automationTrigger?.detail?.id
          );
          this.material = material;
        }
      }
    );
  }

  getMaterialType(type): string {
    let _type = 'VIDEO';
    switch (type) {
      case 'youtube':
        _type = 'VIDEO';
        break;
      case 'application/pdf':
        _type = 'PDF';
        break;
      case 'image/jpeg':
      case 'image/png':
      case 'image/bmp':
        _type = 'IMAGE';
        break;
    }
    return _type;
  }
  upload(): void {
    this.dialog
      .open(MaterialCreateComponent, {
        maxWidth: '600px',
        disableClose: true,
        data: {
          currentFolder: '',
          type: 'video'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.material = res.data;
          this.onChanged.emit(this.automationTrigger);
        }
      });
  }

  changePercentage(value): void {
    this.percentage = value;
    this.onChanged.emit(this.automationTrigger);
  }

  selectMedia(): void {
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: false,
        title: 'Select Media'
      }
    });
    materialDialog.afterClosed().subscribe((res) => {
      if (res.materials) {
        this.material = res.materials[0];
        this.onChanged.emit(this.automationTrigger);
      }
    });
  }
}
