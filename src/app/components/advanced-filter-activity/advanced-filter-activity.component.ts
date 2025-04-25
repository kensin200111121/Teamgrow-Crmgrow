import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { UserService } from '@app/services/user.service';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-advanced-filter-activity',
  templateUrl: './advanced-filter-activity.component.html',
  styleUrls: ['./advanced-filter-activity.component.scss']
})
export class AdvancedFilterActivityComponent implements OnInit {
  searchOption: SearchOption = new SearchOption();
  lodash = _;
  @Output() filter = new EventEmitter();
  activities = [
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
      title: 'called'
    },
    {
      _id: 5,
      title: 'opened email',
      feacture: USER_FEATURES.EMAIL
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
    'reviewed image': 'watched_image',
    'reviewed pdf': 'watched_pdf'
  };

  selectedMaterialActions = [];
  selectedMaterial = [];

  constructor(
    private dialog: MatDialog,
    public userService: UserService,
    private contactService: ContactService
  ) {}

  ngOnInit() {
    this.searchOption = new SearchOption().deserialize(
      JSON.parse(JSON.stringify(this.contactService.searchOption.getValue()))
    );
    if (this.searchOption.activityCondition.length > 0) {
      this.searchOption.activityCondition.forEach((e) => {
        this.selectedMaterialActions.push(
          this.getKeyByValue(this.activityDefine, e.type)
        );
      });
    }
    const user = this.userService.profile.getValue();
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }

  toggleActivities(activity: string): void {
    const index = _.findIndex(this.searchOption.activityCondition, {
      type: this.activityDefine[activity]
    });
    if (index === -1) {
      this.searchOption.activityCondition.push({
        type: this.activityDefine[activity]
      });
      this.selectedMaterialActions.push(activity);
    } else {
      this.searchOption.activityCondition.splice(index, 1);
      if (this.selectedMaterialActions.indexOf(activity) !== -1) {
        this.selectedMaterialActions.splice(
          this.selectedMaterialActions.indexOf(activity),
          1
        );
      }
    }
  }

  selectMaterial(activity): void {
    let material_type = 'all';
    if (activity === 'sent video' || activity === 'watched video') {
      material_type = 'video';
    }

    if (activity === 'sent pdf' || activity === 'reviewed pdf') {
      material_type = 'pdf';
    }

    if (activity === 'sent image' || activity === 'reviewed image') {
      material_type = 'image';
    }

    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          title: 'Select media',
          multiple: false,
          onlyMine: false,
          buttonLabel: 'Select',
          material_type: material_type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.materials) {
          this.selectedMaterial = [];
          this.selectedMaterial = [...this.selectedMaterial, ...res.materials];
          const index = _.findIndex(this.searchOption.activityCondition, {
            type: this.activityDefine[activity]
          });
          if (index !== -1) {
            this.searchOption.activityCondition[index].detail =
              this.selectedMaterial[0]._id;
          }
        }
      });
  }

  save(): void {
    this.filter.emit({
      activityStart: this.searchOption.activityStart,
      activityEnd: this.searchOption.activityEnd,
      activityCondition: this.searchOption.activityCondition
    });
  }
}
