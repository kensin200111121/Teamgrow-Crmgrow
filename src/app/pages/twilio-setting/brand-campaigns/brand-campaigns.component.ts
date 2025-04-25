import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { SmsService } from '@services/sms.service';
import { BrandCampaign } from '@utils/data.types';
import { DialogSettings } from '@constants/variable.constants';

@Component({
  selector: 'app-brand-campaigns',
  templateUrl: './brand-campaigns.component.html',
  styleUrls: ['./brand-campaigns.component.scss']
})
export class BrandCampaignsComponent implements OnInit {
  @Input() campaign: BrandCampaign = {
    description: '',
    messageFlow: '',
    messages: ['']
  };
  @Input() campaignId: string;
  @Output() created = new EventEmitter();
  @Output() cancelled = new EventEmitter();

  creating = false;

  constructor(private smsService: SmsService, private dialog: MatDialog) {}

  ngOnInit(): void {
    if (!this.campaign.messages.length) {
      this.campaign.messages.push('');
    }
  }

  createCampagin(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'One time payment for campaign registration',
          message:
            'The campaign registration process will charge $20 one time fee once it is completed. Are you sure to submit? ',
          cancelLabel: 'Confirm',
          confirmLabel: 'Submit'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.creating = true;
          this.smsService.createBrandCampaign(this.campaign).subscribe(() => {
            this.creating = false;
            this.created.emit();
          });
        }
      });
    this.creating = true;

    this.smsService.createBrandCampaign(this.campaign).subscribe(() => {
      this.creating = false;
      this.created.emit();
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  insertNewMessage(): void {
    this.campaign.messages.push('');
  }

  removeMessage(i: number): void {
    this.campaign.messages.splice(i, 1);
  }

  msgCounter(): number[] {
    return new Array(this.campaign.messages.length).fill(1);
  }
}
