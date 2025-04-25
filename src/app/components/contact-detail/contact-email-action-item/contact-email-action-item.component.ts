import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { HelperService } from '@app/services/helper.service';
import { Contact } from '@models/contact.model';
import { SspaService } from '../../../services/sspa.service';

@Component({
  selector: 'app-contact-email-action-item',
  templateUrl: './contact-email-action-item.component.html',
  styleUrls: ['./contact-email-action-item.component.scss']
})
export class ContactEmailActionItemComponent
  extends ContactActivityItemSuperComponent
  implements OnInit, OnChanges
{
  type: ContactDetailActionType = 'email';
  selectedContact: Contact = new Contact();
  @Input() protected contactId: string;
  @Input() protected activity: ContactActivityActionV2;
  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    private helperService: HelperService,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    this.replaceToken();
    super.ngOnInit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activity) {
      this.replaceToken();
    }
  }

  async replaceToken() {
    try {
      const result = await this.helperService.replaceTokenFunc(
        this.activity.action.subject,
        this.activity.action.content
      );
      this.activity.action.subject = result.subject;
      this.activity.action.content = result.content;
    } catch (err) {
      console.log(err, 'Token replacing error');
    }
  }
}
