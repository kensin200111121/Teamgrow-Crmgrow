import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { ContactService } from '@app/services/contact.service';
import { TabItem } from '@app/utils/data.types';
import { UserService } from '@services/user.service';
@Component({
  selector: 'app-contact-activity-list-container',
  templateUrl: './contact-activity-list-container.component.html',
  styleUrls: ['./contact-activity-list-container.component.scss']
})
export class ContactActivityListContainerComponent implements OnInit {
  tabs: TabItem[] = [
    { icon: '', label: 'Activity', id: 'activity' },
    {
      icon: '',
      label: 'Calls',
      id: 'phone_log',
      feature: USER_FEATURES.DIALER
    },
    { icon: '', label: 'Notes', id: 'note' },
    { icon: '', label: 'Emails', id: 'email', feature: USER_FEATURES.EMAIL },
    { icon: '', label: 'Texts', id: 'text', feature: USER_FEATURES.TEXT }
  ];
  tab: TabItem = this.tabs[0];

  filterTypes: TabItem[] = [
    { icon: '', label: 'Activity', id: 'all' },
    { icon: '', label: 'Notes', id: 'note' },
    { icon: '', label: 'Emails', id: 'email', feature: USER_FEATURES.EMAIL },
    { icon: '', label: 'Texts', id: 'text', feature: USER_FEATURES.TEXT },
    { icon: '', label: 'Meetings', id: 'appointment' },
    { icon: '', label: 'Tasks', id: 'follow_up' },
    { icon: '', label: 'Deals', id: 'deal', feature: USER_FEATURES.PIPELINE },
    {
      icon: '',
      label: 'Calls',
      id: 'phone_log',
      feature: USER_FEATURES.DIALER
    },
    {
      icon: '',
      label: 'Automations',
      id: 'automation',
      feature: USER_FEATURES.AUTOMATION
    }
  ];
  contactId = null;

  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
      this._initLoadInfo(this.contactId);
    }
  }
  @Input() prospectId?: string;
  // this is for inital tab id. Whenever change the tab, this is stored in the parent component. When reload it, it is restored from that.
  @Input() focusActivityTab = '';
  @Output() changeTab? = new EventEmitter();

  constructor(
    public contactDetailInfoService: ContactDetailInfoService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    if (this.focusActivityTab) {
      this.tab = this.tabs.find((e) => e.id === this.focusActivityTab);
    }
  }

  _initLoadInfo(contactId) {}

  ngOnDestroy(): void {
    this.contactDetailInfoService.resetLastUsedContactId();
  }

  onChangeTab(tab: TabItem): void {
    this.tab = tab;
    localStorage.setItem('contactSelectedTab', this.tab.id);
    this.changeTab?.emit(tab.id);
  }
}
