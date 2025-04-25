import { Component, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactService } from '@app/services/contact.service';
import { saveAs } from 'file-saver';
import { environment } from '@environments/environment';

const CHUNK_COUNT = 10000;

type DialogData = {
  selection: any[];
  custom_columns: any[];
};

@Component({
  selector: 'app-contact-download-progress-bar',
  templateUrl: './contact-download-progress-bar.component.html',
  styleUrls: ['./contact-download-progress-bar.component.scss']
})
export class DownloadContactsProgreeBarComponent {
  overallContacts = 0;
  downloadedContactsCount = 0;
  downloadPercent = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialogRef: MatDialogRef<DownloadContactsProgreeBarComponent>,
    private contactService: ContactService
  ) {
    if (this.data.selection.length) {
      this.overallContacts = this.data.selection.length;
      this.chunkDownload(0);
    } else {
      this.dialogRef.close();
    }
  }

  chunkDownload(chunkNum: number): void {
    const ids = [];
    const totalSum = this.data.selection?.length ?? 0;
    this.data.selection.forEach((e, index) => {
      const currentOffset = CHUNK_COUNT * chunkNum;
      const nextOffset = CHUNK_COUNT * (chunkNum + 1);
      if (
        index >= currentOffset &&
        index < (nextOffset < totalSum ? nextOffset : totalSum)
      ) {
        ids.push(e._id);
      }
    });
    if (ids.length > 0) {
      this.contactService.downloadCSV(ids).subscribe((data) => {
        let contacts = [];
        data.forEach((e) => {
          const contact = {
            first_name: ((e.contact.first_name || '') + '').trim(),
            last_name: ((e.contact.last_name || '') + '').trim(),
            email: ((e.contact.email || '') + '').trim(),
            phone: ((e.contact.cell_phone || '') + '').trim(),
            source: ((e.contact.source || '') + '').trim(),
            company: ((e.contact.brokerage || '') + '').trim(),
            city: ((e.contact.city || '') + '').trim(),
            state: ((e.contact.state || '') + '').trim(),
            zip: ((e.contact.zip || '') + '').trim(),
            address: ((e.contact.address || '') + '').trim(),
            secondary_email: ((e.contact.secondary_email || '') + '').trim(),
            secondary_phone: ((e.contact.secondary_phone || '') + '').trim()
          };

          let label = '';
          if (e.contact.label) {
            label = e.contact.label.name || '';
          }
          contact['tags'] = e.contact.tags.join(', ');
          contact['status'] = label;

          //Custom fields
          if (this.data.custom_columns.length) {
            this.data.custom_columns.forEach((custom_column, index) => {
              let key = custom_column;
              if (contact[custom_column]) key = custom_column + index;
              if (
                e.contact.additional_field &&
                e.contact.additional_field[custom_column]
              ) {
                contact[key] = e.contact.additional_field[custom_column]
                  .toString()
                  .trim();
              } else {
                contact[key] = '';
              }
            });
          }

          const notes = [];
          if (e.note && e.note.length) {
            e.note.forEach((note) => {
              notes.push(note.content);
            });
          }
          contact['note'] = notes.join('     ');
          contact['note'] = contact['note'].replace(/<[^>]+>/g, '');

          contacts.push(contact);
        });

        const downloadSum = contacts.length;

        // if current page's contact are downloaded, then export csv
        if (downloadSum > 0) {
          this.csvEngin(contacts, chunkNum + 1);
          contacts = [];
        }
        this.downloadedContactsCount += ids.length;
        this.downloadPercent = Math.floor(
          (this.downloadedContactsCount / this.overallContacts) * 100
        );
        if (this.downloadedContactsCount === this.overallContacts) {
          this.dialogRef.close();
          this.overallContacts = 0;
          this.downloadedContactsCount = 0;
          this.downloadPercent = 0;
          return;
        }
        if (ids.length === CHUNK_COUNT) {
          this.chunkDownload(chunkNum + 1);
        }
      });
    }
  }

  csvEngin(contacts: any, index: number): void {
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(contacts[0]);
    const csv = contacts.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], { type: 'text/csv' });
    const date = new Date();
    let prefix = 'crmgrow';
    if (environment.isSspa) {
      prefix = 'vortex';
    }
    const fileName = `${prefix} Contacts-${index}(${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }
}
