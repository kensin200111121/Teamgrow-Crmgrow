import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { UserService } from '@app/services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { CustomFieldAddComponent } from '../custom-field-add/custom-field-add.component';
import { formatValue } from '@app/utils/contact';
import { contactMergeFields } from '@app/utils/data';
import { LabelService } from '@app/services/label.service';
import { ContactMergeComponent } from '../contact-merge/contact-merge.component';

@Component({
  selector: 'app-custom-field-match',
  templateUrl: './custom-field-match.component.html',
  styleUrls: ['./custom-field-match.component.scss']
})
export class CustomFieldMatchComponent implements OnInit {
  readonly keepOption = {
    option: 'keep'
  };
  readonly globalOption = {
    option: 'global'
  };
  readonly createOption = {
    option: 'create'
  };

  step = 1;
  isNext = false;
  checkUpdated = false;
  saving = false;

  duplicateData;
  columns = contactMergeFields;
  formatValue = formatValue;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;

  labels = [];
  customFields = [];
  lead_fields: any[] = [];

  _onDestroy = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CustomFieldMatchComponent>,
    private userService: UserService,
    private labelService: LabelService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.duplicateData = this.data.duplicateData;
      const customFields = [];
      this.duplicateData.contacts.forEach((e) => {
        if (Object.keys(e?.additional_field || []).length) {
          Object.keys(e.additional_field).forEach((key) => {
            if (!customFields.includes(key)) {
              const field = {
                name: key,
                type: '',
                match_field: this.keepOption
              };
              this.customFields.push(field);
            }
          });
        }
      });
      if (!this.duplicateData.groups.length) {
        this.step = 2;
      } else {
        if (this.customFields.length) {
          this.isNext = true;
        }
        this.checkDuplicateUpdated();
      }
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit(): void {
    this.userService.garbage$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      });
    this.labelService.allLabels$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((res) => {
        this.labels = res;
      });
  }

  onUpdate(index: number): void {
    const gIndex = index + (this.page - 1) * this.pageSize.id;
    this.dialog
      .open(ContactMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '700px',
        disableClose: true,
        data: {
          type: 'multi',
          contacts: this.duplicateData.groups[gIndex].contacts
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.duplicateData.groups[gIndex].updated = true;
          this.duplicateData.groups[gIndex]['updatedData'] = res;
          this.checkDuplicateUpdated();
          const customFields = [];
          this.duplicateData.groups.forEach((e) => {
            if (Object.keys(e.updatedData?.additional_field || []).length) {
              Object.keys(e.updatedData.additional_field).forEach((key) => {
                if (!customFields.includes(key)) {
                  const field = {
                    name: key,
                    type: '',
                    match_field: this.keepOption
                  };
                  this.customFields.push(field);
                }
              });
            }
          });
          if (!this.customFields.length) {
            this.isNext = false;
          } else {
            this.isNext = true;
          }
        }
      });
  }

  createCustomField(field: any): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'create'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          field.match_field = res;
        } else {
          field.match_field = null;
        }
      });
  }

  next(): void {
    this.step++;
  }

  save(): void {
    const fieldData = [];
    const mergeData = [];
    this.customFields.forEach((e) => {
      let field;
      if (e.match_field?.option) {
        field = {
          name: e.name,
          type: e.match_field.option,
          match_field: null
        };
      } else {
        field = {
          name: e.name,
          type: '',
          match_field: e.match_field.name
        };
      }
      fieldData.push(field);
    });
    this.duplicateData.groups.forEach((e) => {
      if (e.updated) {
        mergeData.push(e.updatedData);
      }
    });
    this.dialogRef.close({ fieldData, mergeData });
  }

  close(): void {
    this.dialogRef.close();
  }

  checkDuplicateUpdated(): void {
    let updated = true;
    this.duplicateData.groups.forEach((e) => {
      updated = updated && e.updated;
    });
    this.checkUpdated = updated;
  }

  onChangePage(page: number): void {
    this.page = page;
  }

  onChangePageSize(type: { id: number; label: string }): void {
    if (this.pageSize.id !== type.id) {
      this.pageSize = type;
      this.page = 1;
    }
  }

  getLabel(id: string): string {
    if (!id) {
      return '';
    } else {
      const index = this.labels.findIndex((e) => e._id === id);
      if (index !== -1) {
        return this.labels[index].name;
      } else {
        return '';
      }
    }
  }
}
