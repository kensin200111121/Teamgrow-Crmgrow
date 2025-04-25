import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MailListService } from '@services/maillist.service';
import { MailList } from '@models/maillist.model';

@Component({
  selector: 'app-campaign-add-list',
  templateUrl: './campaign-add-list.component.html',
  styleUrls: ['./campaign-add-list.component.scss']
})
export class CampaignAddListComponent implements OnInit {
  listName = '';
  submitted = false;
  creating = false;
  updating = false;
  type = 'add';
  list;
  constructor(
    private dialogRef: MatDialogRef<CampaignAddListComponent>,
    private mailListService: MailListService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.type) {
      this.type = this.data.type;
    }
    if (this.data && this.data.list) {
      this.list = this.data.list;
      this.listName = this.list.title;
    }
  }

  ngOnInit(): void {}

  addList(): void {
    this.creating = true;
    if (this.type === 'add') {
      this.mailListService.createList(this.listName).subscribe((res) => {
        this.creating = false;
        if (res) {
          this.dialogRef.close({ data: new MailList().deserialize(res) });
        } else {
          this.dialogRef.close();
        }
      });
    } else if (this.type === 'edit') {
      this.list = {
        ...this.list,
        title: this.listName
      };
      this.mailListService
        .updateList(this.list._id, this.list)
        .subscribe((res) => {
          this.updating = false;
          if (res) {
            this.dialogRef.close({ data: this.list });
          } else {
            this.dialogRef.close();
          }
        });
    }
  }
}
