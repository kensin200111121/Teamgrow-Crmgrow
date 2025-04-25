import { Component, Input, OnInit } from '@angular/core';
import { Label } from '@models/label.model';
import { LabelService } from '@services/label.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-label-display',
  templateUrl: './label-display.component.html',
  styleUrls: ['./label-display.component.scss']
})
export class LabelDisplayComponent implements OnInit {
  @Input()
  public set value(val: string) {
    if (typeof val !== 'undefined') {
      const labels = this.labelService.allLabels.getValue();
      if (labels.length) {
        const selected = _.find(labels, (e) => e._id === val);
        this.label = selected && selected._id ? selected._id : '';
        this.labelObj = selected;
      } else {
        this.label = val;
      }
    }
  }
  label: string = '';
  labelObj: Label;
  labelsLoadSubscription: Subscription;
  defaultLabel = 'No Label';

  constructor(public labelService: LabelService) {}

  ngOnInit(): void {
    this.labelsLoadSubscription && this.labelsLoadSubscription.unsubscribe();
    this.labelsLoadSubscription = this.labelService.allLabels$.subscribe(
      (res) => {
        if (typeof this.label !== 'undefined') {
          const value = _.find(res, (e) => e._id === this.label);
          this.labelObj = value;
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.labelsLoadSubscription.unsubscribe();
  }
}
