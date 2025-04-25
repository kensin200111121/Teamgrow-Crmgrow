import { Component, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AutomationType,
  ListType,
  ResourceCategory
} from '@core/enums/resources.enum';
import {
  AutomationItem,
  BulkActionItem,
  FilterTypeItem,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { ToastrService } from 'ngx-toastr';
import { BulkActions } from '@constants/variable.constants';
import { AutomationListService } from '@services/automation-list.service';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-automations-library',
  templateUrl: './automations-library.component.html',
  styleUrls: ['./automations-library.component.scss'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class AutomationsLibraryList extends ResourceListBase<
  AutomationItem,
  AutomationListService,
  AutomationType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'owner',
    'type',
    // 'label',
    'action-count',
    'created',
    'downloads',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.LIBRARY;
  FILTER_TYPES: FilterTypeItem<AutomationType>[] = [
    { id: AutomationType.ALL, label: 'All types' },
    { id: AutomationType.FOLDER, label: 'Folder' },
    { id: AutomationType.CONTACT, label: 'Contact' },
    { id: AutomationType.DEAL, label: 'Deal' }
  ];
  filterType = this.FILTER_TYPES[0];
  SORT_TYPES: SortTypeItem[];
  sortType: SortTypeItem;
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Library;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Library;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.AUTOMATION;
  BASE_URL = '/automations/library';

  isPackageAutomation = true;

  profileSubscription: Subscription;

  constructor(
    protected service: AutomationListService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected route: ActivatedRoute,
    protected router: Router,
    protected userService: UserService,
    protected myElement: ElementRef
  ) {
    super();
    this.initSubscribers();
    this.sortField = 'type';
    this.sortDir = true;
  }

  initSubscribers(): void {
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.isPackageAutomation = res.automation_info?.is_enabled;
    });
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
