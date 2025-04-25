import { SspaService } from '../../services/sspa.service';
import { Component, ElementRef, Input } from '@angular/core';
import { MaterialListService } from '@services/material-list.service';
import {
  ListType,
  MaterialType,
  ResourceCategory
} from '@core/enums/resources.enum';
import {
  BulkActionItem,
  FilterTypeItem,
  MaterialItem,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { BulkActions } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import * as _ from 'lodash';
import { environment } from '@environments/environment';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-materials-team',
  templateUrl: './materials-team.component.html',
  styleUrls: ['./materials-team.component.scss']
})
export class MaterialsTeamList extends ResourceListBase<
  MaterialItem,
  MaterialListService,
  MaterialType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'name',
    'owner',
    'type',
    'downloads',
    'action'
  ];
  LIST_TYPE: ListType = ListType.TEAM;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.MATERIAL;
  SORT_TYPES: SortTypeItem[] = [
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' }
  ];
  sortType = this.SORT_TYPES[0];
  FILTER_TYPES: FilterTypeItem<MaterialType>[] = [
    { id: MaterialType.ALL, label: 'All types' },
    { id: MaterialType.FOLDER, label: 'Folder' },
    { id: MaterialType.VIDEO, label: 'Video' },
    { id: MaterialType.PDF, label: 'Pdf' },
    { id: MaterialType.IMAGE, label: 'Image' }
  ];
  filterType = this.FILTER_TYPES[0];
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Library;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Library;
  BASE_URL = '/community';
  teamId = '';
  siteUrl = environment.website;

  @Input()
  set team(id: string) {
    this.teamId = id;
    this.BASE_URL = `/community/${this.teamId}/materials/`;
  }

  constructor(
    protected service: MaterialListService,
    protected teamService: TeamService,
    protected userService: UserService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected router: Router,
    protected myElement: ElementRef,
    protected route: ActivatedRoute,
    public sspaService: SspaService
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
