import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Input,
  Output
} from '@angular/core';
import * as _ from 'lodash';
import { LabelService } from '@services/label.service';
import { COUNTRIES, DialogSettings } from '@constants/variable.constants';
import { SearchOption, MaterialCondition } from '@models/searchOption.model';
import { UserService } from '@services/user.service';
import { ContactService } from '@services/contact.service';
import { MatDialog } from '@angular/material/dialog';
import { FilterAddComponent } from '@components/filter-add/filter-add.component';
import { NotifyComponent } from '@components/notify/notify.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { FilterService } from '@services/filter.service';
import { Subscription } from 'rxjs';
import { TeamService } from '@services/team.service';
import { User } from '@models/user.model';
import { TabItem } from '@utils/data.types';
import { Label } from '@models/label.model';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-advanced-filter',
  templateUrl: './advanced-filter.component.html',
  styleUrls: ['./advanced-filter.component.scss']
})
export class AdvancedFilterComponent implements OnInit, OnDestroy {
  tabs: TabItem[] = [
    { label: 'Normal', id: 'normal', icon: '' },
    { label: 'Team', id: 'team', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];

  loading = false;
  submitted = false;
  selectedSavedFilter;
  savedFilters = [];
  status = 'clear';
  materialActions = [];
  unsubscribedActions = [];
  // COUNTRIES = COUNTRIES;
  COUNTRIES = this.contactService.COUNTRIES;
  activities = [];
  fromDate = '';
  toDate = '';
  brokerages = [];
  sources = [];

  selectedMaterialActions = '';
  selectedUnsubscribedActions = '';
  selectedMaterial = [];
  selectedUnsubscribed = [];
  searchOption: SearchOption = new SearchOption();

  removing = false;
  removeSubscription: Subscription;

  teamSubscription: Subscription;
  teams = [];
  teamMembers = {};
  profileSubscription: Subscription;

  teamOptions = {}; // {team_id: {flag: 1|0|-1, members: User[]}
  isShareWith = false;
  isShareBy = false;

  currentFilterId = '';

  @Output() onClose = new EventEmitter();

  @Input('searchStr')
  set searchStr(str: string) {
    this.searchOption.searchStr = str;
  }
  @Output() onChangeSearchStr = new EventEmitter();
  @Output() onChangeSearchOption = new EventEmitter();
  @Input('isInline') isInline = false;

  labels: Label[] = [];
  groupizedLabels = {};
  labelLoadSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    public labelService: LabelService,
    public contactService: ContactService,
    public userService: UserService,
    private teamService: TeamService,
    private filterService: FilterService
  ) {
    this.teamService.loadAll(false);
  }

