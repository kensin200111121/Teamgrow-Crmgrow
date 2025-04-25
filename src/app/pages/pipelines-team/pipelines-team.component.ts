import { SspaService } from '../../services/sspa.service';
import { Component, ElementRef, Input } from '@angular/core';
import {
  ListType,
  PipelineType,
  ResourceCategory
} from '@core/enums/resources.enum';
import {
  BulkActionItem,
  FilterTypeItem,
  PipelineItem,
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
import { Team } from '@models/team.model';
import { PipelineListService } from '@app/services/pipeline-list.service';

@Component({
  selector: 'app-pipelines-team',
  templateUrl: './pipelines-team.component.html',
  styleUrls: ['./pipelines-team.component.scss']
})
export class PipelinesTeamList extends ResourceListBase<
  PipelineItem,
  PipelineListService,
  PipelineType
> {
  FOLDER_ACTIONS: BulkActionItem[];
  DISPLAY_COLUMNS: string[] = ['title', 'owner', 'downloads', 'action'];
  LIST_TYPE: ListType = ListType.TEAM;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.PIPELINE;
  SORT_TYPES: SortTypeItem[];
  sortType: SortTypeItem;
  FILTER_TYPES: FilterTypeItem<PipelineType>[];
  filterType: FilterTypeItem<PipelineType>;
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Library;
  BASE_URL = '/community';
  teamId = '';
  selectedTeam: Team = new Team();
  siteUrl = environment.website;

  @Input()
  set team(teamInfo: Team) {
    this.selectedTeam = teamInfo;
    this.teamId = teamInfo._id;
    this.BASE_URL = `/community/${this.teamId}/pipelines/`;
  }

  constructor(
    protected service: PipelineListService,
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
