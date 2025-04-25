import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DELAY } from '@constants/variable.constants';
import { Material } from '@models/material.model';

export interface RowElement {
  key: string;
  value: string;
}

@Component({
  selector: 'app-lead-capture-form-delay',
  templateUrl: './lead-capture-form-delay.component.html',
  styleUrls: ['./lead-capture-form-delay.component.scss']
})
export class LeadCaptureFormDelayComponent implements OnInit {
  material: Material;
  materials: Material[] = [];
  enable_forms_data: RowElement[] = [];
  delay_immediate = false;
  capture_delay = 0;
  capture_delay_hour = 0;
  capture_delay_min = 0;
  capture_delay_sec = 0;
  max_duration = 0;
  exceedDuration = false;
  isTimeDup = false;
  DELAY = DELAY;
  type = 'create';
  form_id = '';
  msgTitle = '';
  constructor(
    private dialogRef: MatDialogRef<LeadCaptureFormDelayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.material) {
      this.material = this.data.material;
    }
    if (this.data && this.data.materials) {
      this.materials = this.data.materials;
    }
    if (this.data && this.data.enable_forms_data) {
      this.enable_forms_data = this.data.enable_forms_data;
      this.form_id = this.enable_forms_data[0]?.key;
    }

    if (this.data && this.data.capture_delay) {
      this.capture_delay = this.data.capture_delay;
    }
    if (this.data && this.data.type) {
      this.type = this.data.type;
      if (this.type === 'create') this.msgTitle = 'Add New Lead Form';
      else this.msgTitle = ' Lead Form Delay Time';
    }
    if (this.capture_delay > 0) {
      this.capture_delay_hour = Math.floor(this.capture_delay / 3600);
      this.capture_delay_min = Math.floor((this.capture_delay % 3600) / 60);
      this.capture_delay_sec = this.capture_delay % 60;
    }
  }

  ngOnInit(): void {
    if (this.material && this.material.material_type === 'video') {
      this.max_duration = this.material.duration / 1000;
    } else if (this.materials && this.materials.length) {
      this.materials.forEach((e) => {
        if (
          e.material_type === 'video' &&
          e.duration / 1000 > this.max_duration
        ) {
          this.max_duration = e.duration / 1000;
        }
      });
    }
  }

  checkTimeDup() {
    this.isTimeDup = false;
    if (this.material?.capture_form) {
      Object.keys(this.material.capture_form).map((key) => {
        if (parseInt(this.material.capture_form[key]) === this.capture_delay)
          this.isTimeDup = true;
      });
    }
  }

  onChangeDelay(): void {
    if (typeof this.capture_delay_hour === 'string') {
      this.capture_delay_hour = parseInt(this.capture_delay_hour);
    }
    if (typeof this.capture_delay_min === 'string') {
      this.capture_delay_min = parseInt(this.capture_delay_min);
    }
    if (typeof this.capture_delay_sec === 'string') {
      this.capture_delay_sec = parseInt(this.capture_delay_sec);
    }
    this.capture_delay =
      this.capture_delay_hour * 3600 +
      this.capture_delay_min * 60 +
      this.capture_delay_sec;

    this.checkTimeDup();
  }

  getVideoDuration(): string {
    const delayHour = Math.floor(this.max_duration / 3600);
    const delayMinute = Math.floor((this.max_duration % 3600) / 60);
    const delaySecond = this.max_duration % 60;
    const hIndex = this.DELAY.HOUR.findIndex((e) => e.id === delayHour);
    const mIndex = this.DELAY.MINUTE.findIndex((e) => e.id === delayMinute);
    const sIndex = this.DELAY.SECOND.findIndex((e) => e.id === delaySecond);

    let delayTimeStr = '';
    if (hIndex > 0) {
      delayTimeStr += this.DELAY.HOUR[hIndex].text + ' ';
    }
    if (mIndex > 0) {
      delayTimeStr += this.DELAY.MINUTE[mIndex].text + ' ';
    }
    if (sIndex > 0) {
      delayTimeStr += this.DELAY.SECOND[sIndex].text;
    }
    if (!delayTimeStr) {
      delayTimeStr = 'Immediate';
    }
    return delayTimeStr;
  }

  onToggleImmediate(): void {
    this.delay_immediate = !this.delay_immediate;
    if (this.delay_immediate) {
      this.capture_delay = 0;
      this.checkTimeDup();
    } else {
      this.onChangeDelay();
    }
  }

  onSet(): void {
    if (this.max_duration && this.capture_delay > this.max_duration) {
      this.exceedDuration = true;
      return;
    } else {
      this.exceedDuration = false;
    }
    if (this.exceedDuration) return;
    this.checkTimeDup();
    if (this.isTimeDup) return;

    if (this.type === 'create')
      this.dialogRef.close({
        form_id: this.form_id,
        delay: this.capture_delay
      });
    else this.dialogRef.close({ form_id: '', delay: this.capture_delay });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
