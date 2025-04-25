import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Team } from '@models/team.model';
import { UserService } from '@services/user.service';
import { TeamService } from '@services/team.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import * as _ from 'lodash';
import { ResourceCategory } from '@core/enums/resources.enum';
import { MaterialListService } from '@services/material-list.service';
import { AutomationListService } from '@services/automation-list.service';
import { TemplateListService } from '@services/template-list.service';
import { PipelineListService } from '@services/pipeline-list.service';
import {
  CheckRequest,
  CheckRequestItem,
  ShareRequest,
  StopShareRequest
} from '@core/interfaces/resources.interface';

@Component({
  selector: 'app-team-material-share',
  templateUrl: './team-material-share.component.html',
  styleUrls: ['./team-material-share.component.scss']
})
export class TeamMaterialShareComponent implements OnInit {
  sharing = false;
  checking = false;

  shareType: ResourceCategory;
  isUnshare = false;
  dataToShare: Record<string, CheckRequestItem[]>;

  // FOR TEAM SELECTION
  selectedTeam: Team;
  userId = '';
  teams = [];
  selectedTeams: Team[] = [];
  sharedTeams = [];
  internalTeamCount = 0;
  communityCount = 0;
  isInternalSelect = false;
  profileSubscription: Subscription;
  listService:
    | TemplateListService
    | AutomationListService
    | MaterialListService
    | PipelineListService;
  constructor(
    private dialog: MatDialog,
    public teamService: TeamService,
    private userService: UserService,
    private materialListService: MaterialListService,
    private automationListService: AutomationListService,
    private templateListService: TemplateListService,
    private pipelineListService: PipelineListService,
    private dialogRef: MatDialogRef<TeamMaterialShareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    this.teamService.loadAll(true);
  }

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      const profile = this.userService.profile.getValue();
      this.userId = profile._id;
    });

    if (this.data) {
      this.shareType = this.data.type;
      this.isUnshare = this.data.unshare;
      this.dataToShare = this.data.resources;
      this.sharedTeams = this.data.sharedTeams || [];
    }

    switch (this.shareType) {
      case ResourceCategory.AUTOMATION:
        this.listService = this.automationListService;
        break;
      case ResourceCategory.TEMPLATE:
        this.listService = this.templateListService;
        break;
      case ResourceCategory.MATERIAL:
        this.listService = this.materialListService;
        break;
      case ResourceCategory.PIPELINE:
        this.listService = this.pipelineListService;
        break;
    }

    this.load();
  }

  load(): void {
    this.teamService.teams$.subscribe((res) => {
      let teams = res;
      if (this.sharedTeams?.length) {
        teams = teams.filter((e) => !this.sharedTeams.includes(e._id));
      }
      const internalTeam = teams.filter((e) => e.is_internal);
      if (!this.isInternalSelect && internalTeam.length) {
        this.internalTeamCount = internalTeam.length;
        this.communityCount = teams.length - internalTeam.length;
        this.selectedTeam = internalTeam[0];
        this.select();
        this.isInternalSelect = true;
      } else {
        this.communityCount = teams.length;
      }
      if (this.selectedTeams.length) {
        teams = teams.filter(
          (o1) => !this.selectedTeams.some((o2) => o1._id === o2._id)
        );
      }
      const editableTeams = teams.filter((e) => {
        const ownerIds = e.owner.map((e) => e._id);
        const editorIds = e.editors.map((e) => e._id);
        return (
          ownerIds.includes(this.userId) || editorIds.includes(this.userId)
        );
      });

      if (this.isUnshare) {
        const resources = {
          videos: [],
          pdfs: [],
          images: [],
          email_templates: [],
          automations: [],
          folders: []
        };
        (this.dataToShare.materials || []).forEach((e) => {
          switch (e.type) {
            case 'folder':
              resources.folders.push(e._id);
              break;
            case 'video':
              resources.videos.push(e._id);
              break;
            case 'pdf':
              resources.pdfs.push(e._id);
              break;
            case 'image':
              resources.images.push(e._id);
              break;
          }
        });
        (this.dataToShare.templates || []).forEach((e) => {
          if (e.type === 'folder') {
            resources.folders.push(e._id);
          } else {
            resources.email_templates.push(e._id);
          }
        });
        (this.dataToShare.automations || []).forEach((e) => {
          if (e.type === 'folder') {
            resources.folders.push(e._id);
          } else {
            resources.automations.push(e._id);
          }
        });
        this.teams = editableTeams.filter((team) => {
          const fields = [
            'videos',
            'pdfs',
            'images',
            'email_templates',
            'automations',
            'folders'
          ];
          let unsharable = false;
          fields.some((field) => {
            const count = _.intersection(team[field], resources[field]).length;
            if (count) {
              unsharable = true;
            }
            return count ? true : false;
          });
          return unsharable;
        });
      } else {
        this.teams = editableTeams;
      }
    });
    this.teamService.loadAll(false);
  }

  share(): void {
    this.sharing = true;
    if (this.shareType === 'material') {
      this.shareImpl();
    } else {
      this.checkShare();
    }
  }

  unshare(): void {
    this.sharing = true;
    if (this.shareType === 'template') {
      this.stopShareImpl();
    } else {
      this.checkStopShare();
    }
  }

  shareImpl(): void {
    const teamIds = this.selectedTeams.map((e) => e._id);
    const data: ShareRequest = {
      team_ids: teamIds,
      ...this.dataToShare
    };
    this.listService.share(data).subscribe((res) => {
      this.sharing = false;

      const sharedTeamInfo = this.selectedTeams.map((e) => ({
        _id: e._id,
        name: e.name
      }));
      this.dialogRef.close({ ...res, sharedTeamInfo });
    });
  }

  checkShare(): void {
    const data: CheckRequest = { ...this.dataToShare };
    this.listService.checkShare(data).subscribe((res) => {
      if (res?.status) {
        const count =
          (res.data?.videos || []).length +
          (res.data?.pdfs || []).length +
          (res.data?.images || []).length +
          (res.data?.titles || []).length;
        if (count == 0) {
          // share
          this.shareImpl();
        } else {
          let title;
          if (this.shareType === 'automation') {
            title = 'Share Automations';
          } else if (this.shareType === 'pipeline') {
            title = 'Share Pipeline';
          } else {
            title = 'Share Templates';
          }
          const dialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title,
              message:
                "For now, this selected resource includes following resources. These resources wouldn't be shared to the community together. But when other user download your shared resource, related resources would be downloaded as well.",
              titles: res['data'].titles || [],
              videos: res['data'].videos || [],
              images: res['data'].images || [],
              pdfs: res['data'].pdfs || [],
              confirmLabel: 'Yes',
              cancelLabel: 'No'
            }
          });
          dialog.afterClosed().subscribe((res) => {
            if (res) {
              this.shareImpl();
            } else {
              this.sharing = false;
            }
          });
        }
      } else {
        this.sharing = false;
      }
    });
  }

  stopShareImpl(): void {
    const teamIds = this.selectedTeams.map((e) => e._id);
    const data: StopShareRequest = {
      team_ids: teamIds,
      ...this.dataToShare
    };
    this.listService.stopShare(data).subscribe((res) => {
      // close dialog
      this.sharing = false;
      if (res) {
        this.dialogRef.close(true);
      }
    });
  }

  checkStopShare(): void {
    const teamIds = this.selectedTeams.map((e) => e._id);
    const data: StopShareRequest = {
      team_ids: teamIds,
      ...this.dataToShare
    };
    this.listService.checkStopShare(data).subscribe((res) => {
      if (res?.status) {
        const count =
          (res.data?.folders || []).length +
          (res.data?.videos || []).length +
          (res.data?.pdfs || []).length +
          (res.data?.images || []).length +
          (res.data?.titles || []).length +
          (res.data?.templates || []).length;
        if (count == 0) {
          this.stopShareImpl();
        } else {
          let title;
          if (this.shareType === 'automation') {
            title = 'Stop Share Automations';
          } else if (this.shareType === 'material') {
            title = 'Stop Share Materials';
          }
          if (res?.is_root) {
            const dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                type: 'stop share',
                title,
                message: 'All of these should be stop share!',
                folders: res['data'].folders || [],
                titles: res['data'].titles || [],
                videos: res['data'].videos || [],
                images: res['data'].images || [],
                pdfs: res['data'].pdfs || [],
                templates: res['data'].templates || []
              }
            });
            dialog.afterClosed().subscribe((result) => {
              let _data;
              if (result?.status) {
                _data = {
                  ...data,
                  bulk_data: res.data
                };
              } else {
                _data = data;
              }
              this.listService.bulkStopShare(_data).subscribe((_res) => {
                if (_res) {
                  this.dialogRef.close(true);
                } else {
                  this.sharing = false;
                }
              });
            });
          } else {
            const dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title,
                message: 'Stop share failed!',
                folders: res['data'].folders || [],
                titles: res['data'].titles || [],
                videos: res['data'].videos || [],
                images: res['data'].images || [],
                pdfs: res['data'].pdfs || [],
                templates: res['data'].templates || []
              }
            });

            dialog.afterClosed().subscribe((result) => {
              let _data;
              if (result?.status) {
                _data = {
                  ...data,
                  bulk_data: res.data
                };
              } else {
                _data = data;
              }
              this.listService.bulkStopShare(_data).subscribe((_res) => {
                if (_res) {
                  this.dialogRef.close(true);
                } else {
                  this.sharing = false;
                }
              });
            });
          }
        }
      } else {
        this.sharing = false;
      }
    });
  }

  select(): void {
    if (
      this.selectedTeam &&
      this.selectedTeams.indexOf(this.selectedTeam) == -1
    ) {
      this.selectedTeams.push(this.selectedTeam);
      const listIndex = this.teams.indexOf(this.selectedTeam);
      this.teams.splice(listIndex, 1);
    }
    this.selectedTeam = null;
  }

  cancelTeam(team: Team): void {
    this.selectedTeam = null;
    const index = this.selectedTeams.indexOf(team);
    this.selectedTeams.splice(index, 1);
    this.teams.push(team);
  }
}
