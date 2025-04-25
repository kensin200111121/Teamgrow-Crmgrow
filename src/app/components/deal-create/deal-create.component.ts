import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '@services/deals.service';
import { UserService } from '@services/user.service';
import { Deal } from '@app/models/deal.model';
import { ConfirmComponent } from '../confirm/confirm.component';
import { DialogSettings } from '@app/constants/variable.constants';
import { Subscription, fromEvent } from 'rxjs';
import { SelectStageComponent } from '@app/components/select-stage/select-stage.component';
import { DateInputComponent } from '@app/components/date-input/date-input.component';
import { InputContactsComponent } from '@app/components/input-contacts/input-contacts.component';
import { SelectContactListComponent } from '@app/components/select-contact-list/select-contact-list.component';
import { InputTeamMembersComponent } from '@app/components/input-team-members/input-team-members.component';

@Component({
  selector: 'app-deal-create',
  templateUrl: './deal-create.component.html',
  styleUrls: ['./deal-create.component.scss']
})
export class DealCreateComponent implements OnInit, AfterViewInit {
  saving = false;
  submitted = false;
  hasOrganization = false;
  deal = new Deal();
  selectedPipeline: string;
  isSetDefault: boolean;
  originalContacts: string[];
  modalScrollHandler: Subscription;
  @ViewChild(SelectStageComponent) selectStage: SelectStageComponent;
  @ViewChild(DateInputComponent) dateInput: DateInputComponent;
  @ViewChild(InputContactsComponent) inputContacts: InputContactsComponent;
  @ViewChild(SelectContactListComponent) selectContactList: SelectContactListComponent;
  @ViewChild(InputTeamMembersComponent) inputTeamMembers: InputTeamMembersComponent;

  get calculatedCommissionValue(): number {
    return (this.deal.commission.value * this.deal.price) / 100;
  }

  constructor(
    public dealsService: DealsService,
    private userService: UserService,
    private dialogRef: MatDialogRef<DealCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this._initData();

    this.modalScrollHandler = fromEvent(
      this.el.nativeElement.querySelector('.mat-dialog-content'),
      'scroll'
    ).subscribe((e: any) => {
      this.closePopups();
    });
  }

  closePopups(): void {
    // Pipeline, Stage
    if (this.selectStage) {
      this.selectStage.closePopups();
    }

    // Close Date
    if (this.dateInput) {
      this.dateInput.close();
    }

    // Contacts
    if (this.inputContacts) {
      this.inputContacts.closePopups();
    }

    // Primary Contact
    if (this.selectContactList) {
      this.selectContactList.closePopups();
    }

    // Assigned Team Members
    if (this.inputTeamMembers) {
      this.inputTeamMembers.closePopups();
    }
  }

  ngAfterViewInit(): void {
    this._initData();
    this.cdr.detectChanges();
  }

  private _initData(): void {
    const user = this.userService.profile.getValue();
    this.hasOrganization = this.userService.isOrganization();
    if (!this.data) {
      const selectedPipeline = this.dealsService.selectedPipeline.getValue();
      this.selectedPipeline = selectedPipeline._id;
      this.isSetDefault = true;
      return;
    }
    if (this.data?.deal?._id) {
      this.deal.deserialize(this.data.deal);
      this.originalContacts = (this.deal?.contacts || []).map(
        (contact) => contact?._id
      );
      if (this.data.stage) {
        this.deal.deal_stage = this.data.stage;
      }
      if (this.data.pipeline) {
        this.selectedPipeline = this.data.pipeline;
      }
    } else {
      this.deal.primary_contact = '';
      this.deal.team_members = [user];
      this.originalContacts = [];
      if (this.data.contacts?.length) {
        this.deal.contacts = [...this.data.contacts];
        this.deal.primary_contact = this.data.contacts[0]?._id || '';
      }
      if (this.data.deal_stage) {
        this.deal.deal_stage = this.data.deal_stage;
        this.isSetDefault = false;
      }
      if (this.data.pipeline) {
        this.selectedPipeline = this.data.pipeline;
      } else {
        const selectedPipeline = this.dealsService.selectedPipeline.getValue();
        this.selectedPipeline = selectedPipeline._id;
        this.isSetDefault = true;
      }
    }
  }

