import { Component, Input, OnInit } from '@angular/core';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { SspaService } from '../../services/sspa.service';

@Component({
  selector: 'app-contact-agent-fire',
  templateUrl: './contact-agent-fire.component.html',
  styleUrls: ['./contact-agent-fire.component.scss']
})
export class ContactAgentFireComponent implements OnInit {
  @Input()
  set contactId(val: string) {
    if (!val) {
      return;
    }
    this.loadProperties(val);
  }

  properties = [];
  isLoading = false;

  constructor(
    private contactService: ContactDetailInfoService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  private loadProperties(contactId: string): void {
    this.isLoading = true;
    this.contactService.loadProperties(contactId).subscribe((data) => {
      this.isLoading = false;
      this.properties = data ?? [];
    });
  }
}
