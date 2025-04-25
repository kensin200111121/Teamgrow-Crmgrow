import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';
import { Subscription, Observable, fromEvent } from 'rxjs';
import { HOURS, REPEAT_DURATIONS, TIMES } from '@constants/variable.constants';
import { Contact } from '@models/contact.model';
import { Task } from '@models/task.model';
import { HandlerService } from '@services/handler.service';
import { TaskService } from '@services/task.service';
import { getNextBusinessDate } from '@app/helper';
import moment from 'moment-timezone';
import { UserService } from '@services/user.service';
import { DealsService } from '@services/deals.service';
import { ContactService } from '@services/contact.service';
import { Garbage } from '@models/garbage.model';
import { Account } from '@models/user.model';
import { AssigneeSelectComponent } from '@app/components/assignee-select/assignee-select.component';
import { InputContactsComponent } from '@app/components/input-contacts/input-contacts.component';
import { BusinessDateTimePickerComponent } from '@app/components/business-date-time-picker/business-date-time-picker.component';

@Component({
  selector: 'app-task-create',
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.scss']
})
export class TaskCreateComponent implements OnInit, OnDestroy {
  readonly REPEAT_DURATIONS = REPEAT_DURATIONS;
  readonly TIMES = TIMES;

  date;
  time = '12:00:00.000';
  task = new Task();
  isSelected = false;
  contacts: Contact[] = [];

  saving = false;
  saveSubscription: Subscription;
  type = '';
  dealId;

  toFocus = false;
  taskCheck = false;

  requiredDateTime = false;

