import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { SspaService } from '../../../services/sspa.service';

@Component({
  selector: 'app-contact-universal-action-item',
  templateUrl: './contact-universal-action-item.component.html',
  styleUrls: ['./contact-universal-action-item.component.scss']
})
export class ContactUniversalActionItemComponent extends ContactActivityItemSuperComponent {
  @Input() protected contactId: string;
  @Input() protected activity: ContactActivityActionV2;
  @Input() protected type: ContactDetailActionType;

  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    super.ngOnInit();
    // console.log('===ContactActivityActionItemComponent=====', this.activity);
  }
}
