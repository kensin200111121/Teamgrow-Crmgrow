import { Component, OnDestroy, OnInit } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotifyComponent } from '@components/notify/notify.component';
import { DialogSettings } from '@constants/variable.constants';
import { HandlerService } from '@services/handler.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { saveAs } from 'file-saver';
import { first, zip } from 'rxjs';
import phone from 'phone';
import { SAMPLE_CONTACTS } from '@app/constants/contacts.constant';
@Component({
  selector: 'app-upload-contacts',
  templateUrl: './upload-contacts.component.html',
  styleUrls: ['./upload-contacts.component.scss']
})
export class UploadContactsComponent implements OnInit, OnDestroy {
  isCSVFile = false;
  fileSize;
  fileName = '';
  templeteLink = environment.isSspa
    ? 'https://teamgrow.s3.us-east-2.amazonaws.com/csv_template_vortex_contacts.csv'
    : 'https://teamgrow.s3.us-east-2.amazonaws.com/csv_template1.csv';

  private columns = []; // CSV Header columns
  private lines = []; // CSV File Line Data

  constructor(
    private dialogRef: MatDialogRef<UploadContactsComponent>,
    private dialog: MatDialog,
    private papa: Papa,
    private handlerService: HandlerService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  /**
   * Clear the File Import variables to import the file newly
   */
  initImport(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.isCSVFile = false;
    this.fileName = '';
  }

  /**
   * Select the CSV file and parse that
   * @param evt: File Select Event
   * @returns
   */
  readFile(evt): any {
    this.initImport();
    const file = evt.target.files[0];
    if (!file) {
      return false;
    }
    if (!file.name?.toLowerCase().endsWith('.csv')) {
      this.isCSVFile = false;
      this.toastr.error('Please select the csv file.', 'Import Contacts');
      return false;
    }

    this.isCSVFile = true;
    this.fileName = file.name;
    this.fileSize = this.humanFileSize(file.size);
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const text = fileReader.result + '';
      this.papa.parse(text, {
        skipEmptyLines: true,
        complete: (results) => {
          results.data[0].forEach((e) => {
            let column;
            if (this.columns.includes(e)) {
              const columnIndex = this.columns.filter((_e) =>
                _e.includes(e)
              ).length;
              column = e + columnIndex;
            } else {
              column = e;
            }
            this.columns.push(column);
          });
          const lines = results.data.slice(1);
          this.lines = [];

          // remove blank columns and that column cells in rows
          for (let i = results.data[0].length - 1; i >= 0; i--) {
            if (results.data[0][i] === '') {
              this.columns.splice(i, 1);
              for (const line of lines) {
                line.splice(i, 1);
              }
            } else if (this.columns.includes(results.data[0][i])) {
            }
          }

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.join('').trim()) {
              const contact = {};
              line.forEach((cell, index) => {
                const field = this.columns[index];
                contact[field] = cell.trim();
              });
              this.lines.push(contact);
            }
          }

          if (this.lines.length > 10000) {
            // Alert & Disable
            this.dialog
              .open(NotifyComponent, {
                ...DialogSettings.ALERT,
                data: {
                  message:
                    'This csv contains 10,000+ records. Please split the file and try again.'
                }
              })
              .afterClosed()
              .subscribe((res) => {
                this.initImport();
              });
            return;
          }

          // Add index to the same name columns
          const sameColumns = {};
          for (let i = 0; i < this.columns.length; i++) {
            let column = this.columns[i];
            column = column.replace(/(\s\(\d\))$/, '');
            if (!sameColumns[column]) {
              sameColumns[column] = 1;
            } else {
              this.columns[i] = column + ' (' + sameColumns[column] + ')';
              sameColumns[column]++;
            }
          }
          this.handlerService.saveCSVFileData$(this.columns, this.lines);
        }
      });
    };
    fileReader.readAsText(evt.target.files[0]);
    return true;
  }

  downloadTemplate(fileName): void {
    const replacer = (key, value) => (value === null ? '' : value);
    const header = Object.keys(SAMPLE_CONTACTS[0]);
    const csv = SAMPLE_CONTACTS.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], { type: 'text/csv' });
    if (environment.isSspa) {
      fileName += '_vortex';
    }
    saveAs(blob, fileName + '.csv');
  }

  next(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.columns.length) {
      this.dialog
        .open(NotifyComponent, {
          ...DialogSettings.ALERT,
          data: {
            message: `
              <div class="f-3 c-black fw-600" translate>
                The first row of csv file is empty.
              </div>
              <div class="f-3 c-black fw-600" translate>
                Need help getting started?
              </div>
              <a class="v-center download-button f-3 border-0 c-blue fw-600 text-decoration-none mt-3 mx-auto" href="https://teamgrow.s3.us-east-2.amazonaws.com/csv_template1.csv" download="csv_template.csv">
                <i class="i-icon sm i-download bgc-blue" aria-hidden="true"></i>
                <span class="ml-2" translate>Download Template</span>
              </a>`
          }
        })
        .afterClosed()
        .subscribe(() => {
          this.dialogRef.close();
        });
    } else {
      this.close();
      this.router.navigate(['/contacts/prepare-import-csv']);
    }
  }

  close(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef.close();
  }

  /**
   * Byte to Human Read Size
   * @param bytes: Number (Bytes)
   * @param si: (1000 is 1024 in Per Unit)
   * @param dp:
   * @returns string
   */
  private humanFileSize(bytes, si = true, dp = 1): any {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }

    const units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
      bytes /= thresh;
      ++u;
    } while (
      Math.round(Math.abs(bytes) * r) / r >= thresh &&
      u < units.length - 1
    );

    return bytes.toFixed(dp) + ' ' + units[u];
  }
}