  allDayEvent = false;

  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  private businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };
  time_zone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  assignee_enabled = false;
  assignee_editable = false;
  selectedAssignee;
  accountLoadSubscription: Subscription;

  modalScrollHandler: Subscription;
  @ViewChild('assigneeSelect') assigneeSelect: AssigneeSelectComponent;
  @ViewChild(InputContactsComponent) inputContacts: InputContactsComponent;
  @ViewChild(BusinessDateTimePickerComponent) businessDateTimePicker: BusinessDateTimePickerComponent;

  constructor(
    private contactService: ContactService,
    private taskService: TaskService,
    private handlerService: HandlerService,
    public userService: UserService,
    private dealService: DealsService,
    private dialogRef: MatDialogRef<TaskCreateComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private data: any,
    @Inject(DOCUMENT) private document: Document,
    private el: ElementRef
  ) {
    if (this.data && this.data.deal) {
      this.type = 'deal';
      this.dealId = this.data.deal;
    }
    if (this.data && this.data.contacts) {
      this.isSelected = true;
      this.contacts = [...this.data.contacts];
    }

    const user = this.userService.profile.getValue();
    // for now we commented out this part of business hours. we'll check this again later
    // this.date = getNextBusinessDate(this.businessDay, this.time_zone);

    this.date = moment();
    this.assignee_enabled = user?.assignee_info?.is_enabled;
    this.assignee_editable = user?.assignee_info?.is_editable;
    if (user?.package_level === 'ELITE') {
      this.accountLoadSubscription &&
        this.accountLoadSubscription.unsubscribe();
      this.accountLoadSubscription = this.userService
        .easyLoadSubAccounts()
        .subscribe((res) => {
          if (res && res['status'] && res['data']) {
            const accounts = res['data'].map((e) =>
              new Account().deserialize(e)
            );
            const limit = (res['limit'] || 0) + 1;
            this.userService.accounts.next({ accounts, limit });
          }
        });
    }
    // for now we commented out this part of business hours. we'll check this again later
    /*
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
      this.date = getNextBusinessDate(this.businessDay, this.time_zone);
      this.time = this.startTime;
    });
    */
  }

  ngOnInit(): void {
    this.task.set_recurrence = false;
    this.task.recurrence_mode = '';

    this.modalScrollHandler = fromEvent(
      this.el.nativeElement.querySelector('.mat-dialog-content'),
      'scroll'
    ).subscribe((e: any) => {
      this.closePopups();
    });
  }

  closePopups(): void {
    // Contact
    if (this.inputContacts) {
      this.inputContacts.closePopups();
    }

    // Assignee
    if (this.assigneeSelect) {
      this.assigneeSelect.closePopups();
    }

    // Calendar, Time, Timezone
    if (this.businessDateTimePicker) {
      this.businessDateTimePicker.closePopups();
    }
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.modalScrollHandler && this.modalScrollHandler.unsubscribe();
  }

  toggleRepeatSetting(): void {
    this.task.recurrence_mode = this.task.recurrence_mode || 'DAILY';
    this.task.set_recurrence = !this.task.set_recurrence;
  }

  toggleAutoComplete(): void {
    this.task.set_auto_complete = !this.task.set_auto_complete;
  }

  selectContact(event: Contact): void {
    if (event) {
      this.contacts = [event];
    }
  }
  removeContact(contact: Contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
    }
  }
  submit(): void {
    if (this.saving) {
      return;
    }

    if (!this.date || !this.time_zone) {
      return;
    }

    const due_date = moment
      .tz(this.getSelectedDateTime(), this.time_zone)
      .format();

    const ids = [];
    const newContacts = [];
    this.contacts.forEach((e) => {
      if (!e._id) {
        newContacts.push(e);
      } else {
        ids.push(e._id);
      }
    });
    if (newContacts.length) {
      this.contactService.bulkCreate(newContacts).subscribe((res) => {
        if (res) {
          res['succeed'].forEach((e) => ids.push(e._id));
          this.saveTask(ids, due_date);
        }
      });
      return;
    }
    this.saveTask(ids, due_date);
  }

  saveTask(contactIds: string[], due_date: string): void {
    this.createTask(contactIds, due_date);
  }

  createTask(contactIds: string[], due_date: string): void {
    const taskData = {
      type: this.task.type,
      contacts: contactIds,
      content: this.task.content,
      description: this.task.description,
      due_date: due_date,
      set_recurrence: this.task.set_recurrence,
      recurrence_mode: this.task.recurrence_mode,
      timezone: this.time_zone,
      is_full: this.task.is_full,
      assignee: this.selectedAssignee
    };
    if (this.type === 'deal') {
      taskData['deal'] = this.dealId;
    }
    this.saving = true;
    this.saveSubscription = this.createTaskSubscription(taskData).subscribe(
      (res) => {
        if (!res || !res.data) {
        }
        const detailActionData = {
          //contacts: contactIds,
          contacts: this.contacts,
          subject: this.task.content,
          description: this.task.description,
          task_date: due_date,
          due_date: due_date,
          set_recurrence: this.task.set_recurrence,
          recurrence_mode: this.task.recurrence_mode,
          timezone: this.time_zone,
          type: this.task.type,
          task: true
        };
        if (this.type === 'deal') {
          detailActionData['deal'] = this.dealId;
        }
        this.handlerService.activityAdd$(contactIds, 'task');
        this.handlerService.reload$('tasks');
        this.taskService.onCreate();
        this.dialogRef.close(res);
      }
    );
  }

  createTaskSubscription(_data): Observable<any> {
    if (this.type === 'deal') {
      return this.dealService.addFollowUp(_data);
    }
    return this.taskService.bulkCreate(_data);
  }

  /*************************************
   * Contacts Input Management
   *************************************/
  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  blueAll(): void {
    this.toFocus = false;
  }

  toggleTimeSelector(event): void {
    this.task.is_full = event.target.checked;
    if (this.task.is_full) {
      this.time = '00:00:00.000';
    } else {
      this.time = this.startTime;
    }
  }

  selectDateTime($event): void {
    this.time_zone = $event.timezone;
  }

  getSelectedDateTime(): string {
    return `${this.date.format('YYYY-MM-DD')} ${this.time}`;
  }

  getSelectedDate(): string {
    return this.date.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.date = dateTime.date;
    this.time = dateTime.time;
    this.time_zone = dateTime.timezone;
  }

  changeAssignee(event: string): void {
    this.selectedAssignee = event ? event : null;
    this.cdr.detectChanges();
  }
}
