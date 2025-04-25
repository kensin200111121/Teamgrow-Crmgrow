import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TaskEditComponent } from '@components/task-edit/task-edit.component';
import {
  BulkActions,
  DialogSettings,
  STATUS,
  TaskStatus,
  MIN_ROW_COUNT,
  DEFAULT_TIME_ZONE
} from '@constants/variable.constants';
import { getCurrentTimezone, getUserTimezone, replaceToken } from '@app/helper';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskDetail } from '@models/task.model';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';
import { StoreService } from '@services/store.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import moment from 'moment-timezone';
import * as _ from 'lodash';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TaskDeleteComponent } from '@components/task-delete/task-delete.component';
import { TaskBulkComponent } from '@components/task-bulk/task-bulk.component';
import { ActivityService } from '@services/activity.service';
import { NotifyComponent } from '@components/notify/notify.component';
import { ToastrService } from 'ngx-toastr';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { Contact } from '@models/contact.model';
import { AppointmentService } from '@services/appointment.service';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Garbage } from '@models/garbage.model';
import { ColumnEditComponent } from '@components/column-edit/column-edit.component';
import { JSONParser } from '@utils/functions';
import { Router } from '@angular/router';
import { TaskFilterOptionComponent } from '@components/task-filter-option/task-filter-option.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { LabelService } from '@services/label.service';
import { TemplateToken } from '@utils/data.types';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { DialerService } from '@app/services/dialer.service';
import { RouterService } from '@app/services/router.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer: MatDrawer;
  private readonly columnsTarget = 'task_columns';
  readonly USER_FEATURES = USER_FEATURES;
  TASK_STATUS = TaskStatus;
  STATUS = STATUS;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  ACTIONS = BulkActions.Tasks;
  /* DISPLAY_COLUMNS = [
    'select',
    'status',
    'contact_name',
    'contact_label',
    'subject',
    'contact_phone',
    'deadline',
    'is_recurrence',
    'contact_address',
    'action'
  ]; */

  DEFAULT_ALL_COLUMNS = [
    {
      id: 'subject',
      name: 'Subject',
      selected: true,
      order: 0
    },
    {
      id: 'description',
      name: 'Description',
      selected: true,
      order: 1
    },
    {
      id: 'contact_name',
      name: 'Contact Name',
      selected: true,
      order: 2
    },
    {
      id: 'contact_phone',
      name: 'Phone Number',
      selected: true,
      order: 3
    },
    {
      id: 'is_recurrence',
      name: 'Recurring',
      selected: true,
      order: 4
    },
    {
      id: 'deadline',
      name: 'Deadline',
      selected: true,
      order: 5
    },
    {
      id: 'contact_label',
      name: 'Status',
      selected: true,
      order: 6
    },
    {
      id: 'contact_address',
      name: 'Address',
      selected: false,
      order: 7
    },
    {
      id: 'contact_tags',
      name: 'Tags',
      selected: false,
      order: 8
    },
    {
      id: 'contact_email',
      name: 'Email Address',
      selected: false,
      order: 9
    },
    {
      id: 'country',
      name: 'Country',
      selected: false,
      order: 10
    },
    {
      id: 'state',
      name: 'State',
      selected: false,
      order: 11
    },
    {
      id: 'city',
      name: 'City',
      selected: false,
      order: 12
    },
    {
      id: 'zipcode',
      name: 'Zipcode',
      selected: false,
      order: 13
    },
    {
      id: 'source',
      name: 'Source',
      selected: false,
      order: 14
    },
    {
      id: 'company',
      name: 'Company',
      selected: false,
      order: 15
    },
    {
      id: 'assignee',
      name: 'Assignee',
      selected: false,
      order: 16,
      feature: USER_FEATURES.ASSIGNEE
    }
  ];
  DISPLAY_COLUMNS = [];

  TASK_ICONS = {
    task: 'i-task',
    call: 'i-phone',
    meeting: 'i-lunch',
    email: 'i-message',
    material: 'i-video',
    text: 'i-sms-sent'
  };
  DEADLINE_TYPES = [
    { id: 'all', label: 'All tasks' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'this week', label: 'This week' },
    { id: 'next week', label: 'Next week' },
    { id: 'future', label: 'Future' },
    { id: 'custom', label: 'Custom' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2];
  // Task Filter Type
  deadline = this.DEADLINE_TYPES[0];
  isUpdating = false;
  updateSubscription: Subscription;
  isLoading = false;
  isPackageDialer = true;

  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  page = 1;
  selection = [];
  pageSelection = [];
  pageTasks = [];
  completedTasks = [];
  selectedTasks = [];
  timezone;

  profileSubscription: Subscription;
  loadSubscription: Subscription;

  focusRequired = false;
  opened = false;
  searchOption: TaskSearchOption = new TaskSearchOption();
  searchOptionChangeSubscription: Subscription;
  garbage: Garbage = new Garbage();

  garbageSubscription: Subscription;
  lead_fields: any[] = [];

  selectedFilter = {};
  FILTERS = [
    { id: 'search', label: 'Global search' },
    { id: 'types', label: 'Task type' },
    { id: 'status', label: 'Status of task' },
    { id: 'contact_status', label: 'Contact status' },
    { id: 'tag', label: 'Tags' },
    { id: 'task_description_contact', label: 'Task Description Contact' },
    { id: 'datetime', label: 'Datetime' },
    { id: 'country', label: 'Country' },
    { id: 'state', label: 'State' },
    { id: 'zipcode', label: 'Zipcode' },
    { id: 'source', label: 'Source' },
    { id: 'company', label: 'Company' },
    { id: 'assignee', label: 'Assignee', feature: USER_FEATURES.ASSIGNEE }
  ];
  assignee_editable = false;
  allLabels = null;
  labelSubscription: Subscription;
  templateTokens: TemplateToken[] = [];

  additional_fields;
  timezone_info;
  teamMemberAvatarColors = {};

  constructor(
    private handlerService: HandlerService,
    private routerService: RouterService,
    public taskService: TaskService,
    public activityService: ActivityService,
    public storeService: StoreService,
    private contactService: ContactService,
    private userService: UserService,
    private dialerService: DialerService,
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private toast: ToastrService,
    private router: Router,
    public labelService: LabelService,
    public sspaService: SspaService
  ) {
    this.appointmentService.loadCalendars(false, false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      this.isPackageDialer = user.dialer_info?.is_enabled || false;
      this.timezone = { zone: getCurrentTimezone() };
      this.timezone_info = getUserTimezone(user);

      this.assignee_editable = user?.assignee_info?.is_editable;
      if (!this.assignee_editable) {
        this.FILTERS = this.FILTERS.filter((e) => e.id !== 'assignee');
      } else {
        const index = _.findIndex(this.FILTERS, {
          id: 'assignee'
        });
        if (index === -1) {
          this.FILTERS.push({
            id: 'assignee',
            label: 'Assignee',
            feature: USER_FEATURES.ASSIGNEE
          });
        }
      }
    });

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.tasks$.subscribe((tasks) => {
      if (tasks) {
        this.pageTasks = tasks;
        // update current selected pages with updated value
        const updatedSelectedTasks = this.selectedTasks.map((item) => {
          const existItem = tasks.find((newTask) => newTask._id === item._id);
          return existItem ? existItem : item;
        });
        this.selectedTasks = updatedSelectedTasks;
        const ids = tasks.map((e) => e._id);
        this.pageSelection = _.intersection(this.selection, ids);
      }
    });

    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });

    const garbage = this.userService.garbage.getValue();
    if (garbage.template_tokens && garbage.template_tokens.length) {
      this.templateTokens = [...garbage.template_tokens];
    }

    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.labelSubscription = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });

    this.additional_fields = garbage.additional_fields || [];
  }

  ngOnInit(): void {
    //Read localstorage for columns
    const columns = localStorage.getCrmItem(this.columnsTarget);
    let displayColumns;
    if (columns) {
      const storedColumns = JSONParser(columns);
      const allColumnIds = this.DEFAULT_ALL_COLUMNS.map((e) => e.id);
      displayColumns = _.intersection(storedColumns, allColumnIds);
    }
    if (!displayColumns?.length) {
      displayColumns = this.DEFAULT_ALL_COLUMNS.filter((e) => e.selected).map(
        (e) => e.id
      );
    }
    localStorage.setCrmItem(this.columnsTarget, JSON.stringify(displayColumns));
    if (!this.storeService.taskPage.getValue()) {
      this.storeService.taskPage.next(1);
    }
    this.setDisplayColumns(displayColumns);

    this.loadTasks();

    this.searchOptionChangeSubscription =
      this.taskService.searchOption$.subscribe((option: TaskSearchOption) => {
        this.searchOption = option;
        this.pageSelection = [];
        this.selection = [];
      });

    this.userService.teamInfo$.subscribe((teamInfo) => {
      this.teamMemberAvatarColors = {};

      if (teamInfo?.data?.organization?.members) {
        this.teamMemberAvatarColors = teamInfo.data.organization.members.reduce(
          (acc, member) => {
            if (member?.user && member.avatar_color) {
              acc[member.user] = member.avatar_color;
            }
            return acc;
          },
          {}
        );
      }
    });

    this.handlerService.pageName.next('tasks');
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.searchOptionChangeSubscription &&
      this.searchOptionChangeSubscription.unsubscribe();
    this.handlerService.pageName.next('');
  }

  /**
   * Open the create task dialog
   */
  createTask(): void {
    this.dialog.open(TaskCreateComponent, DialogSettings.TASK);
  }

  loadTasks(): void {
    let page = this.taskService.pageIndex.getValue();
    if (this.routerService.previousUrl) {
      const urlArr = this.routerService.previousUrl.split('/');
      if (urlArr[1] == 'contacts') {
        page = this.storeService.taskPage.getValue();
        this.changePage(page);
      }
    }
    const pageSize = this.taskService.pageSize.getValue();
    const durationOption = this.taskService.searchOption.getValue();
    this.changePage(page || 1);
    this.PAGE_COUNTS.some((e) => {
      if (e.id === pageSize) {
        this.pageSize = e;
        return true;
      }
    });

    this.DEADLINE_TYPES.some((e) => {
      if (e.id === durationOption.name) {
        this.deadline = e;
        return true;
      }
    });

    if (!durationOption.name) {
      this.deadline = this.DEADLINE_TYPES[0];
      durationOption.deserialize(durationOption);
      this.taskService.searchOption.next(durationOption);
    }
  }

  /**
   * Change the Task Deadline
   * @param value : Deadline Type -> {label: '', id: ''}
   */
  changeDeadlineType(value: any): void {
    if (value.id == 'custom') {
      this.openDrawer(true);
      return;
    }
    this.page = 1;
    this.deadline = value;

    const searchOption = this.taskService.searchOption.getValue();
    searchOption.name = value.id;
    let today;
    let weekDay;
    if (this.timezone_info) {
      today = moment().tz(this.timezone_info).startOf('day');
      weekDay = moment().tz(this.timezone_info).startOf('week');
    } else {
      today = moment().utcOffset(this.timezone.zone).startOf('day');
      weekDay = moment().utcOffset(this.timezone.zone).startOf('week');
    }
    let start_date = '';
    let end_date = '';
    switch (value.id) {
      case 'all':
        break;
      case 'overdue':
        end_date = today.format();
        break;
      case 'today':
        start_date = today.format();
        end_date = today.add('day', 1).format();
        break;
      case 'tomorrow':
        start_date = today.clone().add('day', 1).format();
        end_date = today.clone().add('day', 2).format();
        break;
      case 'this week':
        start_date = weekDay.format();
        end_date = weekDay.add('week', 1).format();
        break;
      case 'next week':
        start_date = weekDay.clone().add('week', 1).format();
        end_date = weekDay.clone().add('week', 2).format();
        break;
      case 'future':
        start_date = weekDay.add('week', 2).format();
        break;
      default:
    }
    searchOption.date_mode = 0;
    searchOption.start_date = start_date;
    searchOption.end_date = end_date;
    searchOption.status = 0;
    this.taskService.pageIndex.next(1);
    this.taskService.changeSearchOption(searchOption);

    this.selection = [];
    this.pageSelection = [];
  }

  changePage(page: number): void {
    this.page = page;
    this.storeService.taskPage.next(page);
    this.taskService.loadPage(page);
    this.storeService.tasks$.subscribe((res) => {
      if (res) {
        this.pageTasks = res;
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageTasks,
          '_id'
        );
      }
    });
  }

  onOverPages(page: number): void {
    this.changePage(page);
  }

  changePageSize(size: any): void {
    const newPage =
      Math.floor((this.pageSize.id * (this.page - 1)) / size.id) + 1;

    this.pageSize = size;
    this.taskService.pageSize.next(size.id);
    this.changePage(newPage);
  }
  /**
   * Open Filter Panel
   */
  openFilter(): void {}

  /**
   * Do Action
   * @param action: Action Data (ActionItem | ActionSubItem)
   */
  doAction(action: any): void {
    if (action.command === 'edit') {
      this.editTasks();
    } else if (action.command === 'complete') {
      this.completeTasks();
    } else if (action.command === 'delete') {
      this.deleteTasks();
    } else if (action.command === 'select') {
      this.selectAll(true);
    } else if (action.command === 'deselect') {
      this.deselectAll();
    } else if (action.command === 'email') {
      this.openEmailDlg();
    } else if (action.command === 'call') {
      this.openCallDlg();
    } else if (action.command === 'appointment') {
      this.openAppointmentDlg();
    }
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    let ids = [];
    this.selection.forEach((e) => {
      ids.push(e.contact._id);
    });
    if (ids.indexOf(_id) === -1) {
      ids = [_id];
    }
    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  openEdit(element: TaskDetail): void {
    console.log('element', element);
    this.dialog
      .open(TaskEditComponent, {
        ...DialogSettings.TASK,
        data: {
          task: element,
          contact: element.contact?._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status && res.status == 'deleted') {
            this.selection = [];
            this.pageSelection = [];
            this.selectedTasks = [];
          }
          if (res.recurring_changed) this.deselectAll();
          const sortDir = this.taskService.sortOption.getValue();
          this.taskService.sortOption.next(sortDir);
        }
      });
  }

  toggle(task: TaskDetail): void {
    const toggledPageSelection = _.xorBy(
      this.pageSelection,
      [{ _id: task._id, status: task.status }],
      '_id'
    );
    this.pageSelection = toggledPageSelection;

    const toggledSelection = _.xorBy(
      this.selection,
      [{ _id: task._id, status: task.status }],
      '_id'
    );
    this.selection = toggledSelection;

    if (_.findIndex(this.selectedTasks, { _id: task._id }, '_id') == -1) {
      this.selectedTasks.push(task);
    } else {
      const pos = _.findIndex(this.selectedTasks, { _id: task._id }, '_id');
      this.selectedTasks.splice(pos, 1);
    }
  }

  isSelected(task_id: string): boolean {
    return _.findIndex(this.pageSelection, { _id: task_id }, '_id') !== -1;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(
        this.selection,
        this.pageSelection,
        '_id'
      );
      this.pageSelection = [];
      this.pageTasks.forEach((e) => {
        const pos = _.findIndex(this.selectedTasks, { _id: e._id }, '_id');
        this.selectedTasks.splice(pos, 1);
      });
      return;
    }
    this.pageTasks.forEach((e) => {
      if (!this.isSelected(e._id)) {
        this.pageSelection.push({ _id: e._id, status: e.status });
        this.selection.push({ _id: e._id, status: e.status });
        const pos = _.findIndex(this.selectedTasks, { _id: e._id }, '_id');
        if (pos < 0) {
          this.selectedTasks.push(e);
        }
      }
    });
  }

  isAllSelected(): boolean {
    if (this.selection.length === this.taskService.total.getValue()) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageTasks.length;
  }

  updateSelectActionStatus(status: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
  }

  /**
   * Select All Tasks
   */
  selectAll(source = false): void {
    if (source) {
      // Update the Actions Header
      for (let i = this.ACTIONS.length - 1; i >= 0; i--) {
        if (this.ACTIONS[i].command === 'select') {
          this.ACTIONS[i]['loading'] = true;
        }
      }
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }

    this.selecting = true;
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.taskService
      .selectAll()
      .subscribe((tasks) => {
        this.selecting = false;
        this.selection = tasks;
        this.selectedTasks = tasks;
        this.pageSelection = this.pageTasks.map((e) => ({
          _id: e._id,
          status: e.status
        }));
        for (let i = this.ACTIONS.length - 1; i >= 0; i--) {
          if (this.ACTIONS[i].command === 'select') {
            this.ACTIONS[i]['loading'] = false;
          }
        }
        this.updateSelectActionStatus(false);
      });
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.selectedTasks = [];
    this.updateSelectActionStatus(true);
  }

  changeSort(): void {
    this.taskService.pageIndex.next(1);
    const sortDir = this.taskService.sortOption.getValue();
    this.taskService.sortOption.next(sortDir * -1);
  }

  taskComplete(task: TaskDetail): void {
    if (task.status == 1) {
      this.dialog.open(NotifyComponent, {
        width: '98vw',
        maxWidth: '390px',
        data: {
          title: 'Complete Task',
          message: 'This task is completed already.'
        }
      });
      return;
    }
    this.taskService.complete(task._id).subscribe((res) => {
      if (res && res['status']) {
        this.handlerService.updateTasks$([task._id], {
          status: 1
        });
        this.selection = [];
        this.pageSelection = [];
        this.selectedTasks = [];
        this.handlerService.reload$('tasks');
      }
    });
  }

  deleteTasks(): void {
    const selected = this.selection.map((e) => e._id);
    let includeRecurrence = false;
    if (selected.length === 1 && this.selection[0].set_recurrence) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'recurrence_task_delete'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          includeRecurrence = res.type == 'all';

          this.taskService
            .archive(this.selection, includeRecurrence)
            .subscribe((status) => {
              if (status) {
                this.selection = [];
                this.pageSelection = [];
                this.selectedTasks = [];
                this.handlerService.reload$('tasks');
              }
            });
        });
    } else if (selected.length) {
      includeRecurrence = true;
      this.selectedTasks.forEach((task) => {
        if (!task.set_recurrence) {
          includeRecurrence = false;
          return;
        }
      });
      const dialog = this.dialog.open(TaskDeleteComponent, {
        data: {
          follow_ups: this.selection,
          includeRecurrence
        }
      });

      dialog.afterClosed().subscribe((res) => {
        if (res && res.status) {
          this.selection = [];
          this.pageSelection = [];
          this.selectedTasks = [];
          this.handlerService.reload$('tasks');
        }
      });
    }
  }

  completeTasks(): void {
    const selected = [];
    this.selection.forEach((e) => {
      if (e.status !== 1) {
        selected.push(e._id);
      }
    });
    if (selected.length) {
      const dialog = this.dialog.open(ConfirmComponent, {
        data: {
          title: 'Complete tasks',
          message: 'Are you sure to complete selected task(s)?',
          confirmLabel: 'Complete'
        }
      });
      dialog.afterClosed().subscribe((answer) => {
        if (answer) {
          this.taskService.bulkComplete(this.selectedTasks).subscribe((res) => {
            this.handlerService.updateTasks$(selected, { status: 1 });
            this.selection = [];
            this.pageSelection = [];
            this.selectedTasks = [];
            this.handlerService.reload$('tasks');
          });
        }
      });
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          message: 'Selected Tasks are completed already!',
          label: 'OK'
        }
      });
    }
  }

  editTasks(): void {
    const selected = [];
    this.selection.forEach((e) => {
      if (e.status !== 1) {
        selected.push(e._id);
      }
    });
    if (selected.length > 1) {
      this.dialog
        .open(TaskBulkComponent, {
          width: '100vw',
          maxWidth: '450px',
          data: {
            ids: selected
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const updateData = this.selectedTasks.map((e) => {
              if (res.type) {
                e.type = res.type;
              }
              if (res.content) {
                e.content = res.content;
              }
              if (res.due_date) {
                e.due_date = res.due_date;
              }
              return e;
            });

            this.taskService.bulkUpdate(updateData).subscribe((status) => {
              if (status) {
                const sortDir = this.taskService.sortOption.getValue();
                this.taskService.sortOption.next(sortDir);
                this.taskService.reload();
              }
            });
          }
        });
    } else if (selected.length == 1) {
      // TODO: load the event from id
      this.openEdit(this.selectedTasks[0]);
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          message:
            'Selected tasks could not be updated because they are completed already',
          label: 'OK'
        }
      });
    }
  }

  openEmailDlg(): void {
    const selected = [];
    this.selectedTasks.forEach((e) => {
      const index = selected.findIndex((item) => item._id === e.contact._id);
      if (index < 0) {
        selected.push(e.contact);
      }
    });
    this.updateSelectActionStatus(true);
    this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contacts: selected
      }
    });
  }

  openCallDlg(): void {
    const contacts = [];
    this.selectedTasks.forEach((e) => {
      const contactObj = new Contact().deserialize(e.contact);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      const index = contacts.findIndex(
        (item) => item.contactId === contact.contactId
      );
      if (index < 0) {
        contacts.push(contact);
      }
    });
    this.dialerService.makeCalls(contacts);
  }

  openAppointmentDlg(): void {
    const contacts = [];
    if (this.selectedTasks.length == 1) {
      const contactObj = new Contact().deserialize(
        this.selectedTasks[0].contact
      );
      const contact = {
        _id: contactObj._id,
        first_name: contactObj.first_name,
        last_name: contactObj.last_name,
        email: contactObj.email,
        fullName: contactObj.fullName,
        avatarName: contactObj.avatarName,
        cell_phone: [contactObj.cell_phone]
      };

      if (!contact.email) {
        this.toast.error(
          `This contact doesn't have a email.`,
          `Can't create the new appointment`
        );
        return;
      } else {
        this.dialog.open(CalendarEventDialogComponent, {
          width: '100vw',
          maxWidth: '600px',
          maxHeight: '700px',
          data: {
            mode: 'dialog',
            contacts: [contact]
          }
        });
      }
    } else {
      this.selectedTasks.forEach((e) => {
        const contactObj = new Contact().deserialize(e.contact);
        const index = contacts.findIndex((item) => item._id === contactObj._id);
        if (index < 0 && contactObj.email) {
          contacts.push(contactObj);
        }
      });

      this.dialog.open(CalendarEventDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        maxHeight: '700px',
        data: {
          mode: 'dialog',
          contacts: contacts
        }
      });
    }
  }

  openDrawer(focus: boolean): void {
    this.focusRequired = focus;
    this.opened = true;
  }

  closeDrawer(): void {
    this.searchOption = this.taskService.searchOption.getValue();
    if (this.searchOption.date_mode === 1) {
      this.deadline = { id: 'custom', label: 'Custom' };
    }
    this.focusRequired = false;
    this.opened = false;
  }

  customFiltered(): void {
    this.selection = [];
    this.pageSelection = [];
    this.selectedTasks = [];
  }

  openColumnEdit(): void {
    this.dialog
      .open(ColumnEditComponent, {
        position: { top: '100px' },
        width: '150vw',
        maxWidth: '1000px',
        data: {
          defaultColumns: this.DEFAULT_ALL_COLUMNS,
          customColumns: [],
          columnsTarget: this.columnsTarget
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.selectedColumns) {
          this.setDisplayColumns(res.selectedColumns);
        }
      });
  }

  setDisplayColumns(columns): void {
    this.DISPLAY_COLUMNS = ['select', 'status', ...columns];
  }

  asyncLocalStorage = {
    setItem: function (key, value) {
      return Promise.resolve().then(function () {
        localStorage.setCrmItem(key, value);
      });
    },
    getItem: function (key) {
      return Promise.resolve().then(function () {
        return localStorage.getCrmItem(key);
      });
    }
  };

  gotToContactDetail(element, i): void {
    const onSwipeRight = () =>
      this.router.navigate(['/contacts/' + element.contact._id]);
    this.asyncLocalStorage.setItem('currentTaskIndex', i).then(() => {
      onSwipeRight();
    });
  }

  changeFilter(evt): void {
    this.taskService.searchOption.next(evt);
    this.page = 1;
    this.changePage(this.page);
  }

  selectFilter(filter: any): void {
    this.selectedFilter = filter;
    this.dialog
      .open(TaskFilterOptionComponent, {
        width: 'auto',
        minWidth: '320px',
        data: {
          filter_id: filter.id,
          title: filter.label
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.searchOption = new TaskSearchOption().deserialize(
            JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
          );
          this.page = 1;
          this.changePage(this.page);
        }
      });
  }

  clearAllFilters(): void {
    this.deadline = this.DEADLINE_TYPES[0];
    this.searchOption = new TaskSearchOption();
    this.taskService.clearSearchOption();
  }

  getAssigneeAvatarColor(element: any): string {
    return this.teamMemberAvatarColors[element.owner?._id] || '';
  }

  getAssigneeAvatarName(element: any): string {
    const user_name = element.owner?.user_name || '';
    const names = user_name.trim().split(' ');

    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1 && names[0].length >= 2) {
      return names[0].substring(0, 2).toUpperCase();
    } else if (names[0].length === 1) {
      return names[0][0].toUpperCase();
    }

    return 'UN';
  }

  openContact(element: any): void {
    if (element.contact?._id) {
      this.router.navigate([`contacts/${element.contact._id}`]);
    }
  }

  getLabelName(contact: Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
  }

  replaceContent(contact: any, content: string): string {
    const user = this.userService.profile.getValue();
    let labelName = '';
    if (content.match(/{label}/gi)) {
      labelName = this.getLabelName(contact);
    }
    return replaceToken(
      user,
      contact,
      this.templateTokens,
      content,
      labelName,
      this.additional_fields,
      this.timezone_info
    );
  }
}
