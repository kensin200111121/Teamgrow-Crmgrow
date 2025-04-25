import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-additional-fields',
  templateUrl: './additional-fields.component.html',
  styleUrls: ['./additional-fields.component.scss']
})
export class AdditionalFieldsComponent implements OnInit {
  fields: any = [{ name: '', value: '' }];
  lead_fields: any[] = [];
  lead_data: any = {};
  errors = [];
  valueErrors = [];
  constructor(
    private dialogRef: MatDialogRef<AdditionalFieldsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    let lead_fields = [];
    if (this.data?.lead_fields && this.data.lead_fields.length) {
      lead_fields = this.data.lead_fields;
      this.data.lead_fields.forEach((field) => {
        this.fields.push({
          name: field,
          value: this.data.additional_field[field]
        });
        this.lead_fields.push(field);
      });
    }
    if (this.data?.additional_field) {
      for (const key in this.data.additional_field) {
        if (lead_fields.indexOf(key) === -1) {
          this.fields.push({
            name: key,
            value: this.data.additional_field[key]
          });
        } else {
          this.lead_data[key] = this.data.additional_field[key];
        }
      }
      if (this.fields.length > 1) {
        this.fields.splice(0, 1);
      }
    }
  }

  addField(): void {
    this.fields.push({ name: '', value: '' });
    this.errors.push('');
    this.valueErrors.push('');
  }

  removeField(i: number): void {
    this.fields.splice(i, 1);
    this.errors.splice(i, 1);
    this.valueErrors.splice(i, 1);
  }

  checkField(event: string): void {
    const keys = this.fields.map((e) => e.name);
    for (let i = 0; i < keys.length; i++) {
      if (!keys[i]) {
        continue;
      }
      const sameKeys = keys.filter(
        (e) => e.toLowerCase() === keys[i].toLowerCase()
      );
      if (sameKeys.length >= 2) {
        this.errors[i] = 'There are same fields. Please input different name.';
      } else {
        this.errors[i] = '';
      }
    }
  }
  checkFieldValue(event: string, i: number): void {
    if (event) {
      this.valueErrors[i] = '';
    }
  }

  update(): void {
    const keys = this.fields.map((e) => e.name);
    for (let i = 0; i < keys.length; i++) {
      if (!keys[i]) {
        this.errors[i] = 'Please input the field name.';
      }
    }
    const values = this.fields.map((e) => e.value);
    for (let i = 0; i < values.length; i++) {
      if (!values[i]) {
        this.valueErrors[i] = 'Please input the field value.';
      }
    }
    const fieldNameErrorCount = this.errors.filter((e) => e).length;
    const fieldValueErrorCount = this.valueErrors.filter((e) => e).length;
    if (fieldNameErrorCount && fieldValueErrorCount) {
      return;
    }
    const data = {};
    this.fields.forEach((field) => {
      data[field.name] = field.value;
    });
    this.dialogRef.close({ ...data, ...this.lead_data });
  }
}
