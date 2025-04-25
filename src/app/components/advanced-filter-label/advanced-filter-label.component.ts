import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Label } from '@models/label.model';
import { LabelService } from '@services/label.service';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { SearchOption, TaskSearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-advanced-filter-label',
  templateUrl: './advanced-filter-label.component.html',
  styleUrls: ['./advanced-filter-label.component.scss']
})
export class AdvancedFilterLabelComponent implements OnInit, OnDestroy {
  labels: Label[] = [];
  groupizedLabels = {};
  labelLoadSubscription: Subscription;
  labelCondition: string[] = [];
  includeLabel = true;
  searchOption: SearchOption = new SearchOption();
  taskSearchOption: TaskSearchOption = new TaskSearchOption();
  @Output() filter = new EventEmitter();
  @Input() target: string;
  @Input() selectedTab: string;
  constructor(
    public labelService: LabelService,
    private contactService: ContactService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    if (this.target === 'task') {
      this.taskSearchOption = new TaskSearchOption().deserialize(
        JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
      );
      this.labelCondition = this.taskSearchOption.labels || [];
    } else {
      this.searchOption = new SearchOption().deserialize(
        JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
      );
      this.labelCondition = this.searchOption.labelCondition || [];
      this.includeLabel = !!this.searchOption.includeLabel;
    }
    this.labelLoadSubscription = this.labelService.allLabels$.subscribe(
      (labels) => {
        this.labels = [];
        const adminLabels = [];
        const otherLabels = [];
        labels.forEach((e) => {
          if (e.role == 'admin') {
            adminLabels.push(e);
          } else {
            otherLabels.push(e);
          }
        });
        otherLabels.sort((a, b) => {
          if (a.mine) {
            return -1;
          }
          if (b.mine) {
            return 1;
          }
        });
        let groupizedLabels = {};
        if (otherLabels.length) {
          groupizedLabels = _.groupBy(otherLabels, (e) => e.name);
        }
        for (const title in groupizedLabels) {
          const label = groupizedLabels[title][0];
          if (groupizedLabels[title].length > 1) {
            label['multiple'] = groupizedLabels[title].length;
          }
          if (!label.mine) {
            label['role'] = 'team';
          }
          this.labels.push(label);
        }

        this.labels = [...this.labels, ...adminLabels];
        this.groupizedLabels = groupizedLabels;
      }
    );
  }

  ngOnDestroy(): void {
    this.labelLoadSubscription && this.labelLoadSubscription.unsubscribe();
  }

  toggleLabels(label: Label | null): void {
    if (!label) {
      const pos = this.labelCondition.indexOf(null);
      if (pos !== -1) {
        this.labelCondition.splice(pos, 1);
      } else {
        this.labelCondition.push(null);
      }
      return;
    }
    if (label.role) {
      const pos = this.labelCondition.indexOf(label._id);
      if (pos !== -1) {
        this.labelCondition.splice(pos, 1);
      } else {
        this.labelCondition.push(label._id);
      }
    } else {
      const labelName = label.name;
      const sameLabels = this.groupizedLabels[labelName] || [label];
      if (sameLabels.length) {
        const sameLabelIds = sameLabels.map((e) => e._id);
        const pos = this.labelCondition.indexOf(label._id);
        if (pos !== -1) {
          this.labelCondition = _.difference(this.labelCondition, sameLabelIds);
        } else {
          this.labelCondition = _.union(this.labelCondition, sameLabelIds);
        }
      }
    }
  }

  toggleInclude(): void {
    this.includeLabel = !this.includeLabel;
  }

  save(): void {
    if (this.target === 'task') {
      this.filter.emit({
        labels: this.labelCondition
      });
    } else {
      this.filter.emit({
        includeLabel: this.includeLabel,
        labelCondition: this.labelCondition
      });
    }
  }
}
