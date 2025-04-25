import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-files',
  templateUrl: './message-files.component.html',
  styleUrls: ['./message-files.component.scss']
})
export class MessageFilesComponent implements OnInit {
  @Input('info')
  public set info(info) {
    if (info && info.timeInfo) {
      this.timeline = info.timeInfo || [];
    }
    if (info && info.materials) {
      info.materials.forEach((e) => {
        this.materials[e._id] = e;
      });
    }
    if (info && info.trackers) {
      this.trackers = info.trackers;

      for (const material in this.trackers) {
        this.trackers[material].sort((a, b) =>
          new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1
        );
      }
    }
  }
  materials = {};
  timeline = [];
  trackers = {};
  dGroups = []; // group ID Array to display detail data
  showingMax = 4; // Max Limit to show the detail data

  constructor() {}

  ngOnInit(): void {}

  showMoreDetail(group_id): void {
    if (this.dGroups.length >= this.showingMax) {
      this.dGroups.shift();
    }
    this.dGroups.push(group_id);
  }
  hideMoreDetail(group_id): void {
    const pos = this.dGroups.indexOf(group_id);
    if (pos !== -1) {
      this.dGroups.splice(pos, 1);
    }
  }
}
