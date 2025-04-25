import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AnalyticsSearchOptionCategories } from '@constants/default.constants';
import { SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { LabelService } from '@services/label.service';
import { TeamService } from '@services/team.service';
import * as _ from 'lodash';
import { MatMenuTrigger } from '@angular/material/menu';
import { DealsService } from '@services/deals.service';
import {
  CONTACT_LIST_TYPE,
  DEFAULT_LIST_TYPE_IDS
} from '@app/constants/variable.constants';
import { FilterService } from '@app/services/filter.service';

interface OptGroup {
  name: string;
  include: boolean;
  items: string[];
}

@Component({
  selector: 'app-filter-options',
  templateUrl: './filter-options.component.html',
  styleUrls: ['./filter-options.component.scss']
})
export class FilterOptionsComponent implements OnInit, OnDestroy {
  // Constants
  AnalyticsConditionCategories = AnalyticsSearchOptionCategories;
  labelCondition = [];
  activities = [];
  materialActions = [];
  selectedMaterialActions = '';
  destroy$ = new Subject();

  loadSubscription: Subscription;

  @Output() changeFilter = new EventEmitter();

  optionSettingSubscription: Subscription;
  team;
  _option: SearchOption = null;
  _optGroups: OptGroup[] = [];
  labelDic = {};
  stageDic = {};
  activityDic = {
    contacts: 'added',
    notes: 'added note',
    follow_ups: 'added task',
    phone_logs: 'called',
    email_trackers: 'opened email',
    clicked_link: 'clicked link',
    videos: 'sent video',
    pdfs: 'sent pdf',
    images: 'sent image',
    emails: 'sent email',
    video_trackers: 'watched video',
    watched_image: 'reviewed image',
    watched_pdf: 'reviewed pdf'
  };
  activityDateString = '';
  customDateString = '';

  listTypeFilter: {
    _id: 'own' | 'team' | 'private' | 'prospect' | 'assigned' | 'pending';
    label: string;
  } | null = null;

  constructor(
    private contactService: ContactService,
    private labelService: LabelService,
    private dealService: DealsService,
    private filterService: FilterService,

    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.optionSettingSubscription =
      this.contactService.searchOption$.subscribe((option) => {
        this._option = option;
        this.initOptGroups();
      });

    this.contactService.listTypeOption$
      .pipe(takeUntil(this.destroy$))
      .subscribe((listType) => {
        if (DEFAULT_LIST_TYPE_IDS.includes(listType)) {
          this.listTypeFilter = CONTACT_LIST_TYPE.find(
            (item) => item._id === listType
          ) as {
            _id:
              | 'own'
              | 'team'
              | 'private'
              | 'prospect'
              | 'assigned'
              | 'pending';
            label: string;
          };
        }
      });

    this.initData();
  }

  ngOnDestroy(): void {
    this.optionSettingSubscription &&
      this.optionSettingSubscription.unsubscribe();
  }

  initData(): void {
    this.labelService.allLabels$.subscribe((labels) => {
      let allLabels = [];
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
      allLabels = [...adminLabels];
      for (const title in groupizedLabels) {
        const label = groupizedLabels[title][0];
        if (groupizedLabels[title].length > 1) {
          label['multiple'] = groupizedLabels[title].length;
        }
        if (!label.mine) {
          label['role'] = 'team';
        }
        allLabels.push(label);
      }
      this.labelDic = {};
      allLabels.forEach((e) => {
        this.labelDic[e._id] = e.name;
      });
    });

    //Stage
    this.dealService.pipelineStages$.subscribe((_pipelines) => {
      if (!_pipelines?.length) {
        return;
      }
      this.stageDic = {};
      _pipelines.forEach((_pipeline) => {
        (_pipeline.stages || []).forEach((e) => {
          this.stageDic[e._id] = e.title;
        });
      });
    });

    //Metrial
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
  }

  initOptGroups(): void {
    if (!this._option) {
      return;
    }

    let option = null;
    let index = -1;
    this._optGroups = [];

    //List Type

    this.listTypeFilter = CONTACT_LIST_TYPE.find(
      (item) => item._id === this._option['listType']
    ) as {
      _id: 'own' | 'team' | 'private' | 'prospect' | 'assigned' | 'pending';
      label: string;
    };

    //Label condition
    if (this._option['labelCondition']?.length > 0) {
      option = {
        name: 'Label',
        include: this._option.includeLabel,
        items: this._option.labelCondition
      };

      index = _.findIndex(this._optGroups, { name: 'Label' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Material Activity
    if (this._option.materialCondition.sent_video.flag == true)
      this.selectedMaterialActions = 'Material sent';
    if (this._option.materialCondition.not_sent_video.flag == true)
      this.selectedMaterialActions = 'No material sent';
    if (this._option.materialCondition.watched_video.flag == true)
      this.selectedMaterialActions = 'Material reviewed';
    if (this._option.materialCondition.not_watched_video.flag == true)
      this.selectedMaterialActions = 'Material not reviewed';
    if (this.selectedMaterialActions.length > 0) {
      option = {
        name: 'Material Activity',
        include: true,
        items: [this.selectedMaterialActions]
      };
      index = _.findIndex(this._optGroups, { name: 'Material Activity' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Country
    if (this._option['countryCondition']?.length > 0) {
      option = {
        name: 'Country',
        include: true,
        items: this._option.countryCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Country' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //State
    if (this._option['regionCondition']?.length > 0) {
      option = {
        name: 'State',
        include: true,
        items: this._option.regionCondition
      };
      index = _.findIndex(this._optGroups, { name: 'State' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //City
    if (this._option['cityCondition']?.length > 0) {
      option = {
        name: 'City',
        include: true,
        items: [this._option.cityCondition]
      };

      index = _.findIndex(this._optGroups, { name: 'City' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Zipcode
    if (this._option['zipcodeCondition']?.length > 0) {
      option = {
        name: 'Zipcode',
        include: true,
        items: [this._option.zipcodeCondition]
      };
      index = _.findIndex(this._optGroups, { name: 'Zipcode' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Source
    if (this._option['sourceCondition']?.length > 0) {
      option = {
        name: 'Source',
        include: this._option.includeSource,
        items: this._option.sourceCondition
      };

      index = _.findIndex(this._optGroups, { name: 'Source' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Company
    if (this._option['brokerageCondition']?.length > 0) {
      option = {
        name: 'Company',
        include: this._option.includeBrokerage,
        items: this._option.brokerageCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Company' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Tag
    if (this._option['tagsCondition']?.length > 0) {
      option = {
        name: 'Tag',
        include: this._option.includeTag,
        orTag: this._option.orTag,
        items: this._option.tagsCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Tag' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    // Stage
    if (this._option['stagesCondition']?.length > 0) {
      option = {
        name: 'Stage',
        include: this._option.includeStage,
        items: this._option.stagesCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Stage' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Activity
    const items = [];
    if (this._option['activityCondition']?.length > 0) {
      this._option['activityCondition'].forEach((e) => {
        items.push(this.activityDic[e.type]);
      });
    }

    if (this._option['activityStart']) {
      this.activityDateString =
        this._option['activityStart']['month'].toString().padStart(2, 0) +
        '/' +
        this._option['activityStart']['day'].toString().padStart(2, 0) +
        '/' +
        this._option['activityStart']['year'];
    }

    if (this._option['activityEnd']) {
      if (this.activityDateString) {
        this.activityDateString +=
          '-' +
          this._option['activityEnd']['month'].toString().padStart(2, 0) +
          '/' +
          this._option['activityEnd']['day'].toString().padStart(2, 0) +
          '/' +
          this._option['activityEnd']['year'];
      } else {
        this.activityDateString =
          this._option['activityEnd']['month'].toString().padStart(2, 0) +
          '/' +
          this._option['activityEnd']['day'] +
          '/' +
          this._option['activityEnd']['year'];
      }
    }

    if (items.length > 0 || this.activityDateString.length > 0) {
      option = {
        name: 'Activity',
        include: true,
        items: items
      };
      index = _.findIndex(this._optGroups, { name: 'Activity' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Assignee Condition
    if (this._option['assigneeCondition']?.length > 0) {
      option = {
        name: 'Assignee',
        include: true,
        items: this._option.assigneeCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Assignee' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Community
    const community_items = [];
    const community_names = [];
    const communityOptions = JSON.parse(
      JSON.stringify(this._option.teamOptions)
    );
    const optionLabels = []; // this is for the Team/Community title displaying of the team search option chip
    for (const key in communityOptions) {
      if (communityOptions[key].flag !== -1) {
        community_items.push(key);
        community_names.push(communityOptions[key].name);
        optionLabels.push('Community');
      }
    }

    if (community_items.length > 0) {
      const uniqueLabels = [...new Set(optionLabels)].sort().reverse();
      const optionLabel = uniqueLabels.join(' / ');
      option = {
        name: 'Community',
        include: true,
        items: community_items,
        community_names,
        optionLabel
      };

      index = _.findIndex(this._optGroups, { name: 'Community' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }

      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.teamService
        .read(community_items[0])
        .subscribe(
          (res) => {
            this.team = {
              ...res,
              owner: res['owner'],
              highlights: res['highlights'] || [],
              brands: res['brands'] || []
            };
          },
          () => {}
        );
    }

    // Unsubscribed Option
    if (this._option.unsubscribed?.email || this._option.unsubscribed?.text) {
      var item =
        this._option.unsubscribed?.email && this._option.unsubscribed?.text
          ? 'Email & Text'
          : this._option.unsubscribed?.email
          ? 'Email'
          : 'Text';
      option = {
        name: 'Unsubscribed',
        include: true,
        items: [item]
      };
      index = _.findIndex(this._optGroups, { name: 'Unsubscribed' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Custom Field
    if (this._option['customFieldCondition']?.length > 0) {
      for (let i = 0; i < this._option['customFieldCondition']?.length; i++) {
        const filterCondition = this._option['customFieldCondition'][i];
        if (filterCondition.type == 'date') {
          if (filterCondition.start) {
            this.customDateString =
              filterCondition.start['month'].toString().padStart(2, 0) +
              '/' +
              filterCondition.start['day'].toString().padStart(2, 0) +
              '/' +
              filterCondition.start['year'];
          }

          if (filterCondition.end) {
            if (this.customDateString) {
              this.customDateString +=
                '-' +
                filterCondition.end['month'].toString().padStart(2, 0) +
                '/' +
                filterCondition.end['day'].toString().padStart(2, 0) +
                '/' +
                filterCondition.end['year'];
            } else {
              this.customDateString =
                filterCondition.end['month'].toString().padStart(2, 0) +
                '/' +
                filterCondition.end['day'] +
                '/' +
                filterCondition.end['year'];
            }
          }

          if (this.customDateString.length > 0) {
            option = {
              name: filterCondition.column,
              include: true,
              items: [this.customDateString]
            };
          }
        } else if (filterCondition.type == 'dropdown') {
          option = {
            name: filterCondition.column,
            include: filterCondition.include,
            items: filterCondition.options
          };
        } else {
          option = {
            name: filterCondition.column,
            include: true,
            items: [filterCondition.condition]
          };
        }
        index = _.findIndex(this._optGroups, { name: filterCondition.column });
        if (index === -1) {
          this._optGroups.push(option);
        } else {
          this._optGroups.splice(index, 1, option);
        }
      }
    }
  }

  removeCondition(field: string, condition: any): void {
    if (field == 'filterCondition') {
      const filterName = condition.name;
      const index = _.findIndex(this._optGroups, { name: filterName });
      this._optGroups.splice(index, 1);
      switch (filterName) {
        case 'Label':
          this._option.labelCondition = [];
          this._option.includeLabel = true;
          break;
        case 'Material Activity':
          this.selectedMaterialActions = '';
          this._option.materialCondition.sent_video.flag = false;
          this._option.materialCondition.sent_pdf.flag = false;
          this._option.materialCondition.sent_image.flag = false;
          this._option.materialCondition.not_sent_video.flag = false;
          this._option.materialCondition.not_sent_pdf.flag = false;
          this._option.materialCondition.not_sent_image.flag = false;
          this._option.materialCondition.watched_video.flag = false;
          this._option.materialCondition.watched_pdf.flag = false;
          this._option.materialCondition.watched_image.flag = false;
          this._option.materialCondition.not_watched_video.flag = false;
          this._option.materialCondition.not_watched_pdf.flag = false;
          this._option.materialCondition.not_watched_image.flag = false;
          break;
        case 'Country':
          this._option.countryCondition = [];
          break;
        case 'State':
          this._option.regionCondition = [];
          break;
        case 'City':
          this._option.cityCondition = [];
          break;
        case 'Zipcode':
          this._option.zipcodeCondition = '';
          break;
        case 'Source':
          this._option.includeSource = true;
          this._option.sourceCondition = [];
          break;
        case 'Company':
          this._option.includeBrokerage = true;
          this._option.brokerageCondition = [];
          break;
        case 'Tag':
          this._option.includeTag = true;
          this._option.tagsCondition = [];
          this._option.orTag = true;
          break;
        case 'Stage':
          this._option.includeStage = true;
          this._option.stagesCondition = [];
          break;
        case 'Activity':
          this._option.lastMaterial.send_image.flag = false;
          this._option.lastMaterial.watched_pdf.flag = false;
          this._option.lastMaterial.watched_image.flag = false;
          delete this._option.activityStart;
          delete this._option.activityEnd;
          this._option.activityCondition = [];
          this.activityDateString = '';
          break;
        case 'Assignee':
          this._option.assigneeCondition = [];
          break;
        case 'Community':
          this._option.teamOptions = {};
          break;
        case 'Unsubscribed':
          this._option.unsubscribed = {
            email: false,
            text: false
          };
          this._option.includeUnsubscribed = true;
          break;
        default:
          this._option.customFieldCondition =
            this._option.customFieldCondition.filter(
              (e) => e.column !== filterName
            );
      }
      this.contactService.searchOption.next(
        new SearchOption().deserialize({ ...this._option })
      );
    } else {
      this._option[field].some((e, index) => {
        if (e.id === condition.id) {
          this._option[field].splice(index, 1);
        }
      });
    }

    this.changeFilter.emit(this._option);
  }

  /**
   * Apply the filter
   * @param option: option name
   * @param $event: option value
   * @param trigger: menu trigger component
   */
  applyFilter($event, trigger: MatMenuTrigger): void {
    const currentOption = this.contactService.searchOption.getValue();
    this.contactService.searchOption.next(
      new SearchOption().deserialize({
        ...currentOption,
        ...$event
      })
    );
    trigger.closeMenu();
  }

  resetListType(): void {
    this.contactService.listTypeOption.next('own');

    const currentOption = this.contactService.searchOption.getValue();
    this.contactService.searchOption.next(
      new SearchOption().deserialize({
        ...currentOption,
        listType: 'own'
      })
    );
  }
}
