import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Contact } from '@app/models/contact.model';
import { Draft } from '@app/models/draft.model';
import { ContactActionService } from '@app/services/contact-action.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { ContactService } from '@app/services/contact.service';
import { EmailService } from '@app/services/email.service';
import { StoreService } from '@app/services/store.service';
import { TabItem } from '@app/utils/data.types';
import { UserFeatureService } from '@app/services/user-features.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { USER_FEATURES } from '@app/constants/feature.constants';

const originTabs: TabItem[] = [
  { icon: 'i-note', label: 'New Note', id: 'note' },
  { icon: 'i-email', label: 'Send Email', id: 'email' },
  {
    icon: 'i-text',
    label: 'Send Text',
    id: 'text',
    feature: USER_FEATURES.TEXT
  }
];

@Component({
  selector: 'app-contact-detail-action-header',
  templateUrl: './contact-detail-action-header.component.html',
  styleUrls: ['./contact-detail-action-header.component.scss']
})
export class ContactDetailActionHeaderComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();
  draftSubscription: Subscription;

  tabs: TabItem[] = [originTabs[0]];
  tab: TabItem = this.tabs[0];
  enabledMaterial = true;

  contactId = null;

  noteToEdit = null;
  contactMainInfo = new Contact();
  draftEmail = new Draft();
  draftText = new Draft();

  draftContactEmails: string[] | null = null;
  draftContactPhones: string[] | null = null;

  collapsed = true;

  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
    }
  }
  constructor(
    private storeService: StoreService,
    private emailService: EmailService,
    public contactDetailInfoService: ContactDetailInfoService,
    private featureService: UserFeatureService
  ) {
    this.storeService.selectedContactMainInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.contactMainInfo = value;
        const tabs = [originTabs[0]];
        if (this.contactMainInfo?.emails?.length > 0) {
          // only if includes email info, can send email
          tabs.push(originTabs[1]);
        }
        if (
          this.contactMainInfo?.phones?.length > 0 &&
          this.featureService.isEnableFeature(USER_FEATURES.TEXT)
        ) {
          tabs.push(originTabs[2]);
        }
        this.tabs = tabs;
        this.tab = tabs[0];
      });
    this.storeService.emailContactDraft$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.draftEmail = value;
      });
    this.storeService.textContactDraft$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.draftText = value;
      });
    this.enabledMaterial = this.featureService.isEnableFeature(
      USER_FEATURES.MATERIAL
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  changeTab(tab: TabItem): void {
    this.tab = tab;
  }

  onCreateNote(): void {
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactId,
      'note'
    );
  }

  onCallbackDestroySendEmail(emails: string[]) {
    this.draftContactEmails = emails;
  }

  onCallbackDestroySendPhone(phones: string[]) {
    this.draftContactPhones = phones;
  }

  onCloseSendEmail(draft) {}

  /**
   * callback for send email
   * @param $event
   */
  onSendEmail($event) {
    if ($event?.draftId) {
      this.storeService.emailContactDraft.next({});
      this.emailService.removeDraft($event.draftId).subscribe((result) => {
        if (result) {
          this.draftEmail = new Draft();
          this.storeService.emailContactDraft.next({});
        }
      });
    }
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactId,
      'email'
    );
    this.draftContactEmails = null;
  }

  onCloseSendText(draft) {}

  /**
   * callback for send email
   * @param $event
   */
  onSendText($event) {
    if ($event?.draftId) {
      // if simple send email case (non schedule)
      this.storeService.textContactDraft.next({});
      this.emailService.removeDraft($event.draftId).subscribe((result) => {
        if (result) {
          this.draftText = new Draft();
          this.storeService.textContactDraft.next({});
        }
      });
    }
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactId,
      'text'
    );
    this.draftContactPhones = null;
  }

  expandForm(): void {
    this.collapsed = false;
  }

  collapseForm(): void {
    this.collapsed = true;
  }
}
