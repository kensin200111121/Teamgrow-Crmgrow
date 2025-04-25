import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import {
  DialogSettings,
  STATUS,
  WORK_TIMES,
  HOURS
} from '@constants/variable.constants';
import { Contact } from '@models/contact.model';
import { StoreService } from '@services/store.service';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from '@services/material.service';
import { CalendarMonthViewDay } from 'angular-calendar';
import { CampaignService } from '@services/campaign.service';
import {
  getCurrentTimezone,
  getNextBusinessDate,
  getUserTimezone,
  getZoneFromTimeZone,
  numPad,
  searchReg
} from '@app/helper';
import { ToastrService } from 'ngx-toastr';
import { HelperService } from '@services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { Location } from '@angular/common';
import { UserService } from '@services/user.service';
import { CampaignAddContactComponent } from '@components/campaign-add-contact/campaign-add-contact.component';
import { TemplatesBrowserComponent } from '@components/templates-browser/templates-browser.component';
import { Template } from '@models/template.model';
import { TemplatesService } from '@services/templates.service';
import { ThemeService } from '@services/theme.service';
import { ContactService } from '@services/contact.service';
import moment from 'moment-timezone';
import { Garbage } from '@models/garbage.model';
import { HandlerService } from '@app/services/handler.service';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';
@Component({
  selector: 'app-campaign-create',
  templateUrl: './campaign-create.component.html',
  styleUrls: ['./campaign-create.component.scss']
})
export class CampaignCreateComponent implements OnInit {
  stepIndex = 1;

