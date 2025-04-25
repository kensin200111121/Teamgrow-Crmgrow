import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { PageCanDeactivate } from '@app/variables/abstractors';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { Location } from '@angular/common';
import { ContactService } from '@app/services/contact.service';
import { StoreService } from '@app/services/store.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { UserService } from '@app/services/user.service';
import { Contact, ContactDetailActionType } from '@app/models/contact.model';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { DialerService } from '@app/services/dialer.service';

const DataSections = [
  {
    name: 'Scheduled Items',
    icon: 'i-task',
    type: 'tasks',
    feature: USER_FEATURES.SCHEDULER
  },
  {
    name: 'Tasks',
    icon: 'i-task',
    type: 'follow_up'
  },
  {
    name: 'Deals',
    icon: 'i-deal',
    type: 'deal',
    feature: USER_FEATURES.PIPELINE
  },
  {
    name: 'Appointments',
    icon: 'i-calendar',
    type: 'appointment'
  },
  {
    name: 'Automations',
    icon: 'i-automation',
    type: 'automation',
    feature: USER_FEATURES.AUTOMATION
  },
  {
    name: 'Agentfire',
    icon: 'i-lightbulb',
    type: 'agentFire'
  }
];

@Component({
  selector: 'app-contact-detail-v2',
  templateUrl: './contact-detail-v2.component.html',
  styleUrls: ['./contact-detail-v2.component.scss']
})
export class ContactDetailV2Component
  extends PageCanDeactivate
  implements OnInit, OnDestroy
{
  destroy$ = new Subject();
  readonly dataSectionItems = DataSections;
  enabledSectionTypes: string[] = DataSections.map((e) => e.type);

  saved: boolean;
  _id = '';
  focusActivityTab: ContactDetailActionType = 'activity'; // activated tab id on center panel
  expandedDataListName = ''; // the flat for the name of the expanded data list on mobile device

  private routeChangeSubscription: Subscription;
  private userSubscription: Subscription;

  private contactMainInfo: Contact;
  private sharedMembers = [];
  private userId: string;
  // Check my contact
  get isPending(): boolean {
    const contact = this.contactMainInfo;
    if (!contact) {
      return false;
    }
    const pending_users = contact.pending_users || [];
    const sharedMembers = this.sharedMembers || [];
    const contactUser = contact.user || [];

    if (contact.shared_all_member && contact.shared_team?.length) {
      return false;
    }

    if (
      pending_users.includes(this.userId) ||
      (!contactUser.includes(this.userId) &&
        !sharedMembers.includes(this.userId))
    ) {
      return true;
    } else {
      return false;
    }
  }

  get isShared(): boolean {
    const contact = this.contactMainInfo;
    if (!contact) {
      return false;
    }

    if (
      this.userId &&
      (this.userId === this.contactMainInfo.user ||
        this.userId === this.contactMainInfo.user[0])
    ) {
      return false;
    } else {
      return true;
    }
  }

  totalActionCount = {
    follow_up: 0,
    deal: 0,
    appointment: 0,
    automation: 0,
    tasks: 0
  };

  constructor(
    public contactService: ContactService,
    private storeService: StoreService,
    public contactDetailInfoService: ContactDetailInfoService,
    public userService: UserService,

    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private dialerService: DialerService
  ) {
    super();
    this.routeChangeSubscription = this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (this._id !== params['id']) {
          this._id = params['id'];
          if (this._id) {
            this.loadContact(this._id);
          }
        }
      });

    this.userSubscription = this.userService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (profile?._id) {
          this.userId = profile?._id;
          if (this._id) {
            this.contactService.read(this._id, {}, false);
          }
        }
      });
    this.storeService.selectedContactMainInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((contact) => {
        if (!contact?._id) {
          return;
        }
        this.contactMainInfo = new Contact().deserialize({ ...contact });

        if (this.contactMainInfo['shared_members']) {
          this.sharedMembers = this.contactMainInfo['shared_members'].map(
            (e) => e._id
          );
        }
      });
    Object.keys(this.totalActionCount).forEach((item) => {
      this.contactDetailInfoService.actionTotalCount$[item]
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          this.totalActionCount[item] = data;
        });
    });
  }

  loadContact(_id: string): void {
    this.contactService.read(_id, {}, false);
    //fetch draft
    this.contactDetailInfoService.getEmailDraftOnContact(_id);
    this.contactDetailInfoService.getTextDraftOnContact(_id);
  }

  ngOnInit(): void {
    this.saved = true;
    this.dialerService.isCallLogged$.subscribe((flag) => {
      if (flag) {
        this.contactDetailInfoService.refreshAll(
          this._id,
          this.focusActivityTab
        );
      }
    });
  }

  ngOnDestroy(): void {
    // backup draft email and text data on local storage to backend DB

    this.contactDetailInfoService.saveDraft(
      this.storeService.emailContactDraft.getValue()
    );
    this.contactDetailInfoService.saveDraft(
      this.storeService.textContactDraft.getValue()
    );
    this.storeService.emailContactDraft.next({});
    this.storeService.textContactDraft.next({});

    this.destroy$.next(true);
  }

  changeContact(contactId) {
    this.location.replaceState(`/contacts/${contactId}`);
    const navigationExtras: NavigationExtras = {
      skipLocationChange: true
    };
    this.router.navigate([`/contacts/${contactId}`], navigationExtras);
  }

  changeActivityTab(id: ContactDetailActionType) {
    this.focusActivityTab = id;
  }

  refreshContact() {
    //reload left panel
    this.contactService.read(this._id, {}, false);
    //reload right panel's active tab
    this.contactDetailInfoService.refreshAll(this._id, this.focusActivityTab);
  }

  /*** === START: Mobile Layout management functions === ***/
  expandDataList(name: string, event?: any): void {
    event?.preventDefault();
    if (name !== this.expandedDataListName) {
      this.expandedDataListName = name;
    } else {
      this.expandedDataListName = '';
    }
  }

  clostDataList(): void {
    this.expandedDataListName = '';
  }

  changeDataList(name: string): void {
    this.expandedDataListName = name;
  }

  setDataSectionItems(_sectionTypes: string[]): void {
    this.enabledSectionTypes = _sectionTypes;
  }
  /*** === END: Mobile Layout management functions === ***/
}
