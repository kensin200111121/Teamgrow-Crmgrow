import { Component, ElementRef, Input } from '@angular/core';
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
import { Team } from 'src/app/models/team.model';

@Component({
  selector: 'app-automations-team',
  templateUrl: './automations-team.component.html',
  styleUrls: ['./automations-team.component.scss'],
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
export class AutomationsTeamList extends ResourceListBase<
  AutomationItem,
  AutomationListService,
  AutomationType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'owner',
    'type',
    'label',
    'action-count',
    'created',
    'downloads',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.TEAM;
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
  BASE_URL = '/community/${id}/automations/';
  teamId = '';

  @Input()
  set team(id: string) {
    this.teamId = id;
    this.BASE_URL = `/community/${this.teamId}/automations/`;
  }

  isPackageAutomation = true;
  profileSubscription: Subscription;
  selectedAutomationResource: any;
  selectedRows = [] as string[];
  resourceLoading = new Map();
  data = new Map();
  automationResourceLoading: boolean;
  automationData: any;

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
    this.automationResourceLoading = false;
    this.selectedAutomationResource = [] as string[];
    this.automationData = [];
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

  handleSelect(item: any) {
    const resourcesCount =
      item.meta.videos.length + item.meta.pdfs.length + item.meta.images.length;
    if (this.selectedRows.includes(item._id)) {
      this.selectedRows = this.selectedRows.filter(
        (row: string) => row !== item._id
      );
      this.resourceLoading.delete(item._id);
      this.data.delete(item._id);
    } else if (resourcesCount) {
      this.selectedRows.push(item._id);
      this.resourceLoading.set(item._id, true);
      const temp_data = [];
      this.service.getRelatedResources(item._id).subscribe((_res) => {
        if (_res?.status) {
          const count =
            (_res.data?.videos || []).length +
            (_res.data?.pdfs || []).length +
            (_res.data?.images || []).length +
            (_res.data?.automations || []).length;
          if (count == 0) {
            this.resourceLoading.set(item._id, false);
          } else {
            _res.data.videos.map((video: any) => {
              temp_data.push({ ...video, type: 'Video' });
            });
            _res.data.images.map((image: any) => {
              temp_data.push({ ...image, type: 'Image' });
            });
            _res.data.pdfs.map((pdf: any) => {
              temp_data.push({ ...pdf, type: 'Pdf' });
            });
            _res.data.automations.map((automation: any) => {
              temp_data.push({ ...automation, type: 'Automation' });
            });
            this.data.set(item._id, temp_data);
            this.resourceLoading.set(item._id, false);
          }
        }
      });
    }
  }

  handleClick(item: any) {
    if (this.selectedAutomationResource.includes(item._id)) {
      this.selectedAutomationResource = this.selectedAutomationResource.filter(
        (resource: any) => resource !== item._id
      );
    } else {
      this.selectedAutomationResource.push(item._id);
    }
  }
}
