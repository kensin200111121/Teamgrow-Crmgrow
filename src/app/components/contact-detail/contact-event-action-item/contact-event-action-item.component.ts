import { Component, Input, OnInit } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { SspaService } from '../../../services/sspa.service';

@Component({
  selector: 'app-contact-event-action-item',
  templateUrl: './contact-event-action-item.component.html',
  styleUrls: ['./contact-event-action-item.component.scss']
})
export class ContactEventActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'event';
  @Input() protected contactId: string;
  @Input() protected activity: ContactActivityActionV2;
  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    super.ngOnInit();
  }
}
