import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { JSONParser } from '@utils/functions';
import { CustomFieldService } from '@app/services/custom-field.service';
@Component({
  selector: 'app-custom-field-delete',
  templateUrl: './custom-field-delete.component.html',
  styleUrls: ['./custom-field-delete.component.scss']
})
export class CustomFieldDeleteComponent implements OnInit {
  fields: any[] = [];
  type = '';
  deleting = false;
  garbage: Garbage = new Garbage();
  kind: string;
  constructor(
    private dialogRef: MatDialogRef<CustomFieldDeleteComponent>,
    private userService: UserService,
    private customFieldService: CustomFieldService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.kind = 'contact';
    if (this.data) {
      this.fields = this.data.fields;
    }
    if (this.data && this.data.kind) {
      this.kind = this.data.kind;
    }
  }

  ngOnInit(): void {}

  deleteField(): void {
    this.deleting = true;
    const deletedId = this.fields.map((e) => e._id);
    if (this.kind == 'contact') {
      // delete template tokens that are already matched with deleting custom fields
      const templateTokens = [...this.garbage.template_tokens];
      for (let index = templateTokens.length - 1; index >= 0; index--) {
        const token = templateTokens[index];
        const field = this.data.fields.find(
          (e) => e.name === token.match_field
        );
        if (field) {
          this.garbage.template_tokens.splice(index, 1);
        }
      }
      const updateData = {
        template_tokens: this.garbage.template_tokens
      };
      this.userService.updateGarbage(updateData).subscribe(() => {
        this.userService.updateGarbageImpl(updateData);
        const custom_columns = localStorage.getCrmItem(
          'contact_custom_columns'
        );
        if (custom_columns) {
          const parsedData = JSONParser(custom_columns);
          const names = new Set(this.fields.map((c) => c.name));
          const c_columns = parsedData.filter((c) => !names.has(c));
          localStorage.setCrmItem(
            'contact_custom_columns',
            JSON.stringify(c_columns)
          );
        }

        //Remove custom field from localstroage - contact_columns
        const contact_columns = localStorage.getCrmItem('contact_columns');
        if (contact_columns) {
          const parsedData = JSONParser(contact_columns);
          const names = new Set(this.fields.map((c) => c.name));
          const c_columns = parsedData.filter((c) => !names.has(c.name));
          localStorage.setCrmItem('contact_columns', JSON.stringify(c_columns));
        }
        this.customFieldService.deleteFields(deletedId).subscribe((res) => {
          this.deleting = false;
          this.dialogRef.close({ status: true });
        });
      });

      //Remove custom field from localstroage - contact_custom_columns
    } else {
      this.customFieldService.deleteFields(deletedId).subscribe((res) => {
        this.deleting = false;
        this.dialogRef.close({ status: true });
      });
    }
  }
}
