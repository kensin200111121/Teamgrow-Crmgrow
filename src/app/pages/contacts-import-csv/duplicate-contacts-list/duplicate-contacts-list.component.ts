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
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { UploadImportedContactsComponent } from '@components/upload-imported-contacts/upload-imported-contacts.component';
import { DialogSettings } from '@constants/variable.constants';
import { ContactService } from '@services/contact.service';
import {
  autoMergeContacts,
  contactHeaderOrder,
  formatContact,
  formatValue
} from '@utils/contact';
import { contactTablePropertiseMap } from '@utils/data';
import { Contact2IGroup } from '@utils/data.types';
import { UpdateDuplicatedContactsCsvComponent } from '@pages/contacts-import-csv/update-duplicated-contacts-csv/update-duplicated-contacts-csv.component';
import _ from 'lodash';
import { Contact2I } from '@models/contact.model';
import { checkDuplicatedContact } from '@app/utils/contact';
import { HandlerService } from '@app/services/handler.service';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';

@Component({
  selector: 'app-duplicate-contacts-list',
  templateUrl: './duplicate-contacts-list.component.html',
  styleUrls: ['./duplicate-contacts-list.component.scss']
})
export class DuplicateContactsListComponent implements OnInit {
  readonly isSspa = environment.isSspa;
  @Input('contactGroups') contactGroups: Contact2IGroup[] = [];
  @Input('pcMatching') pcMatching = {};
  @Input() deals: any[] = [];
  @Input('isDeal') isDeal = false;

  @Output('onNext') onNext = new EventEmitter();
  @Output('onPrev') onPrev = new EventEmitter();

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('updateContact')
  updateContact: UpdateDuplicatedContactsCsvComponent;

  properties = contactTablePropertiseMap;

  panelType = '';
  updatingIndex = 0;
  isSaving = false;
  isImporting = false;
  iPCMatching = {};

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;

