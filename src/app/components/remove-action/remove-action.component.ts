import {
  Component,
  OnInit,
  AfterContentChecked,
  ViewContainerRef,
  ChangeDetectorRef,
  ApplicationRef,
  Output,
  EventEmitter
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '@services/store.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ConnectService } from '@services/connect.service';
import { ToastrService } from 'ngx-toastr';
import { AutomationService } from '@services/automation.service';
import { Contact } from '@models/contact.model';
import { Deal } from '@models/deal.model';
@Component({
  selector: 'app-remove-action',
  templateUrl: './remove-action.component.html',
  styleUrls: ['./remove-action.component.scss']
})
export class RemoveActionComponent implements OnInit, AfterContentChecked {
  submitted = false;

  @Output() onClose = new EventEmitter();
  data;

  automation_type = 'contact';
  assignedList = [];
  timelines = [];
  filteredAssignedList = [];
  searchAssignedListStr = '';
  updateTimeline = 'update';

  constructor(
    private dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef,
    public connectService: ConnectService,
    private toastr: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private automationService: AutomationService,
    public storeService: StoreService
  ) {
    this.initVariables();
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.initDialog();
      }
    });
  }

  ngOnInit(): void {
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.initDialog();
      }
    });
  }

  ngOnDestroy(): void {}

  ngAfterContentChecked(): void {}

  confirmAction(): void {
    const data = {
      updateTimeline: this.updateTimeline
    };
    this.storeService.actionOutputData.next(data);
    this.closeDrawer();
    return;
  }

  closeDrawer(): void {
    this.onClose.emit();
  }

  changeAssignedListSearchStr(): void {
    this.filteredAssignedList = [];
    if (this.searchAssignedListStr) {
      if (this.automation_type === 'contact') {
        for (const contact of this.assignedList) {
          if (
            contact.fullName &&
            contact.fullName
              .toLowerCase()
              .indexOf(this.searchAssignedListStr.toLowerCase()) >= 0
          ) {
            this.filteredAssignedList.push(contact);
          }
        }
      } else if (this.automation_type === 'deals') {
        for (const deal of this.assignedList) {
          if (
            deal.title &&
            deal.title
              .toLowerCase()
              .indexOf(this.searchAssignedListStr.toLowerCase()) >= 0
          ) {
            this.filteredAssignedList.push(deal);
          }
        }
      }
    } else {
      this.filteredAssignedList = [...this.assignedList];
    }
  }

  clearAssignedListSearchStr(): void {
    this.searchAssignedListStr = '';
    this.filteredAssignedList = [...this.assignedList];
  }

  initVariables(): void {
    this.submitted = false;
    this.automation_type = 'contact';

    this.assignedList = [];
    this.filteredAssignedList = [];
    this.searchAssignedListStr = '';
    this.updateTimeline = 'update';
  }

  initDialog(): void {
    if (this.data) {
      if (this.data.automation_type) {
        if (this.data.hasNewDeal) {
          this.automation_type = 'deal';
        } else {
          this.automation_type = this.data.automation_type;
        }
      }

      if (this.data.timelines) {
        this.timelines = this.data.timelines;
        if (this.automation_type === 'contact') {
          this.assignedList = this.timelines.map((item) =>
            new Contact().deserialize(item.contact)
          );
        } else {
          this.assignedList = this.timelines.map((item) =>
            new Deal().deserialize(item.deal)
          );
        }
        this.filteredAssignedList = [...this.assignedList];
      }
    }
  }

  setUpdateTimeline(option): void {
    this.updateTimeline = option;
  }
}
