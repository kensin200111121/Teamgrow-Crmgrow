import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DATE_FORMATS, FIELD_TYPES } from '@utils/data';
import { DateFormatEnum, FieldTargetEnum, FieldTypeEnum } from '@utils/enum';
import { NOT_ALLOW_CUSTOM_FIELDS } from '@app/constants/variable.constants';
import { CustomFieldService } from '@app/services/custom-field.service';
@Component({
  selector: 'app-custom-field-add',
  templateUrl: './custom-field-add.component.html',
  styleUrls: ['./custom-field-add.component.scss']
})
export class CustomFieldAddComponent implements OnInit {
  readonly notAllowFields = NOT_ALLOW_CUSTOM_FIELDS;

  mode = ''; // Type for create or edit
  fieldId = ''; // field id
  fieldName = ''; // field name
  format = DateFormatEnum.MMDDYYYY; // field value format: format is available for some fields like date
  duplicated = false;
  submitted = false;
  isSame = false;
  saving = false;
  special_alphabet = false;
  existingName = false;
  notAllowName = false;
  original = {
    id: '',
    name: '',
    options: [],
    status: false,
    type: '',
    format: ''
  };

  // Field Type
  DATE_FORMATS = DATE_FORMATS;
  FIELD_TYPES = FIELD_TYPES;
  FieldTypeEnum = FieldTypeEnum;
  FieldTargetEnum = FieldTargetEnum;
  fieldType = FieldTypeEnum.TEXT as string;
  kind: string;
  customFields: any[] = []; // custom fields list

  // Dropdown Selector Option
  option_id = 1;
  options = [{ label: '', value: 'option-1' }];

  constructor(
    private dialogRef: MatDialogRef<CustomFieldAddComponent>,
    private customFieldService: CustomFieldService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.kind = 'contact';
    if (this.data && this.data.mode) {
      this.mode = this.data.mode;
    }
    if (this.data && this.data.kind) {
      this.kind = this.data.kind;
    }
    this.customFieldService.fields$.subscribe((fields) => {
      this.customFields = fields;
    });
  }

  ngOnInit(): void {
    try {
      this.original = JSON.parse(JSON.stringify(this.data.field));
    } catch (err) {
      console.log('field data', err);
    }
    if (this.mode == 'edit') {
      this.fieldId = this.data.field.id;
      this.fieldName = this.data.field.name;
      const type = this.data.field.type || FieldTypeEnum.TEXT;
      this.FIELD_TYPES.some((_f) => {
        if (_f.value === type) {
          this.fieldType = _f.value;
          return true;
        }
      });

      this.options = this.data.field.options;
      if (this.options.length == 0) {
        this.options = [{ label: '', value: 'option-1' }];
      }

      this.format = this.data.field.format || DateFormatEnum.MMDDYYYY;
    } else if (this.mode === 'convert') {
      this.fieldName = this.data.field.name;
      this.fieldType = this.data.field.type;
      this.format = this.data.field.format || DateFormatEnum.MMDDYYYY;
    }
  }

  addField(): void {
    this.saving = true;
    const spCharsRegExp = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (
      this.fieldName.indexOf('.') !== -1 ||
      this.fieldName.match(new RegExp(spCharsRegExp)) !== null
    ) {
      this.special_alphabet = true;
      this.saving = false;
      return;
    } else {
      this.special_alphabet = false;
    }
    if (this.existingName) {
      this.saving = false;
      return;
    }
    if (this.notAllowFields.indexOf(this.fieldName) !== -1) {
      this.notAllowName = true;
      this.saving = false;
      return;
    }

    if (this.fieldType === FieldTypeEnum.DATE) {
      this.format = this.format || DateFormatEnum.MMDDYYYY;
    }


    let data;
    if (this.mode == 'create') {
      if (this.fieldType === FieldTypeEnum.DROPDOWN) {
        data = {
          name: this.fieldName,
          options: this.options,
          type: this.fieldType,
          format: this.format,
          status: true,
          order: (this.data.length || 0) + 1,
          kind: this.kind
        };
      } else {
        data = {
          name: this.fieldName,
          options: [],
          type: this.fieldType,
          format: this.format,
          status: true,
          order: (this.data.length || 0) + 1,
          kind: this.kind
        };
      }
      this.customFieldService.createField(data).subscribe((res) => {
        this.saving = false;
        this.dialogRef.close(res);
      });
    }
    if (this.mode == 'edit') {
      if (this.fieldType === FieldTypeEnum.DROPDOWN) {
        data = {
          name: this.fieldName,
          options: this.options,
          type: this.fieldType,
          format: this.format,
          status: true,
          kind: this.kind
        };
      } else {
        data = {
          name: this.fieldName,
          type: this.fieldType,
          format: this.format,
          status: true,
          kind: this.kind
        };
      }
      this.customFieldService
        .updateField(this.data.field._id, data)
        .subscribe((res) => {
          this.saving = false;
          this.dialogRef.close(res);
        });
    }
  }

  confirmDuplicated(): void {
    this.existingName = false;
    if (this.fieldName.indexOf('.') == -1) {
      this.special_alphabet = false;
    }
    const duplicatedIndex = this.customFields.findIndex(
      (field) => field.name.toLocaleLowerCase() === this.fieldName.toLocaleLowerCase()
    );
    this.existingName = duplicatedIndex !== -1;
  }

  addOption(): void {
    this.option_id++;
    const data = {
      label: '',
      value: 'option-' + this.option_id
    };
    this.options.push(data);
  }

  deleteOption(index: number): void {
    this.options.splice(index, 1);
    this.isSame = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  optionNameChange(evt: any): void {
    if (this.options.length > 1) {
      if (this.options.filter((option) => option.label == evt).length > 1) {
        this.isSame = true;
      } else {
        this.isSame = false;
      }
    } else {
      this.isSame = false;
    }
  }

  optionValueChange(option: any): void {
    option.value = option.label.replace(' ', '-');
  }
}