  updatedContacts: any[] = [];
  contactsToUpload: Contact2I[] = [];

  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private contactService: ContactService,
    public sspaService: SspaService,
    private handlerService: HandlerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.iPCMatching = _.invert(this.pcMatching);
  }

  ngOnChanges(changes): void {
    if (changes.pcMatching) {
      this.iPCMatching = _.invert(changes.pcMatching.currentValue);
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
   * check the duplication is resolved or not
   * @return false if any item is not updated or ignored else true
   */
  isAllUpdated(): boolean {
    for (const group of this.contactGroups) {
      if (!group.updated) return false;
    }
    return true;
  }

  isAllSelectedPage(): boolean {
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex = this.page * this.pageSize.id;
    const groups = this.contactGroups.slice(startIndex, endIndex);
    for (const group of groups) {
      if (!group.checked) return false;
    }
    return true;
  }

  /**
   * check the all items are selected
   */
  isAllSelected(): boolean {
    if (this.contactGroups.length === 0) {
      return false;
    }
    for (const group of this.contactGroups) {
      if (!group.checked) return false;
    }
    return true;
  }

  isPartialSelectedPage(): boolean {
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex = this.page * this.pageSize.id;
    const groups = this.contactGroups.slice(startIndex, endIndex);
    for (const group of groups) {
      if (group.checked) return true;
    }
    return true;
  }

  /**
   * check any item is selected
   */
  isPartialSelected(): boolean {
    for (const group of this.contactGroups) {
      if (group.checked) return true;
    }
    return false;
  }

  /**
   * callback on select the item
   * @params group | index
   */
  onSelect(group: Contact2IGroup, index: number): void {
    const gIndex = index + (this.page - 1) * this.pageSize.id;
    group.checked = !group.checked;
    this.contactGroups[gIndex] = group;
  }

  onDeselect(): void {
    this.contactGroups.forEach((group) => {
      if (group.checked) group.checked = false;
    });
  }

  /**
   * callback on select all items
   */
  onSelectAll(): void {
    const isAllSelected = this.isAllSelected();
    this.contactGroups.forEach((group) => {
      group.checked = !isAllSelected;
    });
  }

  onSelectAllPage(): void {
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex = this.page * this.pageSize.id;
    const isAllSelectedPage = this.isAllSelectedPage();
    for (let index = startIndex; index < endIndex; index++) {
      const group = this.contactGroups[index];
      group.checked = !isAllSelectedPage;
      this.contactGroups[index] = group;
    }
  }

  /**
   * callback on ignore the duplication
   */
  onClose(): void {
    this.onNext.emit(this.updatedContacts);
  }

  nextDeal(): boolean {
    const dealContact = this.updatedContacts.find(
      (e) => e.deal && e.deal !== ''
    );
    return this.isDeal && (dealContact || this.deals.length > 0);
  }

  /**
   * Panel Open and Close event
   * @param $event Panel Open Status
   */
  setPanelType($event: boolean): void {
    if (!$event) {
      this.panelType = '';
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
   * callback on update contact
   * @params
   */
  onUpdateContact(group: Contact2IGroup): void {
    this.drawer.close();
    const result = formatContact(group.result);
    if (result['automation_id']) {
      const contact = group.contacts.find((e) => e.id === result.id);
      if (
        contact['automation_id'] &&
        contact['automation_id'] === result['automation_id']
      ) {
        delete result['automation_id'];
      }
    }
    this.contactService.update(result).subscribe((res) => {
      if (res) {
        this.updatedContacts.push(result);
        this.contactGroups.splice(this.updatingIndex, 1);
        this.toastr.success('1 Contact updated successfully');
      } else {
        group.updated = false;
      }
    });
  }

  selectedLength(): number {
    const selectedGroups = this.contactGroups.filter((group) => group.checked);
    return selectedGroups.length;
  }

  onUpdateAll(): void {
    this.contactGroups.forEach((e) => {
      e.checked = true;
    });
    this.onBulkUpdate();
  }

  onBulkUpdate(): void {
    this.isSaving = true;
    const selectedGroups = this.contactGroups.filter((group) => group.checked);
    const groups = selectedGroups.map((g) => {
      g.result = autoMergeContacts(g.contacts, Object.keys(this.iPCMatching));
      return g;
    });
    this.dialog
      .open(UploadImportedContactsComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          pcMatching: this.pcMatching,
          contactGroups: groups,
          mode: 'update'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.isSaving = false;
        if (res && res.completed) {
          const ids = res.ids;
          const updatedGroups = this.contactGroups.filter((group) =>
            ids.includes(group.result.id)
          );
          const updatedContacts = updatedGroups.map((e) => e.result);
          this.updatedContacts.push(...updatedContacts);
          const remainGroups = this.contactGroups.filter(
            (group) => !ids.includes(group.result.id)
          );
          this.contactGroups = remainGroups || [];
          if (this.contactGroups.length > 0) {
            this.toastr.success(`${ids.length} Contacts updated successfully`);
          }
        }
      });
  }

  notifyCompletion(): void {
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      maxWidth: '500px',
      disableClose: true,
      data: {
        title: 'Congratulations!',
        message: `You've updated ${this.contactGroups.length} duplicated contacts successfully.`,
        confirmLabel: this.nextDeal() ? 'Create Deals' : 'Go to Crmgrow',
        cancelLabel: ''
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      this.onClose();
    });
  }

  updateContactDlg(contact: Contact2I, evt: any): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    const type = contact['crm_contact'] ? '' : 'csv_edit';
    this.dialog
      .open(ContactCreateEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact,
          type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        const groupContacts = [];
        this.contactGroups.forEach((e) => {
          e.contacts.forEach((c) => {
            groupContacts.push(c);
          });
        });
        const allContacts = this.contactsToUpload.concat(groupContacts);
        const response = checkDuplicatedContact(allContacts);
        this.contactsToUpload = response.contacts.filter(
          (e) => !e['crm_contact']
        );
        this.contactGroups = response.groups;
      });
  }

  removeDuplicatedField(groupIndex: number, evt: any): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    const crmContact = this.contactGroups[groupIndex]['contacts'][0];
    const csvContact = this.contactGroups[groupIndex]['contacts'][1];
    if (
      crmContact.cell_phone &&
      csvContact.cell_phone === crmContact.cell_phone
    ) {
      csvContact.cell_phone = '';
    }
    if (crmContact.email && csvContact.email === crmContact.email) {
      csvContact.email = '';
    }
    this.contactsToUpload.push(csvContact);
    this.contactGroups.splice(groupIndex, 1);
  }

  removeCsvContact(groupIndex: number, evt: any): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    this.contactGroups.splice(groupIndex, 1);
  }

  onBulkImport(): void {
    this.isImporting = true;
    this.dialog
      .open(UploadImportedContactsComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          pcMatching: this.pcMatching,
          contacts: this.contactsToUpload,
          mode: 'import'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.isImporting = false;
        if (res && res.completed) {
          this.handlerService.clearImportCSVContact$();
          this.router.navigate(['/contacts']);
        }
      });
  }
}
// End by Sylla
