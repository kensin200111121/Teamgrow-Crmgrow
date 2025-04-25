import { SspaService } from '../../../services/sspa.service';
// Added by Sylla
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { Contact2I } from '@models/contact.model';
import {
  autoMergeContacts,
  contactHeaderOrder,
  formatValue
} from '@utils/contact';
import { contactTablePropertiseMap } from '@utils/data';
import { Contact2IGroup } from '@utils/data.types';
import { UpdateDuplicatedContactsCsvComponent } from '@pages/contacts-import-csv/update-duplicated-contacts-csv/update-duplicated-contacts-csv.component';
import _ from 'lodash';
import { checkDuplicatedContact } from '@app/utils/contact';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';

@Component({
  selector: 'app-duplicate-contacts-csv-file',
  templateUrl: './duplicate-contacts-csv-file.component.html',
  styleUrls: ['./duplicate-contacts-csv-file.component.scss']
})
export class DuplicateContactsCsvFileComponent implements OnInit {
  @Input('pcMatching') pcMatching = {};
  @Input('contactsToUpload') contactsToUpload: Contact2I[] = [];
  @Input('csvContactGroups') csvContactGroups: Contact2IGroup[] = [];

  @Output('onNext') onNext = new EventEmitter();
  @Output('onPrev') onPrev = new EventEmitter();

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('updateContactCSV')
  updateContactCSV: UpdateDuplicatedContactsCsvComponent;

  iPCMatching = {};
  panelType = '';
  isSaving = false;
  properties = contactTablePropertiseMap;

  contactGroups: Contact2IGroup[] = [];
  updatingIndex = 0;
  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;
  totalDuplications = 0;

  constructor(public sspaService: SspaService, private dialog: MatDialog) {}

  ngOnInit(): void {
    if (!this.contactsToUpload || !this.contactsToUpload.length) {
      this.contactsToUpload = [];
    }
    this.iPCMatching = _.invert(this.pcMatching);
    this.totalDuplications = this.csvContactGroups
      .map((e) => e.contacts.length)
      .reduce((total, a) => total + a);
  }

  ngOnChanges(changes): void {
    if (changes.pcMatching) {
      this.iPCMatching = _.invert(changes.pcMatching.currentValue);
    }
  }

  setPanelType($event: boolean): void {
    if (!$event) {
      this.panelType = '';
    }
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

  /**
   * callback on click the update button
   */
  onUpdate(index: number): void {
    const gIndex = index + (this.page - 1) * this.pageSize.id;
    this.updatingIndex = gIndex;
    setTimeout(() => this.drawer.open(), 50);
  }

  /**
   * callback on update the contact from drawer
   */
  onUpdateContact($event): void {
    this.drawer.close();
    this.csvContactGroups[this.updatingIndex] = $event;
  }

  updateContact(contact: Contact2I, evt: any): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    this.dialog
      .open(ContactCreateEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact,
          type: 'csv_edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const groupContacts = [];
          this.csvContactGroups.forEach((e) => {
            e.contacts.forEach((c) => {
              groupContacts.push(c);
            });
          });
          const allContacts = this.contactsToUpload.concat(groupContacts);
          const response = checkDuplicatedContact(allContacts);
          this.contactsToUpload = response.contacts;
          this.csvContactGroups = response.groups;
          if (this.csvContactGroups.length) {
            this.totalDuplications = this.csvContactGroups
              .map((e) => e.contacts.length)
              .reduce((total, a) => total + a);
          } else {
            this.onContinue();
          }
        }
      });
  }

  /**
   * callback on continue
   */
  onContinue(skipDuplication = false): void {
    this.isSaving = true;
    const contactsToUpload = [...this.contactsToUpload];
    this.csvContactGroups.forEach((group) => {
      if (skipDuplication) {
        const emails = [];
        const cell_phones = [];
        for (let i = 0; i < group.contacts.length; i++) {
          if (
            group.contacts[i].email &&
            emails.includes(group.contacts[i].email)
          ) {
            group.contacts[i].email = '';
          }
          if (
            group.contacts[i].cell_phone &&
            cell_phones.includes(group.contacts[i].cell_phone)
          ) {
            group.contacts[i].cell_phone = '';
          }
        }
        contactsToUpload.push(...group.contacts);
      } else {
        if (!group.updated) {
          group.result = autoMergeContacts(
            group.contacts,
            Object.keys(this.iPCMatching)
          );
        }
        contactsToUpload.push(group.result);
      }
    });
    this.onNext.emit({
      contacts: contactsToUpload
    });
    this.isSaving = false;
  }

  /**
   * callback on cancel
   */
  onCancel(): void {
    this.onPrev.emit();
  }
}
// End by Sylla
