import { Component, ElementRef, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ListType,
  ResourceCategory,
  TemplateType
} from '@core/enums/resources.enum';
import {
  BulkActionItem,
  SortTypeItem,
  TemplateItem,
  FilterTypeItem
} from '@core/interfaces/resources.interface';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { BulkActions } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { TemplateListService } from '@services/template-list.service';

@Component({
  selector: 'app-templates-team',
  templateUrl: './templates-team.component.html',
  styleUrls: ['./templates-team.component.scss'],
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
export class TemplatesTeamList extends ResourceListBase<
  TemplateItem,
  TemplateListService,
  TemplateType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'owner',
    'content',
    'resource',
    'type',
    'download_count',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.TEAM;
  SORT_TYPES: SortTypeItem[] = [
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' }
  ];
  FILTER_TYPES: FilterTypeItem<TemplateType>[] = [
    { id: TemplateType.ALL, label: 'All types' },
    { id: TemplateType.FOLDER, label: 'Folder' },
    { id: TemplateType.EMAIL, label: 'Email' },
    { id: TemplateType.TEXT, label: 'Text' }
  ];
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Library;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Library;
  sortType = this.SORT_TYPES[0];
  filterType = this.FILTER_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.TEMPLATE;
  BASE_URL = '/community/${id}/templates/';
  teamId = '';

  ICONS: { [key: string]: string } = {
    text: 'sms-sent',
    email: 'message',
    folder: 'folder'
  };

  @Input()
  set team(id: string) {
    this.teamId = id;
    this.BASE_URL = `/community/${this.teamId}/templates/`;
  }

  profileSubscription: Subscription;
  selectedRows = [] as string[];
  resourceLoading = new Map();
  data = new Map();

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

  handleSelect(item: any) {
    if (this.selectedRows.includes(item._id)) {
      this.selectedRows = this.selectedRows.filter(
        (row: string) => row !== item._id
      );
      this.resourceLoading.delete(item._id);
      this.data.delete(item._id);
    } else if (item.resource_count) {
      this.selectedRows.push(item._id);
      this.resourceLoading.set(item._id, true);
      const temp_data = [];
      this.service
        .getTemplateResources({ templates: [{ _id: item._id, type: 'any' }] })
        .subscribe((_res) => {
          if (_res?.status) {
            const count =
              (_res.data?.videos || []).length +
              (_res.data?.pdfs || []).length +
              (_res.data?.images || []).length;
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
              this.data.set(item._id, temp_data);
              this.resourceLoading.set(item._id, false);
            }
          }
        });
    }
  }
}
