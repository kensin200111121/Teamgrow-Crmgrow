import * as _ from 'lodash';
import { Component, Input, OnInit } from '@angular/core';
import { Contact } from '@app/models/contact.model';

@Component({
  selector: 'app-avatar-contacts',
  templateUrl: './avatar-contacts.component.html',
  styleUrls: ['./avatar-contacts.component.scss']
})
export class AvatarContactsComponent implements OnInit {
  constructor() {}
  @Input('firstContact') firstContact: Contact;
  @Input('contacts')
  public set contacts(val: Contact[]) {
    this._contacts = val || [];
  }
  _contacts: Contact[] = [];
  ngOnInit(): void {
    if (this.firstContact) {
      this._contacts.unshift(this.firstContact);
      this._contacts = _.uniqBy(this._contacts, '_id');
    }
  }

  getAvatarName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name) {
      return contact.first_name.substring(0, 2);
    } else if (contact.last_name) {
      return contact.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }

  getFullName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }
}
