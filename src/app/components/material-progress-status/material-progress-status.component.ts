import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MaterialItem } from '@app/core/interfaces/resources.interface';
import { MaterialService } from '@app/services/material.service';
import moment from 'moment-timezone';

const SHORT_INTERVAL = 5 * 1000;
const LONG_INTERVAL = 60 * 1000;

@Component({
  selector: 'app-material-progress-status',
  templateUrl: './material-progress-status.component.html',
  styleUrls: ['./material-progress-status.component.scss']
})
export class MaterialProgressStatusComponent implements OnInit {
  constructor(public materialService: MaterialService) {}
  @Input() displayType: 'tile' | 'list' = 'tile';

  @Input() material: MaterialItem | null = null;
  @Output() sendMaterial = new EventEmitter();

  currentProgressValue = 0;
  updateIntervalTimer;
  status = 'progress'; // progress, uploadError, convertError, completed,disabled

  ngOnInit(): void {
    if (this.material.item_type === 'video') {
      this.status = this.material?.converted ?? 'progress';
      if (this.status !== 'completed') {
        this.getUploadProgressValue();
        return;
      }
    }
    this.status = 'completed';
  }

  getUploadProgressValue() {
    const uploadElapsedTime = moment().diff(
      moment(this.material.created_at),
      'minutes'
    );
    if (uploadElapsedTime > 35) {
      if (this.material?.status?.merged?.status) {
        this.status = 'convertError';
      } else {
        this.status = 'uploadError';
      }
      return;
    }
    const intervalVal = uploadElapsedTime < 3 ? SHORT_INTERVAL : LONG_INTERVAL;

    this.updateIntervalTimer = setInterval(() => {
      this.materialService
        .getS3ConvertingStatus(this.material.key)
        .subscribe((statusValue) => {
          if (statusValue) {
            const isCompleted =
              statusValue?.converted === 100 || statusValue?.streamd === 100;
            if (isCompleted) {
              clearInterval(this.updateIntervalTimer);
              this.status = 'completed';
            } else {
              const diffHours = moment().diff(
                moment(this.material.created_at),
                'minutes'
              );
              if (diffHours > 35 && !isCompleted) {
                if (this.material?.status?.merged?.status) {
                  this.status = 'convertError';
                } else {
                  this.status = 'uploadError';
                }
                clearInterval(this.updateIntervalTimer);
              }
              if (diffHours > 3 && intervalVal == SHORT_INTERVAL) {
                clearInterval(this.updateIntervalTimer);
                this.getUploadProgressValue();
              }
              this.currentProgressValue = statusValue?.converted ?? 0;
            }
          }
        });
    }, intervalVal);
  }

  sendMaterialEvent($event: any) {
    this.sendMaterial.emit($event);
  }

  ngOnDestroy(): void {
    clearInterval(this.updateIntervalTimer);
  }
}
