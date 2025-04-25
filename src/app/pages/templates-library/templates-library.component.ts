import { Component, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ListType,
  ResourceCategory,
  TemplateType
} from '@core/enums/resources.enum';
import {
  BulkActionItem,
  FilterTypeItem,
  SortTypeItem,
  TemplateItem
} from '@core/interfaces/resources.interface';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { BulkActions } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { TemplateListService } from '@services/template-list.service';

@Component({
  selector: 'app-templates-library',
  templateUrl: './templates-library.component.html',
  styleUrls: ['./templates-library.component.scss']
})
export class TemplatesLibraryList extends ResourceListBase<
  TemplateItem,
  TemplateListService,
  TemplateType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'owner',
    'share',
    'content',
    'type',
    'download_count',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.LIBRARY;
  FILTER_TYPES: FilterTypeItem<TemplateType>[] = [
    { id: TemplateType.ALL, label: 'All types' },
    { id: TemplateType.FOLDER, label: 'Folder' },
    { id: TemplateType.EMAIL, label: 'Email' },
    { id: TemplateType.TEXT, label: 'Text' }
  ];
  filterType: FilterTypeItem<TemplateType> = this.FILTER_TYPES[0];
  SORT_TYPES: SortTypeItem[] = [
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' }
  ];
  sortType = this.SORT_TYPES[0];
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Library;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Library;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.TEMPLATE;
  BASE_URL = '/templates/library';

  ICONS: { [key: string]: string } = {
    text: 'sms-sent',
    email: 'message',
    folder: 'folder'
  };

  profileSubscription: Subscription;

  constructor(
    protected service: TemplateListService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected route: ActivatedRoute,
    protected router: Router,
    protected userService: UserService,
    protected myElement: ElementRef
  ) {
    super();
  }

  doAction(action: BulkActionItem): void {
    switch (action.command) {
      case 'download':
        this.download();
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
