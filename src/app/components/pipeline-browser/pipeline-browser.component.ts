import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResourceBrowserBase } from '@components/resource-browser-base/resource-browser-base.component';
import {
  FilterTypeItem,
  PipelineItem,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import {
  ListType,
  PipelineType,
  ResourceCategory
} from '@core/enums/resources.enum';
import { PipelineListService } from '@app/services/pipeline-list.service';

@Component({
  selector: 'app-pipeline-browser',
  templateUrl: './pipeline-browser.component.html',
  styleUrls: ['./pipeline-browser.component.scss']
})
export class PipelineBrowserComponent
  extends ResourceBrowserBase<PipelineItem, PipelineListService, PipelineType>
  implements OnInit, OnDestroy
{
  SORT_TYPES: FilterTypeItem<PipelineType>[] = [];
  sortType: FilterTypeItem<PipelineType>;
  DISPLAY_COLUMNS = ['select', 'title'];
  LIST_TYPE: ListType = ListType.OWN;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.PIPELINE;

  sharing = false;
  shareSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    protected dialogRef: MatDialogRef<PipelineBrowserComponent>,
    protected service: PipelineListService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    super();
    if (this.data.hidePipelines && this.data.hidePipelines.length > 0) {
      this.hideItems = this.data.hidePipelines;
    }
  }

  ngOnInit(): void {
    this.goToFolder('');
  }

  ngOnDestroy(): void {}
}
