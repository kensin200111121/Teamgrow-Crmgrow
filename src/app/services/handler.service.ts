import { Location } from '@angular/common';
import { Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ROUTE_PAGE } from '@constants/variable.constants';
import { Activity } from '@models/activity.model';
import { DetailActivity, PureActivity } from '@models/activityDetail.model';
import { Contact, ContactActivity } from '@models/contact.model';
import { ActivityService } from '@services/activity.service';
import { AutomationService } from '@services/automation.service';
import { CampaignService } from '@services/campaign.service';
import { ContactService } from '@services/contact.service';
import { DealsService } from '@services/deals.service';
import { ErrorService } from '@services/error.service';
import { FilterService } from '@services/filter.service';
import { LabelService } from '@services/label.service';
import { MaterialService } from '@services/material.service';
import { SmsService } from '@services/sms.service';
import { StoreService } from '@services/store.service';
import { TagService } from '@services/tag.service';
import { TaskService } from '@services/task.service';
import { TeamService } from '@services/team.service';
import { TemplatesService } from '@services/templates.service';
import { ThemeService } from '@services/theme.service';
import { UserService } from '@services/user.service';
import { NotificationService } from './notification.service';
import { AutomationListService } from './automation-list.service';
import { ContactListType } from '@app/utils/enum';
@Injectable({
  providedIn: 'root'
})
export class HandlerService {
  pageName: BehaviorSubject<string> = new BehaviorSubject('');
  searchStr: BehaviorSubject<string> = new BehaviorSubject('');
  openSearch: BehaviorSubject<boolean> = new BehaviorSubject(false);
  refreshMaterial: BehaviorSubject<boolean> = new BehaviorSubject(false);
  searchStr$ = this.searchStr.asObservable();
  openSearch$ = this.openSearch.asObservable();
  updaterTime: BehaviorSubject<any> = new BehaviorSubject(new Date());
  updaterTime$ = this.updaterTime.asObservable();
  readMessageContact: BehaviorSubject<any> = new BehaviorSubject(null);
  readMessageContact$ = this.readMessageContact.asObservable();
  readNotification: BehaviorSubject<any> = new BehaviorSubject(null);
  readNotification$ = this.readNotification.asObservable();
  openRecording: BehaviorSubject<any> = new BehaviorSubject(null);
  openRecording$ = this.openRecording.asObservable();
  scheduleTasks: BehaviorSubject<any> = new BehaviorSubject(null);
  scheduleTasks$ = this.scheduleTasks.asObservable();

  //prev/next on contact detail page
  selectedContactListType: ContactListType | null = null;