  STATUS = STATUS;
  TIMES = WORK_TIMES;
  tmpTIMES;
  SELECTED_ACTIONS = [
    {
      label: 'Exclude from Contacts',
      type: 'button',
      command: 'exclude',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all filtered',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect filtered',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ];
  SELECTION_DISPLAY_COLUMNS = [
    'select',
    'contact_name',
    'contact_email',
    'contact_phone',
    'actions'
  ];
  @ViewChild('addDrawer') addDrawer: MatDrawer;
  @ViewChild('addPanel') addPanel: TemplatesBrowserComponent;
  panelType = '';

  selection: Contact[] = [];
  prevCampaignSelection: Contact[] = [];
  selecting = false;
  selectSource = '';
  loadingContacts = STATUS.NONE;
  pageSelectionContacts = [];
  selectionPage = 1;
  selectedSelection: Contact[] = [];

  // Templates
  selectedTemplate;
  allMaterials = [];
  materialLoadSubscription: Subscription;
  loadingMaterials = false;

  // Calendars
  today: Date = new Date();
  viewDate: Date = new Date();
  selectedCalDate: Date = new Date();
  selectedDate = moment();
  newCampaignStatus = [];
  currentDateStatus;
  selectedTime = '12:00:00.000';
  events = [];
  dayStatus = [];
  loadingCalendar = false;

  // Global
  title = '';
  saving = false;
  campaign_id = '';
  submitted = false;
  loadingCampaign = false;
  loadingCampaignContacts = false;
  dailyLimit = 300;
  submitAction = '';

  // attached Materials
  attachedMaterials: string[];

  // Campaign Load
  campaignForm: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;
  filteredCampaigns: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  searchingCampaign = false;
  searchCampaignStr = '';
  protected _onDestroy = new Subject<void>();

  creatingTemplate = false;
  editingTemplate = false;
  creatingNewsletter = false;
  MIN_DATE = {};

  date;
  time = '12:00:00.000';

  // Business Hour Setting
  time_zone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();
  enabledDays = [0, 1, 2, 3, 4, 5, 6];
  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    public campaignService: CampaignService,
    public contactService: ContactService,
    private userService: UserService,
    private templateService: TemplatesService,
    private themeService: ThemeService,
    private handlerService: HandlerService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private toast: ToastrService,
    private router: Router
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile.time_zone_info) {
          this.time_zone = getUserTimezone(profile, false);
          this.selectedDate = getNextBusinessDate(
            this.businessDay,
            this.time_zone
          );
        }
      }
    );

    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      const garbage = new Garbage().deserialize(res);
      if (garbage.business_time) {
        this.startTime = garbage.business_time.start_time;
        this.endTime = garbage.business_time.end_time;
      }
      if (garbage.business_day) {
        const availableDays = Object.values(garbage.business_day).filter(
          (item) => item
        );
        if (availableDays.length > 0) {
          this.businessDay = garbage.business_day;
        }
      }
      this.selectedDate = getNextBusinessDate(this.businessDay, this.time_zone);
      this.selectedTime = this.startTime;
    });
  }

  ngOnInit(): void {
    const page = this.route.snapshot.routeConfig.path;
    if (page.indexOf('bulk-mail/bulk/draft') !== -1) {
      this.campaign_id = this.route.snapshot.params.id;
    }

    if (this.campaign_id) {
      this.loadCampaign();
    }
    this.campaignService.loadAll();
    this.loadAvailableDates1();

    this.userService.garbage$.subscribe((res) => {
      if (res && res.smtp_info) {
        const smtp_info = res.smtp_info;
        this.dailyLimit = smtp_info.daily_limit || 400;

        let startIndex = 0;
        let endIndex = HOURS.length - 1;
        if (smtp_info.start_time) {
          this.startTime = smtp_info.start_time;
          startIndex = HOURS.findIndex((e) => e.id == this.startTime);
        }
        if (smtp_info.end_time) {
          this.endTime = smtp_info.end_time;
          endIndex = HOURS.findIndex((e) => e.id == this.endTime);
        }

        this.TIMES = HOURS.filter(
          (e, index) => index >= startIndex && index <= endIndex
        );
        this.tmpTIMES = this.TIMES;
        // this.setTimesByDate();
      }
    });

    this.campaignService.bulkLists$.subscribe((filters) => {
      this.filteredCampaigns.next(filters);
    });
    this.inputControl.valueChanges
      .pipe(
        filter((search) => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searchingCampaign = true)),
        map((search) => {
          this.searchCampaignStr = search;
          return this.campaignService.bulkLists$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((filters) => {
            if (this.searchCampaignStr) {
              const res = _.filter(filters, (e) => {
                return searchReg(e.title, this.searchCampaignStr);
              });
              this.filteredCampaigns.next(res);
            } else {
              this.filteredCampaigns.next(filters);
            }
            this.searchingCampaign = false;
          });
        },
        () => {
          this.searchingCampaign = false;
        }
      );
    this.campaignForm.valueChanges.subscribe((val) => {
      this.selectCampaign(val);
    });
  }

  /**
   * Go to back page
   */
  goToBack(): void {
    // this.location.back();
    this.router.navigate(['/bulk-mail']);
  }

  goToStep(step: number): void {
    if (step === 2) {
      if (!this.selectedTemplate || !this.title) {
        this.toast.warning(
          'Please enter name or select email template for bulk email.'
        );
        return;
      }
    }
    if (step === 3) {
      if (!this.selectedTemplate) {
        this.toast.warning('Please select email template for bulk email.');
        return;
      }
      if (!this.selection || !this.selection.length) {
        this.toast.warning('Please select contacts for bulk email.');
        return;
      }
    }
    if (step === 4) {
      if (!this.selectedTemplate) {
        this.toast.warning('Please select email template for bulk email.');
        return;
      }
      if (!this.selection || !this.selection.length) {
        this.toast.warning('Please select contacts for bulk email.');
        return;
      }
      if (!this.newCampaignStatus || !this.newCampaignStatus.length) {
        this.toast.warning('Please set the date for new bulk email.');
        return;
      }
    }
    this.stepIndex = step;
  }

  loadCampaign(): void {
    this.loadingCampaign = true;
    this.campaignService.loadDraft(this.campaign_id).subscribe((res) => {
      this.loadingCampaign = false;
      if (res && res['data']) {
        if (res['data'] && res['data']['contacts']) {
          this.selection = res['data']['contacts'].map((e) =>
            new Contact().deserialize(e)
          );
        }
        if (res['data'] && res['data']['campaign']) {
          const campaign = res['data']['campaign'];
          this.title = campaign['title'];
          this.selectedTemplate =
            campaign['email_template'] || campaign['newsletter'];
          if (campaign['due_start']) {
            const due_date = new Date(campaign['due_start']);
            const year = due_date.getFullYear();
            const month = numPad(due_date.getMonth() + 1);
            const date = numPad(due_date.getDate());
            const hour = numPad(due_date.getHours());
            const min = numPad(due_date.getMinutes());
            this.selectedDate = moment.tz(
              `${year}-${month}-${date} 00:00:00.000`,
              this.time_zone
            );
            // this.selectedTime = `${hour}:${min}:00.000`;
            this.viewDate = due_date;
            this.selectedCalDate = this.viewDate;
          }
          const selection = campaign['contacts'].map((e) =>
            new Contact().deserialize({ _id: e })
          );
          this.selection = [...this.selection, ...selection];
          this.selection = _.uniqBy(this.selection, '_id');
          // Load All contacts
          if (this.selection.length > 50) {
            this.loadAllCampaignContacts();
          }
        }
        if (
          this.selectedDate &&
          this.selection &&
          this.selection.length &&
          this.selectedTemplate
        ) {
          this.stepIndex = 4;
        } else if (
          this.selectedTemplate &&
          this.selection &&
          this.selection.length
        ) {
          this.stepIndex = 3;
        } else if (this.selection && this.selection.length) {
          this.stepIndex = 2;
        }
      } else {
        // Go Back
        this.goToBack();
      }
    });
  }

  loadAllCampaignContacts(): void {
    this.loadingCampaignContacts = true;
    this.campaignService.loadContacts(this.campaign_id).subscribe((res) => {
      this.loadingCampaignContacts = false;
      if (res && res['data']) {
        this.selection = res['data'].map((e) => new Contact().deserialize(e));
      }
    });
  }

  selectCampaign(campaign: any): void {
    if (campaign === null) return;
    this.loadingCampaignContacts = true;
    this.campaignService.loadContacts(campaign._id).subscribe((res) => {
      this.loadingCampaignContacts = false;
      this.prevCampaignSelection = res['data'].map((e) =>
        new Contact().deserialize(e)
      );
      this.selection = _.uniqBy(
        [...this.selection, ...this.prevCampaignSelection],
        '_id'
      );
    });
  }

  cancelSelect() {
    this.campaignForm.setValue(null);
    this.selection = [];
  }

  /*******************************************
   *******************************************
   Step 1 - Contacts Select
   *******************************************
   *******************************************/
  createContact(): void {
    this.dialog
      .open(ContactCreateEditComponent, {
        ...DialogSettings.CONTACT
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.contact) {
          this.selection.push(new Contact().deserialize(res.contact));
        }
      });
  }

  selectFromContacts(): void {
    this.dialog
      .open(CampaignAddContactComponent, {
        width: '96vw',
        maxWidth: '1440px',
        height: 'calc(65vh + 140px)'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.contacts && res.contacts.length) {
          // contacts
          this.selection = _.uniqBy(
            [...this.selection, ...res.contacts],
            '_id'
          );
        }
      });
  }

  masterSelectionToggle(): void {
    const page = this.selectionPage;
    let skip = (page - 1) * 50;
    skip = skip < 0 ? 0 : skip;
    // Reset the Page Contacts
    this.pageSelectionContacts = this.selection.slice(skip, skip + 50);
    if (this.isAllSelectionSelected()) {
      this.selectedSelection = _.differenceBy(
        this.selectedSelection,
        this.pageSelectionContacts,
        '_id'
      );
      return;
    }
    this.pageSelectionContacts.forEach((e) => {
      if (!this.isSelectionSelected(e)) {
        this.selectedSelection.push(e);
      }
    });
  }
  isAllSelectionSelected(): boolean {
    const currentSelection = _.intersectionBy(
      this.selectedSelection,
      this.pageSelectionContacts,
      '_id'
    );
    return currentSelection.length === this.pageSelectionContacts.length;
  }
  toggleSelection(contact: Contact): void {
    const selectedContact = contact;
    const toggledAllSelection = _.xorBy(
      this.selectedSelection,
      [selectedContact],
      '_id'
    );
    this.selectedSelection = toggledAllSelection;
  }
  isSelectionSelected(contact: Contact): boolean {
    return _.findIndex(this.selectedSelection, contact, '_id') !== -1;
  }
  removeSelected(contact: Contact): void {
    const toggledAllSelection = _.xorBy(this.selection, [contact], '_id');
    this.selection = toggledAllSelection;
    const page = this.selectionPage;
    let skip = (page - 1) * 50;
    skip = skip < 0 ? 0 : skip;
    this.pageSelectionContacts = this.selection.slice(skip, skip + 50);
    const newSelections = _.intersectionBy(
      toggledAllSelection,
      this.selectedSelection,
      '_id'
    );
    this.selectedSelection = newSelections;
  }
  removeSelections(): void {
    const toggledAllSelection = _.xorBy(
      this.selection,
      this.selectedSelection,
      '_id'
    );
    this.selection = toggledAllSelection;
    this.selectedSelection = [];
  }
  doSelectedAction(event: any): void {
    if (event.command === 'select') {
      this.selectAll();
      return;
    } else if (event.command === 'exclude') {
      this.removeSelections();
    } else if (event.command === 'deselect') {
      this.deselectAll();
    }
  }
  deselectAll(): void {
    this.selectedSelection = [];
  }
  selectAll(source = false): void {
    this.selectSource = 'page';
    this.selectedSelection = this.selection;
  }
  changeSelectedPage(page: number): void {
    this.selectionPage = page;
    let skip = (page - 1) * 50;
    skip = skip < 0 ? 0 : skip;
    // Reset the Page Contacts
    this.pageSelectionContacts = this.selection.slice(skip, skip + 50);
  }

  /*******************************************
   *******************************************
   Step 2 - Select Templates
   *******************************************
   *******************************************/
  browseTemplate(): void {
    this.addDrawer.open();
  }

  openAction(): void {
    this.addDrawer.open();
  }

  closeAddAction($event): void {
    if ($event) {
      this.selectTemplate($event);
    }
    this.addDrawer.close();
  }

  createTemplate(): void {
    this.creatingTemplate = true;
    this.editingTemplate = false;
    this.creatingNewsletter = false;
  }

  editTemplate(): void {
    this.editingTemplate = true;
    this.creatingTemplate = false;
    this.creatingNewsletter = false;
  }

  createNewsletter(): void {
    this.creatingTemplate = false;
    this.editingTemplate = false;
    this.creatingNewsletter = true;
  }

  editNewsletter(): void {
    this.creatingTemplate = false;
    this.editingTemplate = false;
    this.creatingNewsletter = true;
  }

  onEditTemplate(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
    }
    this.editingTemplate = false;
  }

  onCreateTemplate(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
      this.templateService.create$(this.selectedTemplate);
    }
    this.creatingTemplate = false;
  }

  onEditNewsletter(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
    }
    this.creatingNewsletter = false;
  }
  onCreateNewsletter(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
      this.themeService.create$(this.selectedTemplate);
    }
    this.creatingNewsletter = false;
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
  }
  /*******************************************
   *******************************************
   Step 3 - Select Date
   *******************************************
   *******************************************/
  _processCampaigns(_items, _reducedCount, count_value): any {
    let sum_contacts_count = 0;
    const res_arr = [];
    for (let i = 0; i < _items.length; i++) {
      const tempSum = sum_contacts_count;
      sum_contacts_count += _items[i].contacts.length;
      if (
        _reducedCount - count_value >= tempSum &&
        _reducedCount - count_value < sum_contacts_count
      ) {
        res_arr.push({
          title: _items[i].campaign[0].title,
          subject: _items[i].campaign[0].subject
        });
      } else if (
        _reducedCount - count_value < tempSum &&
        _reducedCount >= tempSum
      ) {
        res_arr.push({
          title: _items[i].campaign[0].title,
          subject: _items[i].campaign[0].subject
        });
      }
    }
    return res_arr;
  }
  loadAvailableDates1(): void {
    this.campaignService.loadDayStatus().subscribe((res) => {
      if (res['status']) {
        let campaigns = [];
        res['data'].forEach((e) => {
          if (e.items && e.items.length > 0) {
            e.items.forEach((element) => {
              if (element.campaign && element.campaign.length > 0) {
                element.campaign.forEach((campaign) => {
                  if (
                    moment(campaign['due_start']).isSameOrAfter(
                      moment().startOf('day')
                    )
                  ) {
                    campaigns.push(campaign);
                  }
                });
              }
            });
          }
        });
        campaigns = _.orderBy(campaigns, ['due_start'], ['asc']);

        campaigns.forEach((e) => {
          const contacts_count = e.contacts.length;
          let curDate = moment(e.due_start).startOf('day');
          const { title, subject } = e;

          let currentCount = contacts_count;
          while (currentCount > 0) {
            const index = this.dayStatus.findIndex((item) =>
              moment(item.curDate).isSame(curDate)
            );
            if (index >= 0) {
              const sameDayStatus = this.dayStatus[index];
              if (sameDayStatus.count < this.dailyLimit) {
                const limit_count = this.dailyLimit - sameDayStatus.count;
                const count =
                  currentCount > limit_count ? limit_count : currentCount;

                this.dayStatus[index] = {
                  ...sameDayStatus,
                  campaigns: [
                    ...sameDayStatus.campaigns,
                    { title, subject, count }
                  ],
                  count: sameDayStatus.count + count
                };
                currentCount -= limit_count;
              }
            } else {
              const count =
                currentCount > this.dailyLimit ? this.dailyLimit : currentCount;
              this.dayStatus.push({
                curDate: curDate.clone().toDate(),
                campaigns: [{ title, subject, count }],
                count
              });
              currentCount -= this.dailyLimit;
            }
            curDate = curDate.add(1, 'day');
          }
        });
      }
    });
  }

  loadAvailableDates(): void {
    this.loadingCalendar = true;
    this.campaignService.loadDayStatus().subscribe((res) => {
      this.loadingCalendar = false;
      this.events = [];
      res['data'].forEach((event) => {
        const year = event._id.year;
        const month = numPad(event._id.month);
        const day = numPad(event._id.day);
        const date = new Date(`${year}-${month}-${day}`);

        const _formattedEvent = {
          title: event.contacts_count,
          start: date,
          end: date
        };
        this.events.push(_formattedEvent);
      });
    });
  }

  calendarDateChange(mode: string): void {}

  selectDate(day): void {
    if (day.date) {
      this.selectedDate = day.date;
      this.selectedCalDate = day.date;
    }
  }

  dateIsValid(date: Date): boolean {
    return date.getTime() + 3600 * 1000 * 18 < new Date().getTime();
  }
  dateIsSelected(date: Date): boolean {
    return (
      date.toLocaleDateString() === this.selectedCalDate.toLocaleDateString()
    );
  }

  applyDateSelectionPolicy({ body }: { body: CalendarMonthViewDay[] }): void {
    body.forEach((day) => {
      let cssClass = '';
      if (day.events && day.events.length) {
        if (parseInt(day.events[0].title + '') > this.dailyLimit) {
          cssClass += 'over-campaign';
        } else {
          cssClass += 'has-campaign';
        }
      }
      if (this.dateIsValid(day.date)) {
        cssClass += ' disabled-date';
      }
      day.cssClass = cssClass;
    });
  }

  /*******************************************
   *******************************************
   Step 4 - Select Date
   *******************************************
   *******************************************/

  getDueTime() {
    if (this.selectedDate) {
      const year = this.selectedDate.year();
      const month = this.selectedDate.month() + 1;
      const day = this.selectedDate.date();
      const time = this.selectedTime || WORK_TIMES[0].id;

      const due_date = moment.tz(
        `${year}-${numPad(month)}-${numPad(day)} ${time}`,
        this.time_zone
      );
      return due_date;
    } else {
      return null;
    }
  }

  generateCampaignData(): any {
    const contacts = this.selection.map((e) => e._id);
    const campaign = {
      contacts: contacts,
      videos: [],
      pdfs: [],
      images: [],
      title: '',
      due_start: null,
      newsletter: null,
      // email_template: null
      subject: '',
      content: ''
    };
    if (this.campaign_id) {
      campaign['id'] = this.campaign_id;
    }
    campaign.title = this.title;
    campaign.due_start = this.getDueTime();
    if (this.selectedTemplate && this.selectedTemplate.type === 'email') {
      // campaign['email_template'] = this.selectedTemplate['_id'];
      campaign['subject'] = this.selectedTemplate['subject'];
      campaign['content'] = this.selectedTemplate['content'];
      campaign.videos = this.selectedTemplate.video_ids;
      campaign.pdfs = this.selectedTemplate.pdf_ids;
      campaign.images = this.selectedTemplate.image_ids;
    } else {
      campaign['newsletter'] = this.selectedTemplate['_id'];
    }
    return campaign;
  }

  saveDraft(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'draft';
    this.saving = true;
    this.campaignService.saveAsDraft(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.goToBack();
      }
    });
  }

  publish(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'publish';
    this.saving = true;
    this.campaignService.publish(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.goToBack();
      }
    });
  }

  create(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'publish';
    this.saving = true;
    this.campaignService.create(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.handlerService.runScheduleTasks();
        this.goToBack();
      }
    });
  }

  onChangeDate($event): void {
    this.selectedDate = moment({
      years: $event.year,
      months: $event.month - 1,
      days: $event.day
    });

    this.currentDateStatus = this.dayStatus.find((item) =>
      moment(item.curDate).isSame(moment(this.selectedDate))
    );

    this.newCampaignStatus = [];

    // this.setTimesByDate();
  }

  onSetDate(): void {
    const dayStatusTmp = JSON.parse(JSON.stringify(this.dayStatus));
    const nextDay = this.selectedDate.clone();

    let c_contacts_count = this.selection.length;
    const limit_count = this.dailyLimit;
    const cur_campaign = [];
    cur_campaign.push(this.title);
    this.newCampaignStatus = [];
    while (c_contacts_count > 0) {
      let count_value = limit_count;
      let is_push = false;

      const oldStatus = dayStatusTmp.find((item) =>
        nextDay.isSame(moment(item.curDate))
      );
      if (oldStatus) {
        if (oldStatus.count < limit_count) {
          count_value = limit_count - oldStatus.count;
          is_push = true;
        }
      } else {
        is_push = true;
      }
      if (is_push) {
        if (c_contacts_count >= count_value) {
          c_contacts_count = c_contacts_count - count_value;
        } else {
          count_value = c_contacts_count;
          c_contacts_count = 0;
        }

        this.newCampaignStatus.push({
          curDate: nextDay.toDate(),
          count: count_value
        });
        if (oldStatus) {
          if (oldStatus.count < limit_count) {
            oldStatus.count = oldStatus.count + count_value;
            oldStatus.campaigns.push(this.title);
          }
        } else {
          dayStatusTmp.push({
            curDate: nextDay.toDate(),
            count: count_value,
            campaigns: cur_campaign,
            virtual: true
          });
        }
      }
      if (nextDay.isoWeekday() == 7) {
        nextDay.day(1);
      } else if (nextDay.isoWeekday() >= 5) {
        nextDay.day(8);
      } else {
        nextDay.add(1, 'day');
      }
    }
    this.currentDateStatus = this.dayStatus.find(
      (item) => item.curDate.setHours(0, 0, 0, 0) === this.selectedDate
    );
    // this.setTimesByDate();
  }

  setTimesByDate(): void {
    const curTime = moment(this.today.getTime()).format('HH:mm:[00.000]');

    if (
      moment(this.today.getTime()).format('YYYY-MM-DD') ==
      this.selectedDate.format('YYYY-MM-DD')
    ) {
      //Filter TIMES
      this.TIMES = this.TIMES.filter((e) => e.id >= curTime);
    } else {
      this.TIMES = this.tmpTIMES;
    }
    if (this.TIMES.length) {
      this.selectedTime = this.TIMES[0].id;
    }
  }

  getSelectedDate(): string {
    return this.selectedDate.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.selectedDate = dateTime.date;
    this.selectedTime = dateTime.time;
    this.time_zone = dateTime.timezone;
    this.onSetDate();
  }
}
