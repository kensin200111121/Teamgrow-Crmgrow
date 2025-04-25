import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { StoreService } from '@app/services/store.service';
import { UserService } from '@app/services/user.service';
import { AutomationShowFullComponent } from '@components/automation-show-full/automation-show-full.component';
import { MatDialog } from '@angular/material/dialog';
import { ContactDetail } from '@models/contact.model';
import { SspaService } from '../../../services/sspa.service';
import { AutomationService } from '@app/services/automation.service';

@Component({
  selector: 'app-contact-automation-action-item',
  templateUrl: './contact-automation-action-item.component.html',
  styleUrls: ['./contact-automation-action-item.component.scss']
})
export class ContactAutomationActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'automation';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;

  contact: ContactDetail = new ContactDetail(); // including the activities and details

  tab = { icon: '', label: 'Automations', id: 'automation' };

  constructor(
    private dialog: MatDialog,
    protected contactDetailInfoService: ContactDetailInfoService,
    public userService: UserService,
    private automationService: AutomationService,
    public sspaService: SspaService
  ) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  showDetailCompletedAutomation(activity): void {
    if (activity.action.status === 'running') {
      const automationId = activity.action.automation;
      const automationLineId = activity.actionId;
      this.automationService
        .loadAutomationTimelines(automationLineId)
        .subscribe((res) => {
          if (res) {
            const automation = res;
            this.dialog.open(AutomationShowFullComponent, {
              position: { top: '100px' },
              width: '98vw',
              maxWidth: '900px',
              height: 'calc(60vh + 70px)',
              panelClass: ['main-automation', `main-${automationId}`, 'active'],
              data: {
                id: automationId,
                automation: automation,
                timelines: automation['timelines'],
                type: activity.action.type
              }
            });
          }
        });
    } else {
      console.log();
      this.dialog.open(AutomationShowFullComponent, {
        position: { top: '100px' },
        width: '98vw',
        maxWidth: '700px',
        height: 'calc(65vh + 70px)',
        panelClass: [
          'main-automation',
          `main-${activity.action.automation}`,
          'active'
        ],
        data: {
          id: activity.action.automation,
          automation: activity.action,
          timelines: activity.action.automations,
          type: activity.action.type,
          isCompleted: true
        }
      });
    }
  }
}
