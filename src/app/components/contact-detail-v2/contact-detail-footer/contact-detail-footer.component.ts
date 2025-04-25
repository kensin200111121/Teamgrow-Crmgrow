import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { DialogSettings } from '@app/constants/variable.constants';
import {
  ContactActivity,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { ContactService } from '@app/services/contact.service';
import { MovePendingContactsService } from '@app/services/contacts/move-pending-contact.service';
import { SharePendingContactsService } from '@app/services/contacts/share-pending-contacts.service';
import { SharedContactsService } from '@app/services/contacts/shared-contacts.service';
import { HandlerService } from '@app/services/handler.service';
import { HelperService } from '@app/services/helper.service';
import { MaterialService } from '@app/services/material.service';
import { RouterService } from '@app/services/router.service';
import { StoreService } from '@app/services/store.service';
import { TaskService } from '@app/services/task.service';
import { TeamService } from '@app/services/team.service';
import { UserService } from '@app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

const VIEW_MODE = {
  SINGLE: 0,
  TASKS: 1,
  CONTACTS: 2
};
@Component({
  selector: 'app-contact-detail-footer',
  templateUrl: './contact-detail-footer.component.html',
  styleUrls: ['./contact-detail-footer.component.scss']
})
export class ContactDetailFooterComponent implements OnInit {
  contactId = '';
  refreshing = false;
  focusActivityTab: ContactDetailActionType = 'activity';
  loadingLeftPanel = false;
  loadingCenterPanel = false;
  loadingRightPanel = false;

  centerPanelLoadSubscription: Subscription;
  leftPanelLoadSubscription: Subscription;

  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
      this.setActiveIndex();
    }
  }

  @Input()
  public set setActivityTab(val: ContactDetailActionType) {
    this.focusActivityTab = val;
    this.resetCenterPanelDataObserve();
  }

  @Output() changeContact = new EventEmitter<string>();
  @Output() refreshContact = new EventEmitter<string>();

  // Variables for Prev and Next contact
  viewMode = VIEW_MODE.SINGLE;
  totalContactCount = 0;
  pageCount = 0;
  currentPage = 0;
  pageSize = 0;
  pageContacts: ContactActivity[] = [];
  isFirst = false;
  isLast = false;
  isEnable = false;
  _id = null;
  taskId = '';
  initTaskIndex = -1;
  activeIndex = 0; // current index on current page

  contactListService:
    | MovePendingContactsService
    | SharedContactsService
    | SharePendingContactsService;

  constructor(
    private contactDetailInfoService: ContactDetailInfoService,
    private dialog: MatDialog,

    public contactService: ContactService,
    public userService: UserService,
    public materialService: MaterialService,
    private storeService: StoreService,
    private handlerService: HandlerService,
    private taskService: TaskService,
    private routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.resetLeftPanelDataObserve();
    this._initPrevNextContact();
  }

  _initPrevNextContact(): void {
    if (this.routerService.previousUrl || this.routerService.currentUrl) {
      if (this.routerService.previousUrl.includes('home')) {
        const homeTab = localStorage.getItem('homeTab');
        if (homeTab === 'activities') {
          this.viewMode = VIEW_MODE.SINGLE;
        } else if (homeTab === 'tasks') {
          this.viewMode = VIEW_MODE.TASKS;
        }
      } else if (this.routerService.previousUrl.includes('activities')) {
        this.viewMode = VIEW_MODE.SINGLE;
      } else if (this.routerService.previousUrl.includes('tasks')) {
        this.viewMode = VIEW_MODE.TASKS;
      } else if (this.routerService.previousUrl.includes('community')) {
        this.viewMode = VIEW_MODE.SINGLE;
      } else if (this.routerService.previousUrl.includes('contacts')) {
        this.viewMode = VIEW_MODE.CONTACTS;
      }
      switch (this.viewMode) {
        case VIEW_MODE.SINGLE:
          this.pageContacts = [];
          break;
        case VIEW_MODE.TASKS:
          this.pageContacts = this.storeService.taskPageContacts.getValue();
          break;
        case VIEW_MODE.CONTACTS:
          if (this.handlerService.selectedContactListType) {
            this.pageContacts = this.contactListService.contacts?.getValue();
          } else {
            this.pageContacts = this.storeService.pageContacts.getValue();
          }
          break;
        default:
          this.pageContacts = [];
      }
      if (this.pageContacts.length && this.viewMode !== VIEW_MODE.SINGLE) {
        this.isEnable = true;
      }

      if (this.isEnable) {
        if (this.viewMode === VIEW_MODE.CONTACTS) {
          if (this.handlerService.selectedContactListType) {
            this.currentPage = this.contactListService.pageIndex.getValue();

            this.pageSize = this.contactListService.pageSize.getValue();
            this.pageCount = Math.ceil(
              this.contactListService.total.getValue() / this.pageSize
            );
            this.totalContactCount = this.contactListService.total.getValue();
          } else {
            this.currentPage = this.storeService.contactPage.getValue();
            this.pageSize = this.contactService.pageSize.getValue();
            this.pageCount = Math.ceil(
              this.contactService.total.getValue() / this.pageSize
            );
            this.totalContactCount = this.contactService.total.getValue();
          }
        } else {
          this.currentPage = this.storeService.taskPage.getValue();
          this.pageSize = this.taskService.pageSize.getValue();
          this.pageCount = Math.ceil(
            this.taskService.total.getValue() / this.pageSize
          );
          this.totalContactCount = this.taskService.total.getValue();
        }

        const index = this.pageContacts.findIndex(
          (contact) => contact._id === (this._id ?? this.contactId)
        );

        if (this.viewMode === VIEW_MODE.TASKS) {
          this.taskId = this.pageContacts[index]?.['taskId'];
        }

        if (
          index == this.pageContacts.length - 1 &&
          this.currentPage == this.pageCount
        ) {
          this.isLast = true;
        }
        if (index == 0 && this.currentPage == 1) {
          this.isFirst = true;
        }
        this.activeIndex = index + 1;
      }
    }
  }

  setActiveIndex() {
    /* if (this.isEnable) {
      const index = this.pageContacts.findIndex(
        (contact) => contact._id === (this._id ?? this.contactId)
      );

      if (this.viewMode === VIEW_MODE.TASKS) {
        this.taskId = this.pageContacts[index]?.['taskId'];
      }

      if (
        index == this.pageContacts.length - 1 &&
        this.currentPage == this.pageCount
      ) {
        this.isLast = true;
      }
      if (index == 0 && this.currentPage == 1) {
        this.isFirst = true;
      }
      this.activeIndex = index + 1;
    } */
  }

  /**
   * Load Previous Contact Detail Information
   */
  prevContact(): void {
    if (this.isFirst) {
      return;
    }
    if (this.isLast) {
      this.isLast = !this.isLast;
    }

    let index = 0;
    if (this.viewMode === VIEW_MODE.CONTACTS) {
      index = this.pageContacts.findIndex(
        (contact) => contact._id === (this._id ?? this.contactId)
      );
    } else {
      if (this.initTaskIndex >= 0) {
        index = this.initTaskIndex;
        this.initTaskIndex = -1;
      } else {
        index = this.pageContacts.findIndex(
          (contact) => contact['taskId'] === this.taskId
        );
      }
    }
    index -= 1;
    if (index > 0) {
      this.nextContactImple(index);
    } else if (index == 0) {
      if (this.currentPage == 1) {
        this.isFirst = true;
      }
      this.nextContactImple(index);
    } else {
      if (this.viewMode === VIEW_MODE.CONTACTS) {
        let skip = (this.currentPage - 2) * this.pageSize;
        skip = skip < 0 ? 0 : skip;
        if (this.handlerService.selectedContactListType) {
          this.contactListService.loadImpl(skip).subscribe((res) => {
            if (res) {
              this.pageContacts = res.contacts;
              index = this.pageContacts.length - 1;
              this.currentPage -= 1;
              this.contactListService.pageIndex.next(this.currentPage);
              this.nextContactImple(index);
            }
          });
        } else {
          this.contactService.loadImpl(skip).subscribe((res) => {
            if (res) {
              this.pageContacts = res.contacts;
              index = this.pageContacts.length - 1;
              this.currentPage -= 1;
              this.storeService.contactPage.next(this.currentPage); // check xueying
              this.nextContactImple(index);
            }
          });
        }
      } else {
        //VIEWMODE.TASKS
        this.currentPage -= 1;
        this.taskService.loadImpl(this.currentPage).subscribe((res) => {
          if (res) {
            if (res && res['tasks']) {
              const tasks_list = res['tasks'];
              const contact_list = [];
              tasks_list.forEach((task: any) => {
                const contact = task?.contact;
                if (contact) {
                  contact['taskId'] = task?._id;
                  contact_list.push(contact);
                }
              });
              this.pageContacts = contact_list;
              index = this.pageContacts.length - 1;
              this.storeService.taskPage.next(this.currentPage);
              this.nextContactImple(index);
            }
          }
        });
      }
    }
  }

  /**
   * Load Next Contact Detail Information
   */
  nextContact(): void {
    if (this.isLast) {
      return;
    }

    if (this.isFirst) {
      this.isFirst = !this.isFirst;
    }
    let index = 0;
    if (this.viewMode === VIEW_MODE.CONTACTS) {
      index = this.pageContacts.findIndex(
        (contact) => contact._id === (this._id ?? this.contactId)
      );
    } else {
      if (this.initTaskIndex >= 0) {
        index = this.initTaskIndex;
        this.initTaskIndex = -1;
      } else {
        index = this.pageContacts.findIndex(
          (contact) => contact['taskId'] === this.taskId
        );
      }
    }
    index += 1;
    if (index > this.pageContacts.length - 1) {
      // if next contact i exist in next page (current contact is last item on current page)
      index = 0;

      if (this.viewMode === VIEW_MODE.CONTACTS) {
        let skip = this.currentPage * this.pageSize;
        skip = skip < 0 ? 0 : skip;
        if (this.handlerService.selectedContactListType) {
          this.contactListService.loadImpl(skip).subscribe((res) => {
            if (res) {
              this.pageContacts = res.contacts;
              this.currentPage += 1;
              this.contactListService.pageIndex.next(this.currentPage);
              this.nextContactImple(index);
            }
          });
        } else {
          this.contactService.loadImpl(skip).subscribe((res) => {
            if (res) {
              this.pageContacts = res.contacts;
              this.currentPage += 1;
              this.storeService.contactPage.next(this.currentPage);
              this.nextContactImple(index);
            }
          });
        }
      } else {
        //VIEW_MODE.TASKS
        this.currentPage += 1;
        this.taskService.loadImpl(this.currentPage).subscribe((res) => {
          if (res) {
            if (res && res['tasks']) {
              const tasks_list = res['tasks'];
              const contact_list = [];
              tasks_list.forEach((task: any) => {
                const contact = task?.contact;
                if (contact) {
                  contact['taskId'] = task?._id;
                  contact_list.push(contact);
                }
              });
              this.pageContacts = contact_list;
              this.storeService.taskPage.next(this.currentPage);
              this.nextContactImple(index);
            }
          }
        });
      }
    } else if (index == this.pageContacts.length - 1) {
      if (this.currentPage == this.pageCount) {
        this.isLast = true;
      }
      this.nextContactImple(index);
    } else {
      this.nextContactImple(index);
    }
  }

  nextContactImple(index: number): void {
    this._id = this.pageContacts[index]._id;
    this.activeIndex = index + 1;
    if (this.viewMode === VIEW_MODE.TASKS) {
      this.taskId = this.pageContacts[index]['taskId'];
    }
    this.contactId = this._id;

    this.changeContact.emit(this._id);
  }

  private callbackLoadPanelData() {
    if (
      this.refreshing &&
      !this.loadingCenterPanel &&
      !this.loadingLeftPanel &&
      !this.loadingRightPanel
    ) {
      this.refreshing = false;
    }
  }

  private resetCenterPanelDataObserve() {
    this.centerPanelLoadSubscription?.unsubscribe();
    if (this.focusActivityTab === 'activity') {
      this.centerPanelLoadSubscription =
        this.contactDetailInfoService.activities$.subscribe((data) => {
          if (this.loadingCenterPanel && this.refreshing) {
            this.loadingCenterPanel = false;
            this.callbackLoadPanelData();
          }
        });
    } else {
      this.centerPanelLoadSubscription = this.contactDetailInfoService.actions$[
        this.focusActivityTab
      ].subscribe((data) => {
        if (this.loadingCenterPanel && this.refreshing) {
          this.loadingCenterPanel = false;
          this.callbackLoadPanelData();
        }
      });
    }
  }

  private resetLeftPanelDataObserve() {
    this.leftPanelLoadSubscription?.unsubscribe();

    this.leftPanelLoadSubscription =
      this.storeService.selectedContactMainInfo$.subscribe((contact) => {
        if (this.loadingLeftPanel && this.refreshing) {
          this.loadingLeftPanel = false;
          this.callbackLoadPanelData();
        }
      });
  }

  //TO-DO implement this function for right panel
  private initRightPanelDataObserve() {}

  refresh() {
    this.refreshing = true;
    this.loadingLeftPanel = true;
    this.loadingCenterPanel = true;

    //TODO uncomment this line when right panel is completed
    //this.loadingRightPanel = true

    this.refreshContact.emit();
  }

  deleteContact(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete contact',
          message: 'Are you sure to delete this contact?',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactService
            .bulkDelete([this.contactId])
            .subscribe((status) => {
              if (!status) {
                return;
              }
              this.handlerService.readMessageContact.next([this.contactId]);
              this.routerService.goBack();
            });
        }
      });
  }
}
