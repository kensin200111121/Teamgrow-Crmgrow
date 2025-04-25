import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { DATE_FORMATS, FIELD_TYPES } from '@utils/data';
import { DateFormatEnum, FieldTypeEnum, FieldTargetEnum } from '@utils/enum';
import { NOT_ALLOW_CUSTOM_FIELDS } from '@app/constants/variable.constants';

const baseFields = [
  { name: '', label: 'None', type: FieldTypeEnum.TEXT },
  { name: 'source', label: 'Source', type: FieldTypeEnum.TEXT },
  { name: 'website', label: 'Website', type: FieldTypeEnum.LINK },
  { name: 'brokerage', label: 'Company', type: FieldTypeEnum.TEXT },
  { name: 'address', label: 'Address', type: FieldTypeEnum.TEXT },
  { name: 'city', label: 'City', type: FieldTypeEnum.TEXT },
  { name: 'country', label: 'Country', type: FieldTypeEnum.DROPDOWN },
  { name: 'state', label: 'State', type: FieldTypeEnum.DROPDOWN },
  { name: 'zip', label: 'Zip code', type: FieldTypeEnum.TEXT }
];

@Component({
  selector: 'app-capture-field-add',
  templateUrl: './capture-field-add.component.html',
  styleUrls: ['./capture-field-add.component.scss']
})
export class CaptureFieldAddComponent implements OnInit {
  isField = true;
  submitted = false;
  fields = [];
  match_field = '';
  fieldName = '';
  placeholder = '';
  fieldType = '';
  format = DateFormatEnum.MMDDYYYY;
  option_id = 1;
  options = [{ label: '', value: 'option-1' }];
  selectedOption = [];
  name_duplicated = false;
  isSame = false;
  type = '';
  garbage: Garbage = new Garbage();
  FIELD_TYPES = FIELD_TYPES;
  DATE_FORMATS = DATE_FORMATS;
  FieldTypeEnum = FieldTypeEnum;
  DateFormatEnum = DateFormatEnum;

  readonly notAllowFields = NOT_ALLOW_CUSTOM_FIELDS;

  // Type for create or edit
  fieldId = ''; // field id
  customFieldName = ''; // field name
  customPlaceholder = ''; // type placeholder
  duplicated = false;
  customsubmitted = false;
  customIsSame = false;
  saving = false;
  special_alphabet = false;
  existingName = false;
  notAllowName = false;
  original = {
    id: '',
    name: '',
    options: [],
    placeholder: '',
    status: false,
    type: '',
    format: ''
  };

  // Field Type
  customFieldType = 'text';

  // Dropdown Selector Option
  customoption_id = 1;
  customOptions = [{ label: '', value: 'option-1' }];

