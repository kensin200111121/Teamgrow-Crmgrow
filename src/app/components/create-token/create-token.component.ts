import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MAIN_TOKENS } from '@constants/variable.constants';
import { specialCharacter } from '@app/helper';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { contactTableFields } from '@utils/data';
import { TemplateToken } from '@utils/data.types';
import { v4 as uuidv4 } from 'uuid';
import { CustomFieldService } from '@app/services/custom-field.service';
@Component({
  selector: 'app-create-token',
  templateUrl: './create-token.component.html',
  styleUrls: ['./create-token.component.scss']
})
export class CreateTokenComponent implements OnInit {
  garbage: Garbage;
  fields = contactTableFields;
  tokens: TemplateToken[] = [];
  editToken: TemplateToken;
  valueType = '';
  tokenName = '';
  tokenValue = '';
  tokenMatchField = '';
  mode = '';
  existingName = false;
  specialAlphabet = false;
  isSubmitted = false;
  isSaving = false;
  excludeFields = ['first_name', 'last_name', 'email', 'cell_phone'];
  garbageSubscription: Subscription;
  customFieldSubscription: Subscription;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<CreateTokenComponent>,
    private customFieldService: CustomFieldService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.tokens) {
      this.tokens = [...this.data.tokens];
    }
    if (this.data && this.data.editToken) {
      this.mode = 'edit';
      this.editToken = { ...this.data.editToken };
      this.valueType = this.editToken.value !== '' ? 'static' : 'contact';
      this.tokenName = this.editToken.name;
      this.tokenValue = this.editToken.value;
      this.tokenMatchField = this.editToken.match_field;
    } else {
      this.mode = 'create';
      this.valueType = 'contact';
    }
  }

  ngOnInit(): void {
    this.customFieldSubscription && this.customFieldSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.customFieldSubscription = this.customFieldService.fields$.subscribe(
      (customFields) => {
        const additionalFields = customFields.map((e) => e);
        const fields = contactTableFields.filter(
          (field) => this.excludeFields.indexOf(field.value) === -1
        );
        additionalFields.forEach((field) => {
          fields.push({ value: field.name, label: field.name });
        });
        this.fields = [...fields];
      }
    );
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        this.garbage = new Garbage().deserialize(garbage);
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  onChangeTokenName(): void {
    let index;
    if (this.mode === 'create') {
      index = this.tokens.findIndex((e) => e.name === this.tokenName);
    } else {
      index = this.tokens.findIndex(
        (e) => e.id !== this.editToken.id && e.name === this.tokenName
      );
    }
    this.existingName = index > -1;
    this.specialAlphabet = specialCharacter(this.tokenName);
  }

  save(): void {
    if (this.tokenValue === '' && this.tokenMatchField === '') {
      return;
    }
    if (this.existingName || this.specialAlphabet) {
      return;
    }
    this.isSubmitted = true;
    this.isSaving = true;
    const templateTokens = [...this.garbage.template_tokens];
    const saveToken = {
      id: uuidv4(),
      name: this.tokenName,
      value: this.valueType === 'static' ? this.tokenValue : '',
      match_field: this.valueType === 'contact' ? this.tokenMatchField : '',
      default: false
    };
    if (this.mode === 'create') {
      templateTokens.push(saveToken);
    } else {
      const index = templateTokens.findIndex((e) => e.id === this.editToken.id);
      templateTokens[index] = saveToken;
    }

    const updateData = { template_tokens: templateTokens };

    this.userService.updateGarbage(updateData).subscribe(() => {
      this.isSaving = false;
      this.userService.updateGarbageImpl(updateData);
      this.dialogRef.close(true);
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