  ngOnInit(): void {
    if (!this.isInline) {
      this.searchOption = this.contactService.searchOption.getValue();
      if (this.searchOption.materialCondition) {
        if (
          this.searchOption.materialCondition.sent_video?.flag ||
          this.searchOption.materialCondition.sent_image?.flag ||
          this.searchOption.materialCondition.sent_pdf?.flag
        ) {
          this.selectedMaterialActions = 'Material sent';
        }
        if (
          this.searchOption.materialCondition.watched_video?.flag ||
          this.searchOption.materialCondition.watched_image?.flag ||
          this.searchOption.materialCondition.watched_pdf?.flag
        ) {
          this.selectedMaterialActions = 'Material reviewed';
        }
        if (
          this.searchOption.materialCondition.not_sent_video?.flag ||
          this.searchOption.materialCondition.not_sent_pdf?.flag ||
          this.searchOption.materialCondition.not_sent_image?.flag
        ) {
          this.selectedMaterialActions = 'No material sent';
        }
        if (
          this.searchOption.materialCondition.not_watched_video?.flag ||
          this.searchOption.materialCondition.not_watched_pdf?.flag ||
          this.searchOption.materialCondition.not_watched_image?.flag
        ) {
          this.selectedMaterialActions = 'Material not reviewed';
        }
      }
      if (this.searchOption.hasTeamOptions()) {
        this.selectedTab = this.tabs[1];
      }

      this.teamOptions = this.searchOption.teamOptions;
      if (Object.keys(this.teamOptions).length) {
        for (const team_id in this.teamOptions) {
          const teamOption = this.teamOptions[team_id];
          if (teamOption.members && teamOption.members.length) {
            const members = this.teamMembers[team_id].filter(
              (e) => teamOption.members.indexOf(e._id) !== -1
            );
            teamOption.members = members;
            if (members.length === this.teamMembers[team_id].length) {
              teamOption.flag = 1;
            }
          }
        }
      }
    }
    this.materialActions = [
      {
        _id: 1,
        title: 'Material sent',
        count: 0
      },
      {
        _id: 2,
        title: 'No material sent',
        count: 0
      },
      {
        _id: 3,
        title: 'Material reviewed',
        count: 0
      },
      {
        _id: 4,
        title: 'Material not reviewed',
        count: 0
      }
    ];

    this.unsubscribedActions = [
      {
        _id: 1,
        title: 'Email Unsubscribed'
      },
      {
        _id: 2,
        title: 'Text Unsubscribed'
      }
    ];

    this.activities = [
      {
        _id: 1,
        title: 'added'
      },
      {
        _id: 2,
        title: 'added note'
      },
      {
        _id: 3,
        title: 'added task'
      },
      {
        _id: 4,
        title: 'called',
        feature: USER_FEATURES.DIALER
      },
      {
        _id: 5,
        title: 'opened email'
      },
      {
        _id: 6,
        title: 'clicked link'
      },
      {
        _id: 7,
        title: 'sent video',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 8,
        title: 'sent pdf',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 9,
        title: 'sent image',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 10,
        title: 'sent email',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 11,
        title: 'watched video',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 12,
        title: 'reviewed image',
        feature: USER_FEATURES.MATERIAL
      },
      {
        _id: 13,
        title: 'reviewed pdf',
        feature: USER_FEATURES.MATERIAL
      }
    ];

    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user._id) {
        this.teamSubscription = this.teamService.teams$.subscribe((teams) => {
          this.teams = teams.filter((e) => e.members.length);
          this.teams.forEach((e) => {
            const members = [...e.owner, ...e.members];
            const anotherMembers = members.filter((e) => e._id !== user._id);
            if (anotherMembers.length) {
              this.teamMembers[e._id] = [...anotherMembers];
            }
          });
        });
      }
    });

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
        this.labels = [...adminLabels];
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
        this.groupizedLabels = groupizedLabels;
      }
    );
  }

  ngOnDestroy() {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.teamSubscription && this.teamSubscription.unsubscribe();
    this.labelLoadSubscription && this.labelLoadSubscription.unsubscribe();
  }

  /**
   * Update the Search Str Subject in Contact Service.
   * @param str : string to search
   */
  updateSearchStr(str: string): void {
    this.searchOption.searchStr = str;
    // if (!this.isInline) {
    //   this.contactService.searchStr.next(str);
    // } else {
    //   this.onChangeSearchStr.emit(str);
    // }
    this.updateFilter();
  }
  clearSearchStr(): void {
    this.searchOption.searchStr = '';
    // if (!this.isInline) {
    //   this.contactService.searchStr.next('');
    // } else {
    //   this.onChangeSearchStr.emit('');
    // }
    this.updateFilter();
  }

  updateFilter(): void {
    if (!this.isInline) {
      this.contactService.searchOption.next(
        new SearchOption().deserialize(this.searchOption)
      );
    } else {
      this.onChangeSearchOption.emit(
        new SearchOption().deserialize(this.searchOption)
      );
    }
  }

  clearAllFilters(): void {
    this.currentFilterId = '';
    this.selectedMaterial = [];
    this.selectedUnsubscribed = [];
    this.selectedMaterialActions = '';
    this.selectedUnsubscribedActions = '';
    this.materialActions.forEach((action) => {
      action.count = 0;
    });
    this.searchOption = new SearchOption();
    if (!this.isInline) {
      this.contactService.searchOption.next(this.searchOption);
    } else {
      this.onChangeSearchOption.emit(this.searchOption);
    }
  }

  clearLabel(): void {
    this.searchOption.includeLabel = true;
    this.searchOption.labelCondition = [];
    if (!this.isInline) {
      this.contactService.searchOption.next(
        new SearchOption().deserialize(this.searchOption)
      );
    } else {
      this.onChangeSearchOption.emit(
        new SearchOption().deserialize(this.searchOption)
      );
    }
  }

  emitChangeSearchOption(searchOption): void {
    if (!this.isInline) {
      this.contactService.searchOption.next(
        new SearchOption().deserialize(searchOption)
      );
    } else {
      this.onChangeSearchOption.emit(
        new SearchOption().deserialize(searchOption)
      );
    }
  }

  applyFilters(): void {}

  saveFilters(): void {
    const searchOption = this.searchOption;
    if (!searchOption.getActiveOptions()) {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Advanced Filter',
          message: 'Please set the filter option at least one.',
          cancelLabel: 'Close'
        }
      });
      return;
    }
    this.dialog.open(FilterAddComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      data: {
        searchOption: this.searchOption,
        material: this.selectedMaterial
      }
    });
  }

  selectMaterialAction(title: string): void {
    if (this.selectedMaterialActions == title) {
      this.selectedMaterialActions = '';
      this.selectedMaterial = [];
      this.materialActions.forEach((action) => {
        action.count = 0;
      });
      this.searchOption.materialCondition = new MaterialCondition();
      this.emitChangeSearchOption(this.searchOption);
    } else {
      this.selectedMaterialActions = title;
      this.materialActions.forEach((action) => {
        action.count = 0;
      });
      this.searchOption.materialCondition = new MaterialCondition();
      if (title === 'Material sent') {
        this.searchOption.materialCondition.sent_video.flag = true;
        this.searchOption.materialCondition.sent_pdf.flag = true;
        this.searchOption.materialCondition.sent_image.flag = true;
      } else if (title === 'No material sent') {
        this.searchOption.materialCondition.not_sent_video.flag = true;
        this.searchOption.materialCondition.not_sent_pdf.flag = true;
        this.searchOption.materialCondition.not_sent_image.flag = true;
      } else if (title === 'Material reviewed') {
        this.searchOption.materialCondition.watched_video.flag = true;
        this.searchOption.materialCondition.watched_pdf.flag = true;
        this.searchOption.materialCondition.watched_image.flag = true;
      } else if (title === 'Material not reviewed') {
        this.searchOption.materialCondition.not_watched_video.flag = true;
        this.searchOption.materialCondition.not_watched_pdf.flag = true;
        this.searchOption.materialCondition.not_watched_image.flag = true;
      }
      this.emitChangeSearchOption(this.searchOption);
    }
  }
  selectUnsubscribedAction(option: string): void {
    if (this.selectedUnsubscribedActions == option) {
      this.selectedUnsubscribedActions = '';
      this.selectedUnsubscribed = [];
      this.searchOption.unsubscribed.email = false;
      this.searchOption.unsubscribed.text = false;
      this.emitChangeSearchOption(this.searchOption);
    } else {
      this.selectedUnsubscribedActions = option;
      if (option === 'email') {
        this.searchOption.unsubscribed.email = true;
        this.searchOption.unsubscribed.text = false;
      } else if (option === 'text') {
        this.searchOption.unsubscribed.text = true;
        this.searchOption.unsubscribed.email = false;
      }
      this.emitChangeSearchOption(this.searchOption);
    }
  }
  selectMaterial(): void {
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          title: 'Select media',
          multiple: false,
          onlyMine: false,
          buttonLabel: 'Select'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.materials) {
          this.selectedMaterial = [];
          this.selectedMaterial = [...this.selectedMaterial, ...res.materials];
          this.materialActions.forEach((action) => {
            action.count = 0;
            if (action.title == this.selectedMaterialActions) {
              action.count = res.length;
            }
          });
          if (
            this.selectedMaterial[0].material_type &&
            this.selectedMaterial[0].material_type.startsWith('video')
          ) {
            switch (this.selectedMaterialActions) {
              case 'Material sent':
                this.searchOption.materialCondition.sent_video.flag = true;
                this.searchOption.materialCondition.sent_image.flag = false;
                this.searchOption.materialCondition.sent_pdf.flag = false;
                this.searchOption.materialCondition.sent_video.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'No material sent':
                this.searchOption.materialCondition.not_sent_video.flag = true;
                this.searchOption.materialCondition.not_sent_image.flag = false;
                this.searchOption.materialCondition.not_sent_pdf.flag = false;
                this.searchOption.materialCondition.not_sent_video.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material reviewed':
                this.searchOption.materialCondition.watched_video.flag = true;
                this.searchOption.materialCondition.watched_image.flag = false;
                this.searchOption.materialCondition.watched_pdf.flag = false;
                this.searchOption.materialCondition.watched_video.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material not reviewed':
                this.searchOption.materialCondition.not_watched_video.flag =
                  true;
                this.searchOption.materialCondition.not_watched_image.flag =
                  false;
                this.searchOption.materialCondition.not_watched_pdf.flag =
                  false;
                this.searchOption.materialCondition.not_watched_video.material =
                  this.selectedMaterial[0]._id;
                break;
            }
          }
          if (
            this.selectedMaterial[0].material_type &&
            this.selectedMaterial[0].material_type.startsWith('pdf')
          ) {
            switch (this.selectedMaterialActions) {
              case 'Material sent':
                this.searchOption.materialCondition.sent_pdf.flag = true;
                this.searchOption.materialCondition.sent_video.flag = false;
                this.searchOption.materialCondition.sent_image.flag = false;
                this.searchOption.materialCondition.sent_pdf.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'No material sent':
                this.searchOption.materialCondition.not_sent_pdf.flag = true;
                this.searchOption.materialCondition.not_sent_video.flag = false;
                this.searchOption.materialCondition.not_sent_image.flag = false;
                this.searchOption.materialCondition.not_sent_pdf.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material reviewed':
                this.searchOption.materialCondition.watched_pdf.flag = true;
                this.searchOption.materialCondition.watched_video.flag = false;
                this.searchOption.materialCondition.watched_image.flag = false;
                this.searchOption.materialCondition.watched_pdf.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material not reviewed':
                this.searchOption.materialCondition.not_watched_pdf.flag = true;
                this.searchOption.materialCondition.not_watched_video.flag =
                  false;
                this.searchOption.materialCondition.not_watched_image.flag =
                  false;
                this.searchOption.materialCondition.not_watched_pdf.material =
                  this.selectedMaterial[0]._id;
                break;
            }
          }
          if (
            this.selectedMaterial[0].material_type &&
            this.selectedMaterial[0].material_type.startsWith('image')
          ) {
            switch (this.selectedMaterialActions) {
              case 'Material sent':
                this.searchOption.materialCondition.sent_image.flag = true;
                this.searchOption.materialCondition.sent_video.flag = false;
                this.searchOption.materialCondition.sent_pdf.flag = false;
                this.searchOption.materialCondition.sent_image.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'No material sent':
                this.searchOption.materialCondition.not_sent_image.flag = true;
                this.searchOption.materialCondition.not_sent_video.flag = false;
                this.searchOption.materialCondition.not_sent_pdf.flag = false;
                this.searchOption.materialCondition.not_sent_image.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material reviewed':
                this.searchOption.materialCondition.watched_image.flag = true;
                this.searchOption.materialCondition.watched_video.flag = false;
                this.searchOption.materialCondition.watched_pdf.flag = false;
                this.searchOption.materialCondition.watched_image.material =
                  this.selectedMaterial[0]._id;
                break;
              case 'Material not reviewed':
                this.searchOption.materialCondition.not_watched_image.flag =
                  true;
                this.searchOption.materialCondition.not_watched_video.flag =
                  false;
                this.searchOption.materialCondition.not_watched_pdf.flag =
                  false;
                this.searchOption.materialCondition.not_watched_image.material =
                  this.selectedMaterial[0]._id;
                break;
            }
          }
          this.emitChangeSearchOption(this.searchOption);
        }
      });
  }

  /**
   * Toggle Label for search
   * @param label : Label Id
   */
  toggleLabels(label: Label): void {
    if (!label) {
      const pos = this.searchOption.labelCondition.indexOf(null);
      if (pos !== -1) {
        this.searchOption.labelCondition.splice(pos, 1);
      } else {
        this.searchOption.labelCondition.push(null);
      }
      this.emitChangeSearchOption(this.searchOption);
      return;
    }
    if (label.role) {
      const pos = this.searchOption.labelCondition.indexOf(label._id);
      if (pos !== -1) {
        this.searchOption.labelCondition.splice(pos, 1);
      } else {
        this.searchOption.labelCondition.push(label._id);
      }
      this.emitChangeSearchOption(this.searchOption);
    } else {
      const labelName = label.name;
      const sameLabels = this.groupizedLabels[labelName] || [label];
      if (sameLabels.length) {
        const sameLabelIds = sameLabels.map((e) => e._id);
        const pos = this.searchOption.labelCondition.indexOf(label._id);
        if (pos !== -1) {
          this.searchOption.labelCondition = _.difference(
            this.searchOption.labelCondition,
            sameLabelIds
          );
        } else {
          // this.searchOption.labelCondition.push(label._id);
          this.searchOption.labelCondition = _.union(
            this.searchOption.labelCondition,
            sameLabelIds
          );
        }
        this.emitChangeSearchOption(this.searchOption);
      }
    }
  }

  toggleActivities(activity: string): void {
    const pos = this.searchOption.activityCondition.indexOf(
      this.activityDefine[activity]
    );
    if (pos !== -1) {
      this.searchOption.activityCondition.splice(pos, 1);
    } else {
      this.searchOption.activityCondition.push(this.activityDefine[activity]);
    }
    this.emitChangeSearchOption(this.searchOption);
    /* if (
      activity == 'sent image' ||
      activity == 'reviewed pdf' ||
      activity == 'reviewed image'
    ) {
      if (activity == 'sent image') {
        this.searchOption.lastMaterial.send_image.flag = !this.searchOption
          .lastMaterial.send_image.flag;
      }
      if (activity == 'reviewed pdf') {
        this.searchOption.lastMaterial.watched_pdf.flag = !this.searchOption
          .lastMaterial.watched_pdf.flag;
      }
      if (activity == 'reviewed image') {
        this.searchOption.lastMaterial.watched_image.flag = !this.searchOption
          .lastMaterial.watched_image.flag;
      }
      this.emitChangeSearchOption(this.searchOption);
    } else {
      const pos = this.searchOption.activityCondition.indexOf(
        this.activityDefine[activity]
      );
      if (pos !== -1) {
        this.searchOption.activityCondition.splice(pos, 1);
      } else {
        this.searchOption.activityCondition.push(this.activityDefine[activity]);
      }
      this.emitChangeSearchOption(this.searchOption);
    } */
  }

  toggleInclude(type: string): void {
    switch (type) {
      case 'label':
        this.searchOption.includeLabel = !this.searchOption.includeLabel;
        if (this.searchOption.labelCondition.length) {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
      case 'source':
        this.searchOption.includeSource = !this.searchOption.includeSource;
        if (this.searchOption.sourceCondition.length) {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
      case 'brokerage':
        this.searchOption.includeBrokerage =
          !this.searchOption.includeBrokerage;
        if (this.searchOption.brokerageCondition.length) {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
      case 'tag':
        this.searchOption.includeTag = !this.searchOption.includeTag;
        if (this.searchOption.tagsCondition.length) {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
      case 'stage':
        this.searchOption.includeStage = !this.searchOption.includeStage;
        if (this.searchOption.stagesCondition.length) {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
      case 'unsubscribed':
        this.searchOption.includeUnsubscribed =
          !this.searchOption.includeUnsubscribed;
        if (this.selectedUnsubscribedActions != '') {
          this.emitChangeSearchOption(this.searchOption);
        }
        break;
    }
  }

  toggleTeam(team_id: string): void {
    const teamOption = this.teamOptions[team_id];
    if (teamOption) {
      if (teamOption.flag === -1) {
        teamOption.flag = 1;
        teamOption.members = [];
      } else if (teamOption.flag === 0) {
        teamOption.flag = 1;
        teamOption.members = [];
      } else if (teamOption.flag === 1) {
        teamOption.flag = -1;
        teamOption.members = [];
      }
    } else {
      this.teamOptions[team_id] = {
        flag: 1,
        members: []
      };
    }
    this.changeTeamSearch();
  }

  changeTeamMemberOptions(team_id: string, event: User[]): void {
    let teamOption = this.teamOptions[team_id];
    if (teamOption) {
      if (event.length) {
        if (event.length === this.teamMembers[team_id].length) {
          this.teamOptions[team_id].flag = 1;
        } else {
          this.teamOptions[team_id].flag = 0;
        }
      } else {
        this.teamOptions[team_id].flag = -1;
      }
    } else {
      this.teamOptions[team_id] = {
        flag: 0,
        members: []
      };
      this.teamOptions[team_id].members = event;
      if (event.length) {
        if (event.length === this.teamMembers[team_id].length) {
          this.teamOptions[team_id].flag = 1;
        } else {
          this.teamOptions[team_id].flag = 0;
        }
      } else {
        this.teamOptions[team_id].flag = -1;
      }
    }
    teamOption = this.teamOptions[team_id];
    this.changeTeamSearch();
  }

  changeTeamSearch(): void {
    let teamOptions = JSON.parse(JSON.stringify(this.teamOptions));
    for (const key in teamOptions) {
      if (teamOptions[key].flag === -1) {
        delete teamOptions[key];
      } else {
        const members = teamOptions[key].members.map((e) => e._id);
        teamOptions[key].members = members;
      }
    }
    let isShareBy = this.isShareBy;
    let isShareWith = this.isShareWith;
    if (!(this.isShareBy || this.isShareWith)) {
      isShareBy = true;
      isShareWith = true;
    }
    if (Object.keys(teamOptions).length) {
      for (const key in teamOptions) {
        if (isShareBy) {
          if (
            !teamOptions[key].members.length ||
            teamOptions[key].members.length === this.teamMembers[key].length
          ) {
            teamOptions[key]['share_by'] = {
              flag: 1
            };
          } else {
            teamOptions[key]['share_by'] = {
              flag: 0,
              members: teamOptions[key].members
            };
          }
        } else {
          teamOptions[key]['share_by'] = {
            flag: -1,
            members: []
          };
        }
        if (isShareWith) {
          if (
            !teamOptions[key].members.length ||
            teamOptions[key].members.length === this.teamMembers[key].length
          ) {
            teamOptions[key]['share_with'] = {
              flag: 1
            };
          } else {
            teamOptions[key]['share_with'] = {
              flag: 0,
              members: teamOptions[key].members
            };
          }
        } else {
          teamOptions[key]['share_with'] = {
            flag: -1,
            members: []
          };
        }
        if (isShareWith && isShareBy) {
          teamOptions[key].flag = 1;
        } else if (isShareWith || isShareBy) {
          teamOptions[key].flag = 0;
        } else {
          teamOptions[key].flag = -1;
        }
        delete teamOptions[key].members;
      }
    } else {
      isShareBy = this.isShareBy;
      isShareWith = this.isShareWith;
      if (isShareBy || isShareWith) {
        teamOptions = JSON.parse(JSON.stringify(this.teamOptions));
        for (const key in this.teamOptions) {
          if (isShareBy) {
            teamOptions[key]['share_by'] = {
              flag: 1,
              members: []
            };
          } else {
            teamOptions[key]['share_by'] = {
              flag: -1,
              members: []
            };
          }
          if (isShareWith) {
            teamOptions[key]['share_with'] = {
              flag: 1,
              members: []
            };
          } else {
            teamOptions[key]['share_with'] = {
              flag: -1,
              members: []
            };
          }
          if (isShareBy && isShareWith) {
            teamOptions[key]['flag'] = 1;
          } else if (isShareBy || isShareWith) {
            teamOptions[key]['flag'] = 0;
          } else {
            teamOptions[key]['flag'] = -1;
          }
        }
      } else {
        teamOptions = {};
      }
    }
    this.searchOption.teamOptions = teamOptions;
    this.emitChangeSearchOption(this.searchOption);
  }

  enableTeamSearchOption(): boolean {
    if (Object.keys(this.searchOption.teamOptions).length) {
      return true;
    } else {
      return false;
    }
  }

  changeShareOption(option: string): void {
    if (option === 'share_with') {
      this.isShareWith = !this.isShareWith;
    } else {
      this.isShareBy = !this.isShareBy;
    }
    this.changeTeamSearch();
  }

  close(): void {
    this.onClose.emit();
  }

  changeCurrentFilter(filter: any): void {
    if (filter && filter._id) {
      this.currentFilterId = filter._id;
      this.emitChangeSearchOption(filter.content);
      this.searchOption = new SearchOption().deserialize(filter.content);
    } else {
      this.clearAllFilters();
    }
  }

  updateFilters(): void {
    if (this.currentFilterId) {
      this.dialog.open(FilterAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        data: {
          searchOption: this.searchOption,
          material: this.selectedMaterial,
          _id: this.currentFilterId
        }
      });
    }
  }

  removeFilters(): void {
    if (this.currentFilterId) {
      this.dialog
        .open(ConfirmComponent, {
          data: {
            title: 'Delete filter',
            message: 'Are you sure to delete the filter?',
            cancelLabel: 'No',
            confirmLabel: 'Delete',
            mode: 'warning'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          console.log(res);
          if (res) {
            this.removing = true;
            this.removeSubscription && this.removeSubscription.unsubscribe();
            this.removeSubscription = this.filterService
              .remove(this.currentFilterId)
              .subscribe((status) => {
                this.removing = false;
                if (status) {
                  // Remove from Service Subject
                  this.filterService.remove$(this.currentFilterId);
                  this.currentFilterId = '';
                  this.clearAllFilters();
                }
              });
          }
        });
    }
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  activityDefine = {
    added: 'contacts',
    'added note': 'notes',
    'added task': 'follow_ups',
    called: 'phone_logs',
    'opened email': 'email_trackers',
    'clicked link': 'clicked_link',
    'sent video': 'videos',
    'sent pdf': 'pdfs',
    'sent image': 'images',
    'sent email': 'emails',
    'watched video': 'video_trackers',
    'reviewed image': 'image_trackers',
    'reviewed pdf': 'pdf_trackers'
  };
}
