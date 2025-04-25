import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import {
  ActionDataType,
  Contact,
  ContactActionUIScheme
} from '@models/contact.model';
import { ContactService } from '@app/services/contact.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { ContactActionService } from '@app/services/contact-action.service';
import { StoreService } from '@app/services/store.service';
import { TaskService } from '@app/services/task.service';
import { UserService } from '@app/services/user.service';
import { DealCreateComponent } from '@app/components/deal-create/deal-create.component';
import { ContactAutomationAssignModalComponent } from './contact-automation-assign-modal/contact-automation-assign-modal.component';
import { DialogSettings } from '@app/constants/variable.constants';

@Component({
  selector: 'app-contact-data-list-container',
  templateUrl: './contact-data-list-container.component.html',
  styleUrls: ['./contact-data-list-container.component.scss']
})
export class ContactDataListContainerComponent implements OnInit {
  taskExpand = false;
  objects = ContactActionUIScheme;
  totalActionCount: {
    [typeKey in ActionDataType]: number;
  } = {
    follow_up: 0,
    deal: 0,
    appointment: 0,
    automation: 0,
    task: 0
  };
  taskLoading = false;
  tasks = [];

  selectedContact: Contact;
  private readonly destroy$ = new Subject();
  contactId = null;
  contactMainInfo: Contact = new Contact();
  properties = [];
  isAgentExpanded = false;
  isAgentFire = false;
  isInitAutomationLoading = true;

  @Input()
  public set setContactId(val: string) {
    if (val) {
      const originalContactId = this.contactId;
      this.contactId = val;
      this.loadTasks(this.contactId);
      this._initLoadInfo(
        this.contactId,
        originalContactId && originalContactId !== this.contactId
      );
    }
  }
  @Input()
  set dataSection(val: string) {
    this.handleExpand(val, false, true);
  }

  @Output() closeDataList = new EventEmitter();
  @Output() changeDataSection: EventEmitter<string> = new EventEmitter();
  @Output() changeSections = new EventEmitter();

