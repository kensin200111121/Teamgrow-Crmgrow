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
import { SocketService } from '@app/services/socket.service';
import { SspaService } from '../../../services/sspa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact-text-action-item',
  templateUrl: './contact-text-action-item.component.html',
  styleUrls: ['./contact-text-action-item.component.scss']
})
export class ContactTextActionItemComponent
  extends ContactActivityItemSuperComponent
  implements OnInit, OnChanges
{
  type: ContactDetailActionType = 'text';
  selectedContact: Contact = new Contact();
  @Input() protected contactId: string;
  @Input() protected isActionItem?: boolean;

  @Input() protected activity: ContactActivityActionV2;
  messageStatusSubscription: Subscription;

  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    private helperService: HelperService,
    private socketService: SocketService,
    public sspaService: SspaService
  ) {
    super();
  }

  ngOnInit(): void {
    this.replaceToken();
    super.ngOnInit();
    this.messageStatusSubscription?.unsubscribe();
    this.messageStatusSubscription =
      this.socketService.messageStatus$.subscribe((data) => {
        if (
          data &&
          this.activity.activityOverView?.type === 'texts' &&
          this.activity.messageId === data.messageId
        ) {
          this.updateActivityStatus(data);
        }
      });
  }

  private updateActivityStatus(data: any): void {
    const { status } = data;

    const newStatus = status === 'delivered' ? 'completed' : status;
    this.activity.status = newStatus;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activity) {
      this.replaceToken();
    }
  }

  ngOnDestroy(): void {
    this.messageStatusSubscription?.unsubscribe();
  }

  async replaceToken() {
    try {
      const result = await this.helperService.replaceTokenFunc(
        this.activity.action.subject,
        this.activity.action.content
      );
      this.activity.action.content = result.content;
    } catch (err) {
      console.log(err, 'Token replacing error');
    }
  }
}
