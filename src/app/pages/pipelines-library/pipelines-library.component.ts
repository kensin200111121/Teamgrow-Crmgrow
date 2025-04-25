import { Component, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PipelineType,
  ListType,
  ResourceCategory
} from '@core/enums/resources.enum';
import {
  PipelineItem,
  BulkActionItem,
  SortTypeItem,
  FilterTypeItem
} from '@core/interfaces/resources.interface';
import { ToastrService } from 'ngx-toastr';
import { BulkActions } from '@constants/variable.constants';
import { PipelineListService } from '@services/pipeline-list.service';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pipelines-library',
  templateUrl: './pipelines-library.component.html',
  styleUrls: ['./pipelines-library.component.scss']
})
export class PipelinesLibraryListComponent extends ResourceListBase<
  PipelineItem,
  PipelineListService,
  PipelineType
> {
  FILTER_TYPES: FilterTypeItem<PipelineType>[];
  filterType: FilterTypeItem<PipelineType>;
  SORT_TYPES: SortTypeItem[];
  sortType: SortTypeItem;
  DISPLAY_COLUMNS: string[] = [
    'title',
    'owner',
    'shared with',
    'downloads-count',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.LIBRARY;
  BULK_ACTIONS: BulkActionItem[] = BulkActions.PipelineLibrary;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.PipelineLibrary;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.PIPELINE;
  BASE_URL = '/pipelines-library';

  profileSubscription: Subscription;

  constructor(
    protected service: PipelineListService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected route: ActivatedRoute,
    protected router: Router,
    protected userService: UserService,
    protected myElement: ElementRef
  ) {
    super();
    this.sortField = 'type';
    this.sortDir = true;
  }

  doAction(action: BulkActionItem, elements?: string[]): void {
    switch (action.command) {
      case 'download':
        this.download();
        break;
      case 'stop share':
        this.stopShareBulk();
        break;
    }
  }

  doFolderAction(action: BulkActionItem): void {
    switch (action.command) {
      case 'download':
        this.download();
        break;
    }
  }
}