  constructor(
    private contactService: ContactService,
    private contactActionService: ContactActionService,
    private dialog: MatDialog,
    public contactDetailInfoService: ContactDetailInfoService,
    private storeService: StoreService,
    private taskService: TaskService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.taskService.scheduleData$.subscribe((res) => {
      try {
        if (Object.keys(res).length === 0) {
          this.loadTasks(this.contactId);
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  loadAutomation() {
    this.contactService.loadTimeline(this.contactId).subscribe((res) => {
      if (this.isInitAutomationLoading === true) {
        this.isInitAutomationLoading = false;
      }

      const automationIndex = this.objects.findIndex(
        (item) => item.type === 'automation'
      );
      if (automationIndex !== -1) {
        this.objects[automationIndex].items = [
          ...res.contact_automation_lines,
          ...res.deal_automation_lines
        ];
      }
    });
  }

  _initLoadInfo(contactId, forceReload = false) {
    this.destroy$.next(true);
    this.loadAutomation();
    this.storeService.selectedContactMainInfo$.subscribe((contact) => {
      if (!contact?._id) {
        return;
      }
      this.contactMainInfo = new Contact().deserialize({ ...contact });
      this.isAgentFire = contact?.type === 'agentFire';
      this.onObjectsChange();
      if (this.isAgentFire) {
        this.loadProperties(contactId);
      }
    });
    Object.keys(this.totalActionCount).forEach((item) => {
      this.contactDetailInfoService
        .getActionTotalCountWithType(this.contactId, item as ActionDataType)
        .subscribe(() => {});
      this.contactDetailInfoService.actionTotalCount$[item]?.subscribe(
        (data) => {
          this.totalActionCount[item] = data;
        }
      );
    });
  }

  private loadProperties(contactId: string): void {
    this.contactDetailInfoService
      .loadProperties(contactId)
      .subscribe((data) => {
        this.properties = data ?? [];
      });
  }

  private loadTasks(_id: string): void {
    this.taskLoading = true;
    this.contactService.loadTasks(_id).subscribe((res) => {
      this.taskLoading = false;
      let tasks = [];
      let automations = [];
      const automationDic = {};
      res.forEach((e) => {
        Object.keys(e).forEach((key) => {
          if (key !== 'automations') {
            tasks = [...tasks, ...e[key]];
          } else {
            automations = e[key];
          }
        });
      });
      automations.forEach((e) => {
        automationDic[e._id] = e;
      });
      this.tasks = [...tasks];
      this.tasks.forEach((e) => {
        if (e.campaign) {
          e.task_type = 'Bulk Email';
          e.task_original_type = 'Bulk Email';
          e.detail_page = '/bulk-mail/bulk/' + e.campaign._id;
        } else if (e.type === 'send_email') {
          e.task_original_type = 'email';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring email';
          } else if (e.set_recurrence === false) {
            e.task_type = 'Send email';
          } else {
            e.task_type = 'Email';
          }
          e.detail_page = '/email-queue/' + e.process;
        } else if (e.type === 'send_text') {
          e.task_original_type = 'text';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring text';
          } else if (e.set_recurrence === false) {
            e.task_type = 'Send text';
          }
          e.detail_page = '/text-queue/' + e.process;
        }
      });
      this.totalActionCount.task = this.tasks.length;
      this.contactDetailInfoService.actionTotalCount.task.next(
        this.tasks.length
      );
      if (
        this.tasks.length &&
        this.objects.findIndex((e) => e.name === 'Scheduled Items') < 0
      ) {
        this.objects.unshift({
          name: 'Scheduled Items',
          type: 'task',
          icon: 'i-task',
          items: [],
          emptyStr: 'No Scheduled Items. Create one clicking in “+” (Plus).',
          isExpanded: false
        });
        this.onObjectsChange();
      } else if (
        this.tasks.length === 0 &&
        this.objects.findIndex((e) => e.name === 'Scheduled Items') >= 0
      ) {
        this.objects.shift();
        this.onObjectsChange();
      }
    });
  }

  private onObjectsChange() {
    const objectTypes = this.objects.map((e) => e.type);
    if (this.isAgentFire) {
      objectTypes.push('agentFire');
    }
    this.changeSections.emit(objectTypes);
  }

  handleExpand(name: string, shouldEmitEvent = true, mobileFlag: boolean) {
    if (!mobileFlag) {
      if (name === 'agent') this.isAgentExpanded = !this.isAgentExpanded;
      else {
        this.objects.forEach((obj) => {
          if (obj.name === name) obj.isExpanded = !obj.isExpanded;
          else obj.isExpanded = false;
        });
      }
    } else {
      if (name === 'agent') this.isAgentExpanded = true;
      else {
        this.objects.forEach((obj) => {
          if (obj.name === name) obj.isExpanded = true;
          else obj.isExpanded = false;
        });
      }
    }
    shouldEmitEvent && this.changeDataSection.emit(name);
  }

  addData(type: string) {
    if (type === 'Tasks') this.openTaskDlg();
    else if (type === 'Deals') this.openDealDlg();
    else if (type === 'Appointments') this.openAppointmentDlg();
    else if (type === 'Automations') this.openAutomationDlg();
  }

  openTaskDlg(): void {
    this.contactActionService.openTaskDlg();
  }

  openAppointmentDlg(): void {
    this.contactActionService.openAppointmentDlg();
  }

  openDealDlg(): void {
    const contact = new Contact().deserialize({
      _id: this.contactMainInfo._id,
      first_name: this.contactMainInfo.first_name,
      last_name: this.contactMainInfo.last_name,
      email: this.contactMainInfo.email,
      cell_phone: this.contactMainInfo.cell_phone
    });

    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactId,
            'deal'
          );
        }
      });
  }

  openAutomationDlg() {
    this.dialog
      .open(ContactAutomationAssignModalComponent, {
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          contactId: this.contactId,
          contactMainInfo: this.contactMainInfo
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.loadAutomation();
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactId,
            'automation'
          );
        }
      });
  }

  close(): void {
    this.closeDataList.emit();
  }

  updateAutomationCount(data: any[]): void {
    this.totalActionCount.automation = data.length;
    this.loadAutomation();
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactId,
      'automation'
    );
  }
}
