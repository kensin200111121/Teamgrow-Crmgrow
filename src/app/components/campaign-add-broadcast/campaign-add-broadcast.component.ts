import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import moment from 'moment-timezone';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MaterialAddComponent } from '@components/material-add/material-add.component';
import { numPad } from '@app/helper';
import { UserService } from '@services/user.service';
import { CampaignService } from '@services/campaign.service';
import { HelperService } from '@services/helper.service';
import { MaterialService } from '@services/material.service';
import { Subscription } from 'rxjs';
import { StoreService } from '@services/store.service';
import * as _ from 'lodash';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';

@Component({
  selector: 'app-campaign-add-broadcast',
  templateUrl: './campaign-add-broadcast.component.html',
  styleUrls: ['./campaign-add-broadcast.component.scss']
})
export class CampaignAddBroadcastComponent implements OnInit {
  title = '';
  selectedTemplate;
  templateMaterials = [];
  selectedMailList;
  materials = [];
  videos = [];
  pdfs = [];
  images = [];
  minDate;
  selectedDateTime;
  adding = false;
  sessions = [];

  materialLoadSubscription: Subscription;
  allMaterials = [];

  constructor(
    private dialogRef: MatDialogRef<CampaignAddBroadcastComponent>,
    private dialog: MatDialog,
    private userService: UserService,
    private helperService: HelperService,
    private materialService: MaterialService,
    private storeService: StoreService,
    private campaignService: CampaignService,
    public sspaService: SspaService
  ) {
    const current = new Date();
    this.minDate = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };

    this.materialService.loadMaterial(false);
    this.materialLoadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        this.allMaterials = materials;
      }
    );

    const today = new Date();
    this.selectedDateTime = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
      hour: 12,
      minute: 0
    };
  }

  ngOnInit(): void {}

  selectMailList(event): void {
    this.selectedMailList = event;
  }

  selectTemplate(template): void {
    let materialIds = [];
    if (template.type === 'newsletter') {
      materialIds = [...template.videos, ...template.images, ...template.pdfs];
      this.materials = [];
    } else {
      materialIds = [
        ...template.video_ids,
        ...template.image_ids,
        ...template.pdf_ids
      ];
    }
    if (materialIds.length) {
      const materials = this.allMaterials.filter(
        (e) => materialIds.indexOf(e._id) !== -1
      );
      this.templateMaterials = materials;
    } else {
      this.templateMaterials = [];
    }
    this.materials = _.difference(
      this.materials,
      this.templateMaterials,
      '_id'
    );
  }

  deleteMaterial(material): void {
    const index = this.materials.findIndex((item) => item._id === material._id);
    if (index >= 0) {
      this.materials.splice(index, 1);
    }
  }

  attachMaterials(): void {
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '98vw',
        maxWidth: '940px',
        data: {
          title: 'Insert material',
          multiple: true,
          onlyMine: false
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.materials) {
          const newMaterials = _.difference(
            res.materials,
            [...this.materials, ...this.templateMaterials],
            '_id'
          );
          this.materials = [...this.materials, ...newMaterials];
        }
      });
  }

  addBroadcast(): void {
    if (
      !this.selectedMailList ||
      !this.selectedTemplate ||
      !this.selectedDateTime
    ) {
      return;
    }

    const timeToStart = `${this.selectedDateTime.year}-${numPad(
      this.selectedDateTime.month
    )}-${numPad(this.selectedDateTime.day)} ${numPad(
      this.selectedDateTime.hour
    )}:${numPad(this.selectedDateTime.minute)}:00`;

    const images = [];
    const pdfs = [];
    const videos = [];

    this.materials.forEach((material) => {
      const type = this.helperService.getMaterialType(material);
      if (type === 'Image') {
        images.push(material._id);
      } else if (type === 'PDF') {
        pdfs.push(material._id);
      } else if (type === 'Video') {
        videos.push(material._id);
      }
    });

    this.adding = true;
    const dueDateTime = moment(timeToStart)
      .set({
        minute: 0,
        second: 0,
        millisecond: 0
      })
      .toISOString();
    const data = {
      title: this.title,
      mail_list: this.selectedMailList._id,
      due_start: dueDateTime,
      videos,
      pdfs,
      images
    };
    if (this.selectedTemplate.type === 'email') {
      data['email_template'] = this.selectedTemplate._id;
    } else {
      data['newsletter'] = this.selectedTemplate._id;
    }

    this.campaignService.create(data).subscribe((response) => {
      this.adding = false;
      this.dialogRef.close({ data: response });
    });
  }
}
