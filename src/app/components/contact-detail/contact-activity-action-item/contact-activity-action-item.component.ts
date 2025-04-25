import { Component, Input, OnInit } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { SspaService } from '../../../services/sspa.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-contact-activity-action-item',
  templateUrl: './contact-activity-action-item.component.html',
  styleUrls: ['./contact-activity-action-item.component.scss']
})
export class ContactActivityActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'activity';
  @Input() protected contactId: string;
  @Input() protected activity: ContactActivityActionV2;
  @Input() protected prospectId?: string;
  isSspa = environment.isSspa;
  unneededFields = ['activity', 'contact', 'landing_page'];
  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    super.ngOnInit();
  }

  hasProspectLink(): boolean {
    return (
      this.isSspa &&
      this.prospectId &&
      this.activity.activityOverView.type === 'contacts'
    );
  }
}