  onTeamMemberSelected(teamMembers): void {
    this.deal.team_members = teamMembers;
  }

  updateDeal(id, data, isApply = false) {
    this.dealsService
      .editDeal(id, { ...data, applyChangeToTimelines: isApply })
      .subscribe((res) => {
        if (res) {
          this.saving = false;
          const idx = this.deal.contacts.findIndex(
            (e) => e._id === this.deal.primary_contact
          );

          this.dialogRef.close({
            ...this.deal,
            primary_contact: [this.deal.contacts[idx]]
          });
          this.toastr.success('Updated deal successfully.');
        } else {
          this.toastr.error('Updated deal failed.');
        }
      });
  }

  saveDeal(): void {
    if (!this.deal.contacts?.length || !this.deal?.primary_contact) {
      return;
    }
    if (this.hasOrganization && !this.deal.team_members?.length) {
      return;
    }
    const contactIds = [];
    let removeContactIds = this.originalContacts;
    const addContactIds = [];
    this.deal.contacts.forEach((contact) => {
      contactIds.push(contact._id);
      if (!this.originalContacts.includes(contact._id)) {
        addContactIds.push(contact._id);
      } else {
        removeContactIds = removeContactIds.filter((id) => id !== contact._id);
      }
    });
    if (!contactIds.includes(this.deal?.primary_contact)) {
      this.toastr.error(
        'This primary contact is not included in contacts. Please select primary contact again.'
      );
      return;
    }
    this.saving = true;
    const memberIds = [];
    this.deal.team_members.forEach((member) => {
      memberIds.push(member._id);
    });
    const data = {
      ...this.deal,
      contacts: contactIds,
      team_members: memberIds,
      _id: undefined
    };
    if (!this.deal?._id) {
      this.dealsService.createDeal(data).subscribe(
        (res) => {
          this.saving = false;
          if (res) {
            this.dealsService.onCreate();
            const data = res['data'];
            this.dialogRef.close(data);
            this.toastr.success('Created deal successfully.');
          } else {
            this.toastr.error('Created deal failed.');
          }
        },
        (err) => {
          this.saving = false;
        }
      );
    } else {
      if (addContactIds.length > 0 && removeContactIds.length > 0) {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Allow assigning timelines',
              message:
                'You removed some contacts from this deal. These removed contacts would be removed the running automations automatically. And then you added new contacts to this deal. Are you going to apply these contacts to the running automations on this deal?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Confirm'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            this.updateDeal(this.deal._id, data, res ? true : false);
          });
      } else if (addContactIds.length > 0) {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Allow assigning timelines',
              message:
                'Are you going to execute the current assigned deal automation with these new contacts?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Confirm'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            this.updateDeal(this.deal._id, data, res ? true : false);
          });
      } else if (removeContactIds.length > 0) {
        this.toastr.warning(
          'When you remove this contact, the current assigned automations would not executed on this contact anymore.'
        );
        this.updateDeal(this.deal._id, data);
      } else {
        this.updateDeal(this.deal._id, data);
      }
    }
  }

  removeContacts(contact) {
    this.deal.contacts = [...this.deal.contacts];
  }

  selectContacts(contacts) {
    this.deal.contacts = [...this.deal.contacts];
  }

  selectPrimary(contact): void {
    this.deal.primary_contact = contact?._id || '';
  }

  onSelectionCommisionChange(event: any) {
    this.deal.commission.value = 0;
  }

  onAgentPriceChange(event: any) {
    const val = Number(event.target.value);
    this.deal.agent_price = val;

    // I'll decide later whether to add this feature
    // this.deal.agent_price = val < this.deal.price ? val : this.deal.price;
    // if (this.deal.price) {
    //   this.deal.team_price = this.deal.price - this.deal.agent_price;
    // }
  }

  onTeamPriceChange(event: any) {
    const val = Number(event.target.value);
    this.deal.team_price = val;

    // I'll decide later whether to add this feature
    // this.deal.team_price = val < this.deal.price ? val : this.deal.price;
    // if (this.deal.price) {
    //   this.deal.agent_price = this.deal.price - this.deal.team_price;
    // }
  }

  onChangeStage(event: any) {
    this.deal.deal_stage = event;
  }
}
