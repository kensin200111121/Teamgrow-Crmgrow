import { Component, Inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ContactService } from '@services/contact.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-stop-share-contact',
  templateUrl: './stop-share-contact.component.html',
  styleUrls: ['./stop-share-contact.component.scss']
})
export class StopShareContactComponent implements OnInit {
  submitted = false;
  stopShareContactSubscription: Subscription;

  contacts = [];
  members = [];
  member;
  loading = false;
  team = '';

  constructor(
    public contactService: ContactService,
    private dialogRef: MatDialogRef<StopShareContactComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      if (this.data.contacts) {
        this.contacts = this.data.contacts;
      }
      if (this.data.members) {
        this.members = this.data.members;
      }
      if (this.data.team) {
        this.team = this.data.team;
      }
    }
  }

  ngOnInit(): void {}

  selectMember(member): any {
    if (member) {
      this.member = member;
    } else {
      this.member = null;
    }
  }

  stopShare(): void {
    if (!this.member) {
      this.submitted = true;
      return;
    }

    this.loading = true;
    const contacts = this.contacts.map((item) => item._id);

    this.stopShareContactSubscription &&
      this.stopShareContactSubscription.unsubscribe();
    this.stopShareContactSubscription = this.contactService
      .stopShareContacts(contacts, this.member._id, this.team)
      .subscribe((res) => {
        this.loading = false;
        this.dialogRef.close({ status: true });
      });
  }
}
