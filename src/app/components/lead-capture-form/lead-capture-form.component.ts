import { T } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DELAY, DialogSettings } from '@constants/variable.constants';
import { Garbage } from '@models/garbage.model';
import { Material } from '@models/material.model';
import { MaterialService } from '@services/material.service';
import { UserService } from '@services/user.service';
import { LeadCaptureFormDelayComponent } from '@components/lead-capture-form-delay/lead-capture-form-delay.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { LeadFormService } from '@app/services/lead-form.service';
import { LeadForm } from '@app/models/lead-form.model';

export interface RowElement {
  key: string;
  value: string;
}

@Component({
  selector: 'app-lead-capture-form',
  templateUrl: './lead-capture-form.component.html',
  styleUrls: ['./lead-capture-form.component.scss']
})
export class LeadCaptureFormComponent implements OnInit {
  DELAY = DELAY;
  garbage: Garbage = new Garbage();
  submitted = false;
  saving = false;
  material = new Material();
  materials = [];
  allMaterials = [];
  selected_forms: any = {};
  type = '';
  isCapture = false;
  isCollapse = false;
  dataSource: RowElement[];
  enable_forms_data: RowElement[];
  displayedColumns: string[] = ['key', 'value', 'action'];
  forms: LeadForm[] = [];

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<LeadCaptureFormComponent>,
    public userService: UserService,
    private toast: ToastrService,
    private materialService: MaterialService,
    private leadFormService: LeadFormService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
      if (this.type == 'single') {
        this.material = this.data.material;
        this.isCapture = this.material.enabled_capture;
      } else {
        if (this.data.materials.length === 1) {
          this.material = this.data.materials[0];
        } else {
          this.materials = this.data.materials;
        }
        this.materials.forEach((e) => {
          this.allMaterials.push(e._id);
        });
        this.isCapture = this.materials.every((e) => e.enabled_capture);
      }
    }
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
        if (this.type == 'all') {
          this.selected_forms[this.garbage.capture_form] = 0;
        } else {
          if (this.material.capture_form) {
            this.selected_forms = this.material.capture_form;
          } else {
            //this.selected_forms[this.garbage.capture_form] = 0;
          }
        }
      }
    });
    this.leadFormService.load();
  }

  getDataSource() {
    if (this.selected_forms && Object.keys(this.selected_forms).length > 0) {
      const keysSorted = Object.keys(this.selected_forms)
        .sort((a, b) => {
          return this.selected_forms[a] - this.selected_forms[b];
        })
        .reduce((accumulator, key) => {
          accumulator[key] = this.selected_forms[key];

          return accumulator;
        }, {});
      this.dataSource = Object.keys(keysSorted).map((key) => ({
        key: key,
        value: keysSorted[key]
      }));
      this.enable_forms_data = [];
      this.forms.forEach((form) => {
        let duplicated = false;
        Object.keys(this.selected_forms).forEach((f_key) => {
          if (form._id === f_key) duplicated = true;
        });
        if (!duplicated) {
          this.enable_forms_data.push({
            key: form._id,
            value: form.name
          });
        }
      });
    } else {
      this.dataSource = [];
      this.enable_forms_data = [];
      this.forms.forEach((form) => {
        this.enable_forms_data.push({
          key: form._id,
          value: form.name
        });
      });
    }
  }

  ngOnInit(): void {
    this.leadFormService.forms$.subscribe((res) => {
      this.forms = res;
      this.getDataSource();
    });
  }

  setForm(id: string, newCreate: boolean): void {
    const type = newCreate ? 'create' : 'edit';
    this.dialog
      .open(LeadCaptureFormDelayComponent, {
        ...DialogSettings.CONFIRM,
        maxWidth: '500px',
        data: {
          material: this.material,
          materials: this.materials,
          enable_forms_data: this.enable_forms_data,
          capture_delay: this.selected_forms[id] || 0,
          type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (newCreate) {
            this.selected_forms[res.form_id] = res.delay;
          } else {
            this.selected_forms[id] = res.delay;
          }
          this.getDataSource();
        }
      });
  }

  isSelected(id: string): boolean {
    return Object.keys(this.selected_forms).indexOf(id) > -1;
  }

  deleteForm(id: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        maxWidth: '500px',
        data: {
          title: 'Delete Lead Form',
          message: 'Do you really want delete current form?',
          confirmLabel: 'Yes',
          cancelLabel: 'Cancel'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          delete this.selected_forms[id];
          this.getDataSource();
        }
      });
  }

  saveForm(): void {
    if (this.isCapture && !Object.keys(this.selected_forms).length) {
      return;
    }
    const forms = {
      firstForm: this.getName(Object.keys(this.selected_forms)[0]),
      secondForm:
        Object.keys(this.selected_forms).length > 1
          ? this.getName(Object.keys(this.selected_forms)[1])
          : '',
      rest:
        Object.keys(this.selected_forms).length > 2
          ? Object.keys(this.selected_forms).length - 2
          : 0
    };
    this.saving = true;
    const data = {
      capture_form: { ...this.selected_forms },
      enabled_capture: this.isCapture,
      forms
    };
    let editData;
    if (this.type == 'single') {
      editData = {
        ids: [this.material._id],
        ...data
      };
    } else {
      editData = {
        ids: this.allMaterials,
        ...data
      };
    }
    this.materialService.leadCapture(editData).subscribe((res) => {
      this.saving = false;
      if (res) {
        this.dialogRef.close(data);
      }
    });
  }

  setCapture(evt: any): void {
    this.isCapture = !this.isCapture;
    if (!this.isCapture) {
      this.selected_forms = [];
    }
  }

  collapsForms(isCollapse: boolean): void {
    this.isCollapse = isCollapse;
  }

  getName(key: string): string {
    if (!key) {
      return '';
    } else {
      const index = this.forms.findIndex((e) => e._id === key);
      if (index !== -1) {
        return this.forms[index].name;
      } else {
        return '';
      }
    }
  }

  getDelayTime(id: number): any {
    const delayHour = Math.floor(id / 3600);
    const delayMinute = Math.floor((id % 3600) / 60);
    const delaySecond = id % 60;
    const hIndex = this.DELAY.HOUR.findIndex((e) => e.id === delayHour);
    const mIndex = this.DELAY.MINUTE.findIndex((e) => e.id === delayMinute);
    const sIndex = this.DELAY.SECOND.findIndex((e) => e.id === delaySecond);

    let delayTimeStr = '';
    if (hIndex > 0) {
      delayTimeStr += this.DELAY.HOUR[hIndex].text + ' ';
    }
    if (mIndex > 0) {
      delayTimeStr += this.DELAY.MINUTE[mIndex].text + ' ';
    }
    if (sIndex > 0) {
      delayTimeStr += this.DELAY.SECOND[sIndex].text;
    }
    if (!delayTimeStr) {
      delayTimeStr = 'Immediate';
    }
    return delayTimeStr;
  }
}
