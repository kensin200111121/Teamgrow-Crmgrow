import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { DATE_FORMATS, FIELD_TYPES } from '@utils/data';
import { DateFormatEnum, FieldTargetEnum, FieldTypeEnum } from '@utils/enum';
import { NOT_ALLOW_CUSTOM_FIELDS } from '@app/constants/variable.constants';
import { v4 as uuidv4 } from 'uuid';
import { LeadFormService } from '@app/services/lead-form.service';
import { LeadForm } from '@app/models/lead-form.model';
import { Subscription } from 'rxjs';
import { MaterialItem } from '@app/core/interfaces/resources.interface';

@Component({
  selector: 'app-select-lead-form',
  templateUrl: './select-lead-form.component.html',
  styleUrls: ['./select-lead-form.component.scss']
})
export class SelectLeadFormComponent implements OnInit {
  selectedForms = [];
  leadForms: LeadForm[];
  leadForm: LeadForm;
  leadFormsSubscription: Subscription;
  formType = 1;
  isImmediatly = true;
  minute = null;
  second = null;
  material: MaterialItem;
  formId = '';

  constructor(
    private dialogRef: MatDialogRef<SelectLeadFormComponent>,
    private userService: UserService,
    public leadFormService: LeadFormService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.leadFormService.load();
    if (this.data) {
      if (this.data.selectedForms) {
        this.selectedForms = this.data.selectedForms;
      }
      if (this.data.formType) {
        this.formType = this.data.formType;
      }
      if (this.data.material) {
        this.material = this.data.material;
      }
      if (this.data.formId) {
        this.formId = this.data.formId;
      }
      const seconds = this.data.seconds;
      if (!seconds) {
        this.isImmediatly = true;
      } else {
        this.isImmediatly = false;
        this.minute = Math.floor(seconds / 60);
        this.second = seconds % 60;
      }
    }
  }

  ngOnInit(): void {
    this.leadFormsSubscription && this.leadFormsSubscription.unsubscribe();
    this.leadFormsSubscription = this.leadFormService.forms$.subscribe(
      (res) => {
        if (this.selectedForms.length) {
          this.leadForms = res.filter(
            (e) => !this.selectedForms.includes(e._id)
          );
        } else {
          this.leadForms = res;
        }
        if (this.formId) {
          this.onSelectForm(this.formId);
        }
      }
    );
  }

  onSelectForm(formId: string): void {
    const index = this.leadForms.findIndex((e) => e._id === formId);
    if (index !== -1) {
      this.leadForm = this.leadForms[index];
    } else {
      this.leadForm = null;
      this.minute = null;
      this.second = null;
      this.isImmediatly = true;
    }
  }

  addForm(): void {
    if (this.leadForm) {
      let second = 0;
      if (!this.isImmediatly) {
        if (this.minute) {
          second = this.minute * 60;
        }
        if (this.second) {
          second = second + this.second;
        }
      }
      this.dialogRef.close({
        leadForm: this.leadForm,
        second
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
