import { Component, Inject, OnInit } from '@angular/core';
import { Contact } from '@models/contact.model';
import { DealsService } from '@services/deals.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '@services/user.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';

@Component({
  selector: 'app-save-template',
  templateUrl: './save-template.component.html',
  styleUrls: ['./save-template.component.scss']
})
export class SaveTemplateComponent implements OnInit {
  name: '';
  template;
  csv_templates = [];
  submitted = false;
  saving = false;
  errorMessage = '';
  garbageSubscription: Subscription;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<SaveTemplateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService
  ) {
    if (this.data && this.data.name) {
      this.name = this.data.name;
    }
    if (this.data && this.data.template) {
      this.template = this.data.template;
    }
    if (this.data && this.data.csv_templates) {
      this.csv_templates = this.data.csv_templates;
    }
  }

  ngOnInit(): void {}

  saveTemplate(): void {
    this.submitted = true;
    if (this.name) {
      const templateNames = this.csv_templates.map((item) => item.name);
      const index = templateNames.indexOf(this.name);
      if (index >= 0) {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Overwrite Template',
              message: 'Are you sure to overwrite this template?',
              label: 'Overwrite'
            }
          })
          .afterClosed()
          .subscribe((answer) => {
            if (answer) {
              this.saving = true;
              const template = {
                name: this.name,
                template: this.template
              };
              const templateIndex = this.csv_templates.findIndex(
                (item) => item.name == this.name
              );
              if (templateIndex >= 0) {
                this.csv_templates.splice(templateIndex, 1, template);
              }
              const updateData = {
                csv_templates: this.csv_templates
              };
              this.userService.updateGarbage(updateData).subscribe(() => {
                this.saving = false;
                this.dialogRef.close(template);
              });
            }
          });
      } else {
        this.saving = true;
        const template = {
          name: this.name,
          template: this.template
        };
        this.csv_templates.push(template);
        const updateData = {
          csv_templates: this.csv_templates
        };
        this.userService.updateGarbage(updateData).subscribe(() => {
          this.saving = false;
          this.userService.updateGarbageImpl(updateData);
          this.dialogRef.close(template);
        });
      }
    }
  }
}
