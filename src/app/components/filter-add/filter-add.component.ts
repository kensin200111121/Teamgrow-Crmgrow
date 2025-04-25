import { Component, Inject, OnInit } from '@angular/core';
import { LabelService } from '@services/label.service';
import { SearchOption } from '@models/searchOption.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilterService } from '@services/filter.service';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';

@Component({
  selector: 'app-filter-add',
  templateUrl: './filter-add.component.html',
  styleUrls: ['./filter-add.component.scss']
})
export class FilterAddComponent implements OnInit {
  submitted = false;
  saving = false;
  saveSubscription: Subscription;
  filterName = '';
  filterDescription = '';
  filterCount = 0;
  selectedLabels = [];
  selectedAction = '';
  selectedMaterial = [];
  activityConditions = [];
  searchOption: SearchOption = new SearchOption();
  filterId = '';
  filterType = 'own';
  saveOption = 'replace';
  userIsOnTeam = true;

  constructor(
    public labelService: LabelService,
    public filterService: FilterService,
    private userService: UserService,

    private dialogRef: MatDialogRef<FilterAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.searchOption = this.data.searchOption;
    if (this.data.material && this.data.material.length > 0) {
      this.selectedMaterial.push(this.data.material[0]);
    }
    if (this.data && this.data._id) {
      if (this.data.saveOption) this.saveOption = this.data.saveOption;
      this.filterId = this.data._id;
      const filters = this.filterService.filters.getValue();
      const curFilter = filters.find((e) => e._id == this.filterId);
      if (curFilter) {
        this.filterName = curFilter.title;
        this.filterDescription = curFilter?.description ?? '';
        this.filterType = curFilter.type ?? '';
      }
    }
    const labels = this.labelService.allLabels.getValue();
    this.searchOption?.labelCondition.forEach((selectLabel) => {
      labels.forEach((label) => {
        if (label._id == selectLabel) {
          this.selectedLabels.push(label);
        }
      });
      if (selectLabel == null) {
        this.selectedLabels.push(null);
      }
    });
  }

  ngOnInit(): void {
    const profile = this.userService.profile.getValue();
    this.userIsOnTeam =
      profile?.organization && profile?.organization_info?.is_enabled;
  }

  getMaterialType(): string {
    if (this.selectedMaterial.length > 0 && this.selectedMaterial[0].type) {
      if (this.selectedMaterial[0].type === 'application/pdf') {
        return 'PDF';
      } else if (this.selectedMaterial[0].type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  saveFilter(): void {
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (!this.filterId) {
      this.saveSubscription = this.filterService
        .create({
          title: this.filterName,
          description: this.filterDescription,
          content: this.searchOption,
          type: this.filterType
        })
        .subscribe((result) => {
          this.saving = false;
          if (result) {
            this.filterService.create$(result);
            this.dialogRef.close(true);
          }
        });
    } else {
      this.saveSubscription = this.filterService
        .update(this.filterId, {
          title: this.filterName,
          description: this.filterDescription,
          content: this.searchOption,
          type: this.filterType
        })
        .subscribe((result) => {
          this.saving = false;
          if (result) {
            this.dialogRef.close(true);
            this.filterService.update$(this.filterId, {
              title: this.filterName,
              description: this.filterDescription,
              content: this.searchOption,
              type: this.filterType
            });
          }
        });
    }
  }

  activityDefine = {
    contacts: 'Just added',
    notes: 'Added note',
    follow_ups: 'Task added',
    phone_logs: 'Call',
    email_trackers: 'Opened email',
    emails: 'Sent email',
    clicked_link: 'Clicked link',
    videos: 'Sent video',
    pdfs: 'Sent PDF',
    images: 'Sent image',
    video_trackers: 'Watched Video',
    pdf_trackers: 'Reviewed PDF',
    image_trackers: 'Reviewed image'
  };
}