  constructor(
    private dialogRef: MatDialogRef<CaptureFieldAddComponent>,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
      if (this.type == 'edit') {
        this.fieldName = this.data.editData.name;
        this.placeholder = this.data.editData.placeholder;
        this.fieldType = this.data.editData.type || FieldTypeEnum.TEXT;
        this.options = this.data.editData.options;
        if (!this.options || this.options?.length == 0) {
          this.options = [{ label: '', value: 'option-1' }];
        }
        this.match_field = this.data.editData.match_field;
      }
    }
  }

  ngOnInit(): void {
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
        if (this.garbage.additional_fields.length) {
          const additionalFields = [];
          this.garbage.additional_fields.forEach((e) => {
            const data = {
              name: e.name,
              label: e.name,
              type: e.type,
              options: e.options
            };
            additionalFields.push(data);
          });
          this.fields = [...baseFields, ...additionalFields];
        }
      }
    });
  }

  // selectField(evt: any, field: any): void {
  //   if (evt.target.checked) {
  //     this.selectedFields.push(field);
  //   } else {
  //     const index = this.selectedFields.findIndex((e) => e.name == field.name);
  //     if (index !== -1) {
  //       this.selectedFields.splice(index, 1);
  //     }
  //   }
  // }

  // checkField(name: string): any {
  //   const index = this.selectedFields.findIndex((e) => e.name == name);
  //   if (index !== -1) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  changeMatchField() {
    let fResult = null;
    fResult = this.fields.filter((field) => field.name === this.match_field);
    this.selectedOption = fResult[0].options;
    if (fResult && fResult[0]?.type && fResult[0]?.label !== 'None') {
      this.fieldType = fResult[0].type;
    } else {
      this.fieldType = '';
    }
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

  confirm_NameDuplicated(): void {
    const index = this.data.fields.findIndex((e) => e.name === this.fieldName);
    if (index > -1) {
      this.name_duplicated = true;
      return;
    } else {
      this.name_duplicated = false;
    }
  }

  addField(): void {
    if (!this.name_duplicated) {
      let data;
      if (this.fieldType === FieldTypeEnum.DROPDOWN) {
        this.format = this.format || DateFormatEnum.MMDDYYYY;
      }
      if (this.fieldType == FieldTypeEnum.DROPDOWN) {
        data = {
          name: this.fieldName,
          type: this.fieldType,
          placeholder: this.placeholder,
          //options: this.options,
          match_field: this.match_field,
          format: this.format
        };
      } else {
        data = {
          name: this.fieldName,
          type: this.fieldType,
          placeholder: this.placeholder,
          options: [],
          match_field: this.match_field,
          format: this.format
        };
      }
      this.dialogRef.close(data);
    }
  }

  addCustomField(): void {
    this.saving = true;
    const spCharsRegExp = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (
      this.customFieldName.indexOf('.') !== -1 ||
      this.customFieldName.match(new RegExp(spCharsRegExp)) !== null
    ) {
      this.special_alphabet = true;
      this.saving = false;
      this.isField = true;
      return;
    } else {
      this.special_alphabet = false;
    }
    if (this.existingName) {
      this.saving = false;
      this.isField = true;
      return;
    }
    if (this.notAllowFields.indexOf(this.customFieldName) !== -1) {
      this.notAllowName = true;
      this.saving = false;
      this.isField = true;
      return;
    }

    if (this.fieldType === FieldTypeEnum.DATE) {
      this.format = this.format || DateFormatEnum.MMDDYYYY;
    }

    const additional_fields = [];
    for (
      let index = 0;
      index < this.garbage.additional_fields.length;
      index++
    ) {
      const field = this.garbage.additional_fields[index];
      field.id = `${index + 1}`;
      additional_fields.push(field);
    }
    let data;
    if (this.customFieldType === FieldTypeEnum.DROPDOWN) {
      data = {
        id: (this.garbage.additional_fields.length + 1).toString(),
        name: this.customFieldName,
        placeholder: this.customPlaceholder,
        options: this.customOptions,
        type: this.customFieldType,
        format: this.format,
        status: false
      };
    } else {
      data = {
        id: (this.garbage.additional_fields.length + 1).toString(),
        name: this.customFieldName,
        placeholder: this.customPlaceholder,
        options: [],
        type: this.customFieldType,
        format: this.format,
        status: false
      };
    }
    const fieldTmp = data;
    this.garbage.additional_fields.push(data);
    this.match_field = this.customFieldName;

    const updateData = {
      additional_fields: this.garbage.additional_fields,
      capture_field: this.garbage.capture_field,
      template_tokens: this.garbage.template_tokens
    };
    this.userService.updateGarbage(updateData).subscribe(() => {
      this.saving = false;
      this.userService.updateGarbageImpl(updateData);
      this.isField = true;
    });
  }

  confirmDuplicated(): void {
    this.existingName = false;
    if (this.customFieldName.indexOf('.') == -1) {
      this.special_alphabet = false;
    }
    const index = this.garbage.additional_fields.findIndex(
      (field) =>
        field.name === this.customFieldName && field.id !== this.fieldId
    );
    this.existingName = index !== -1;
  }

  addCustomOption(): void {
    this.customoption_id++;
    const data = {
      label: '',
      value: 'option-' + this.customoption_id
    };
    this.customOptions.push(data);
  }

  customDeleteOption(index: number): void {
    this.customOptions.splice(index, 1);
    this.isSame = false;
  }

  close(): void {
    this.isField = true;
  }

  customOptionNameChange(evt: any): void {
    if (this.customOptions.length > 1) {
      if (
        this.customOptions.filter((option) => option.label == evt).length > 1
      ) {
        this.customIsSame = true;
      } else {
        this.customIsSame = false;
      }
    } else {
      this.customIsSame = false;
    }
  }

  customOptionValueChange(option: any): void {
    option.value = option.label.replace(' ', '-');
  }

  showCustomField() {
    this.isField = false;
  }

  getFieldLabel(type: string): string {
    const field = this.FIELD_TYPES.find((f) => f.value === type);
    return field ? field.label : '';
  }
}