  // import csv contacts
  columns: any[] = [];
  lines: any[] = [];
  selectedCountry: any = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };

  constructor(
    private storeService: StoreService,
    private taskService: TaskService,
    private activityService: ActivityService,
    private contactService: ContactService,
    private materialService: MaterialService,
    private templateService: TemplatesService,
    private automationService: AutomationService,
    private automationListService: AutomationListService,
    private dealService: DealsService,
    private teamService: TeamService,
    private themeService: ThemeService,
    private errorService: ErrorService,
    private labelService: LabelService,
    private userService: UserService,
    private campaignService: CampaignService,
    private tagService: TagService,
    private filterService: FilterService,
    private smsService: SmsService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private ngZone: NgZone
  ) {
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url.indexOf('/global-search') !== -1) {
          this.openSearch.next(true);
        } else {
          this.openSearch.next(false);
        }
      });
  }

  updateQueueTasks(): void {
    this.updaterTime.next(new Date());
  }

  /**
   * Display the added contact to the list pages (Contacts, activities)
   * @param contact : New Contact Data
   */
  addContact$(contact: Contact): void {
    // Contact Page update: Prepend the new contact to the list page
    const newContact = new ContactActivity().deserialize(contact);
    newContact.last_activity = new PureActivity().deserialize({
      type: 'contacts',
      content: 'added contact'
    });
    const contacts = this.storeService.pageContacts.getValue();
    contacts.unshift(newContact);
    this.storeService.pageContacts.next([...contacts]);
    // TODO(Update above logic): If page is 1, prepend the new contact.
    // Else contact page is not 1, reload the current page.
    // If Search option is not empty, check the search option and add or ...

    // *** Activity Page update: Prepend the new activity to the list page
    // const newActivity = new Activity().deserialize({
    //   type: 'contacts',
    //   content: 'added contact'
    // });
    // newActivity.contacts = new Contact().deserialize(contact);
    // const activities = this.storeService.activities.getValue();
    // activities.unshift(newActivity);
    // this.storeService.activities.next([...activities]);
    // *** TODO(Update above Logic): If activity page is 1, prepend the new activity
    // *** Else activity page is not 1, reload the current page
    this.reload$('activities');
  }

  bulkContactAdd$(): void {
    // Reload the Contact page
    // this.contactService.reloadPage();
    // Reload the Activity Page
    // this.activityService.reload();
    const page = this.pageName.getValue();
    if (page === 'dashboard') {
      this.reloadActivities$();
    } else if (page === 'contacts') {
      this.reloadContacts$();
    }
  }

  bulkContactUpdate$(_ids: string[], contact: any, tagData: any): void {
    // Contacts list update
    const contacts = this.storeService.pageContacts.getValue();
    contacts.forEach((e) => {
      if (_ids.indexOf(e._id) !== -1) {
        e.deserialize(contact);
        if (tagData['option']) {
          e.updateTag(tagData);
        }
      }
    });
    // Activities list update
    const activities = this.storeService.activities.getValue();
    activities.forEach((e) => {
      if (_ids.indexOf(e.contacts._id) !== -1) {
        e.contacts.deserialize(contact);
      }
    });
    // Tasks list update
    const tasks = this.storeService.tasks.getValue();
    tasks.forEach((e) => {
      if (e.contact && _ids.indexOf(e.contact._id) !== -1) {
        e.contact.deserialize(contact);
      }
    });
    // selected contacts update
  }

  bulkContactRemove$(_ids: string[]): void {
    // Update the Contacts Page
    // If search option is not empty, the update is working
    // If search option is empty, reload the current page. (the page is out of bounds, should reload the last page again.)
    // *** Update the Activity Page: Reload
    // this.activityService.reload();
    // *** Update the Task Page: Remove the Tasks
    // const tasks = this.storeService.tasks.getValue();
    // for (let i = tasks.length - 1; i >= 0; i--) {
    //   const task = tasks[i];
    //   if (_ids.indexOf(task.contact._id) !== -1) {
    //     tasks.splice(i, 1);
    //   }
    // }
    // this.storeService.tasks.next(tasks);
  }

  updateLastActivities$(_ids: string[], type: string): void {
    const activity = new PureActivity();
    switch (type) {
      case 'note':
        activity.type = 'notes';
        activity.content = 'added note';
        break;
      case 'task':
        activity.type = 'follow_ups';
        activity.content = 'added follow up';
        break;
      case 'task_update':
        activity.type = 'follow_ups';
        activity.content = 'updated follow up';
        break;
      case 'task_complete':
        activity.type = 'follow_ups';
        activity.content = 'completed follow up';
        break;
    }
    // Contacts list update
    const contacts = this.storeService.pageContacts.getValue();
    contacts.forEach((e) => {
      if (_ids.indexOf(e._id) !== -1) {
        e.last_activity = activity;
      }
    });
  }

  activityAdd$(_ids: string[], type: string): void {
    // Contacts list update
    this.updateLastActivities$(_ids, type);

    // Activities Page Update
    this.reload$('activities');
  }

  /**
   * Update the tasks list and activity list (reload or unshift) after update, bulk update, complete bulk complete
   * @param _ids : ids of task that has updated
   * @param data : data of task that has updated
   */
  updateTasks$(_ids: string[], data: any): void {
    const page = this.pageName.getValue();
    if (page === 'detail') {
      return;
    }
    const tasks = this.storeService.tasks.getValue();
    const activities = [];
    tasks.forEach((e) => {
      if (_ids.indexOf(e._id) !== -1) {
        e.merge(data);
        // Create new Activity with task contact
        const activity = new Activity();
        if (data.status) {
          activity.content = 'completed follow up';
        } else {
          activity.content = 'updated follow up';
        }
        activity.type = 'follow_ups';
        activity.contacts = e.contact;
        activities.push(activity);
      }
    });
    if (activities.length !== _ids.length) {
      this.activityService.reload();
    } else {
      const page = this.activityService.page.getValue();
      const pageSize = this.activityService.pageSize.getValue();
      if (page === 1) {
        let activityList = this.storeService.activities.getValue();
        activityList = [...activities, ...activityList];
        activityList.splice(pageSize);
        this.storeService.activities.next(activityList);
      } else {
        this.activityService.reload();
      }
    }
  }

  updateContactRelated$(field, data): void {
    const selectedContact = this.storeService.selectedContact.getValue();
    if (selectedContact && selectedContact.details) {
      selectedContact.details[field] = [...data];
    }
  }

  reload$(tab = ''): void {
    const page = this.pageName.getValue();
    switch (page) {
      case 'dashboard':
        if (tab === 'tasks') {
          this.reloadTasks$();
        } else if (tab === 'activities') {
          this.reloadActivities$();
        } else {
          this.reloadTasks$();
          this.reloadActivities$();
        }
        break;
      case 'tasks':
        this.reloadTasks$();
        break;
      case 'contacts':
        if (!tab || tab === 'contacts') {
          this.reloadContacts$();
        }
        break;
      case 'detail':
        if (!tab || tab === 'detail') {
          this.reloadDetail$();
        }
        if (!tab || tab === 'tasks') {
        }
        break;
    }
  }

  addLatestActivities$(count: number): void {
    const page = this.pageName.getValue();
    switch (page) {
      case 'dashboard':
        this.reloadActivities$();
        break;
      case 'contacts':
        this.reloadContacts$();
        break;
    }
  }

  reloadTasks$(): void {
    this.taskService.reload();
  }

  reloadActivities$(): void {
    this.activityService.reload();
  }

  reloadContacts$(): void {
    this.contactService.reloadPage();
  }

  reloadDetail$(): void {
    this.contactService.reloadDetail();
  }

  saveCSVFileData$(columns, lines): void {
    this.columns = columns;
    this.lines = lines;
  }

  saveSelectedCountry$(country): void {
    this.selectedCountry = country;
  }

  clearImportCSVContact$(): void {
    this.columns = [];
    this.lines = [];
    this.selectedCountry = {
      areaCodes: undefined,
      dialCode: '',
      iso2: '',
      name: '',
      placeholder: '',
      priority: 0
    };
  }

  runScheduleTasks(): void {
    this.notificationService.getAllTasks().subscribe((res) => {
      this.scheduleTasks.next(res?.data.length || 0);
    });
  }

  clearData(): void {
    this.activityService.clear$();
    this.taskService.clear$();
    this.contactService.clear$();
    this.materialService.clear$();
    this.storeService.clearData();
    this.automationService.clear$();
    this.automationListService.clear$();
    this.templateService.clear$();
    this.dealService.clear$();
    this.errorService.clear$();
    this.labelService.clear$();
    this.tagService.clear$();
    this.teamService.clear$();
    this.themeService.clear$();
    this.filterService.clear$();
    this.campaignService.clear$();
    this.smsService.clear$();
    this.scheduleTasks.next(null);
  }
}
