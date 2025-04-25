import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { DetailActivity } from '@models/activityDetail.model';
import { DealsService } from '@app/services/deals.service';
@Component({
  selector: 'app-deal-timelines',
  templateUrl: './deal-timelines.component.html',
  styleUrls: ['./deal-timelines.component.scss']
})
export class DealTimelinesComponent implements OnInit {
  @Input('deal') deal: any = {};
  @Input('lastActivity')
  public set lastActivity(val: any) {
    this._lastActivity = val || {};
  }

  @Input('timelines')
  public set timelines(val: DetailActivity[]) {
    this._timelines = val || [];
  }
  _timelines: DetailActivity[] = [];
  _lastActivity: any = {};
  lastActivityContact: any = {};
  expanded = false;

  constructor(public dealsService: DealsService) {}

  ngOnInit(): void {
    this.lastActivityContact = this.getContactsInfo(
      this._lastActivity.contacts
    );
  }
  ngOnDestroy(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['timelines']) {
      this.lastActivityContact = this.getContactsInfo(
        this._lastActivity.contacts
      );
    }
  }
  expand(): void {
    this.expanded = true;
  }

  collapse(): void {
    this.expanded = false;
  }
  getContactsInfo = (id: string) => {
    const index = this.deal.contacts.findIndex((it) => it._id === id);
    if (index == -1) return null;
    return this.deal.contacts[index];
  };

  getContactListFromActivities = (groupAcitivties: any) => {
    const contacts = [];
    if (!groupAcitivties) return [];
    groupAcitivties.forEach((c) => {
      const index = this.deal.contacts.findIndex((it) => it._id === c.contacts);
      if (index > -1) contacts.push(this.deal.contacts[index]);
    });
    return contacts;
  };
}
