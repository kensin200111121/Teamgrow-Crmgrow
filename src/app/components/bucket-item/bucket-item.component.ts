import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SphereService } from '@app/services/sphere.service';
import { IBucket } from '@app/types/buckete';

@Component({
  selector: 'app-bucket-item',
  templateUrl: './bucket-item.component.html',
  styleUrls: ['./bucket-item.component.scss']
})
export class BucketItemComponent implements OnInit {
  private _bucket: IBucket;
  saving = false;
  removing = false;
  isChanged = false;

  form = new FormGroup({
    name: new FormControl(''),
    duration: new FormControl(2)
  });

  @Output() save: EventEmitter<IBucket> = new EventEmitter();
  @Output() remove: EventEmitter<boolean> = new EventEmitter();

  @Input()
  set bucket(val: IBucket) {
    this._bucket = val;
    this.initForm();
  }

  get bucket(): IBucket {
    return this._bucket;
  }

  get title(): string {
    return this._bucket.name || 'New Sphere Bucket';
  }

  constructor(private sphereService: SphereService) {}

  ngOnInit(): void {
    this.form.valueChanges.subscribe((data) => {
      if (
        data.name !== this.bucket.name ||
        data.duration !== this.bucket.duration
      ) {
        this.isChanged = true;
      } else {
        this.isChanged = false;
      }
    });
  }

  initForm(): void {
    this.form.patchValue({
      name: this._bucket.name,
      duration: this._bucket.duration
    });
  }

  reset(): void {
    this.initForm();
  }

  onSave(): void {
    this.saving = true;

    if (this._bucket._id) {
      this.sphereService
        .updateBucket(this._bucket._id, this.form.value)
        .subscribe((res) => {
          this.saving = false;
          res &&
            this.save.emit({
              ...this._bucket,
              ...this.form.value
            });
        });
    } else {
      this.sphereService
        .createBucket({
          ...this.form.value,
          score: this._bucket.score
        })
        .subscribe((data) => {
          if (data) {
            this._bucket = data;
            data && this.save.emit(data);
          }
          this.saving = false;
        });
    }
  }

  onRemove(): void {
    this.removing = true;
    this.sphereService.removeBucket(this._bucket._id).subscribe((res) => {
      this.removing = false;
      res && this.remove.emit(res);
    });
  }
}
