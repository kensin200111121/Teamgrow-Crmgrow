import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';

@Component({
  selector: 'app-assignment-dialog',
  templateUrl: './assignment-dialog.component.html',
  styleUrls: ['./assignment-dialog.component.scss'],
})
export class AssignmentDialogComponent implements OnInit {
  selectedAssignee = '';
  isAssigning = false;
  availableTargetTypes = ['contact', 'task'];
  submitButtonLabel = '';

  constructor(
    private dialogRef: MatDialogRef<AssignmentDialogComponent>,
    private contactService: ContactService,
    private handlerService: HandlerService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    switch (this.data?.targetType) {
      case 'contact':
        this.submitButtonLabel = 'Assign Contacts';
        break;
      case 'tasks':
        this.submitButtonLabel = 'Assign Tasks';
        break;
      default:
        this.submitButtonLabel = 'Assign';
    }
  }

  ngAfterViewInit(): void {}

  changeAssignee($event): void {
    this.selectedAssignee = $event;
  }

  submit(): void {
    if (!this.selectedAssignee) {
      this.selectedAssignee = 'unassign';
    }

    if (!this.data?.targetType) {
      this.dialogRef.close({
        status: false,
        message: `Missing target type`,
      });
    } else if (!this.availableTargetTypes.includes(this.data.targetType)) {
      this.dialogRef.close({
        status: false,
        message: `Invalid target type: ${this.data.targetType}`,
      });
    } else if (!Array.isArray(this.data.targets) || this.data.targets.length == 0) {
      this.dialogRef.close({
        status: false,
        message: `Invalid targets: ${this.data.targets}`,
      });
    } else {
      this.isAssigning = true;

      switch (this.data.targetType) {
        case 'contact':
          this._assignContacts();
          break;
        case 'task':
          this._assignTasks();
          break;
        default:
          this.isAssigning = false;
          break;
      }
    }
  }

  private _assignContacts(): void {
    this.contactService
      .bulkUpdate(this.data.targets, { owner: this.selectedAssignee }, {})
      .subscribe((status) => {
        if (status) {
          this.handlerService.bulkContactUpdate$(this.data.targets, { owner: this.selectedAssignee }, {});
        }
        this.dialogRef.close({
          status,
          targets: this.data.targets,
          targetType: this.data.targetType,
          assignee: this.selectedAssignee,
        });
        this.isAssigning = false;
      });
  }

  private _assignTasks(): void {
    // TODO: implement the assigning tasks here when you need!!!
    this.isAssigning = false;
  }
}
