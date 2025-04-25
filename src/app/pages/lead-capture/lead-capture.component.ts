import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { DELAY, STATUS } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { StoreService } from '@services/store.service';
import { MaterialService } from '@services/material.service';
import { LeadFormService } from '@app/services/lead-form.service';
import { LeadForm } from '@app/models/lead-form.model';
import { CreateEmbededFormComponent } from '@app/components/create-embeded-form/create-embeded-form.component';
import moment from 'moment-timezone';
import { saveAs } from 'file-saver';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-lead-capture',
  templateUrl: './lead-capture.component.html',
  styleUrls: ['./lead-capture.component.scss']
})
export class LeadCaptureComponent implements OnInit {
  DELAY = DELAY;
  STATUS = STATUS;

  constructor(
    private dialog: MatDialog,
    public leadFormService: LeadFormService,
    private materialService: MaterialService,
    private storeService: StoreService
  ) {
    this.leadFormService.load();
  }

  ngOnInit(): void {}

  deleteForm(id: string): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Delete form',
          message: 'Do you want to delete this form?',
          cancelLabel: 'No',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const materials = this.storeService.materials.getValue();
          const assigned = materials.filter((material) => {
            if (material.capture_form && material.capture_form.length)
              return material.capture_form.indexOf(id) > -1;
          });
          if (assigned.length) {
            const ids = assigned.map((t) => t._id);
            this.dialog
              .open(ConfirmComponent, {
                data: {
                  title: 'There are materials using this form',
                  message:
                    'Do you want to continue ? This form will be removed on materials.',
                  confirmLabel: 'Continue'
                }
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) {
                  const editData = {
                    ids: ids,
                    capture_form: '',
                    enabled_capture: false
                  };
                  this.materialService
                    .leadCapture(editData)
                    .subscribe((response) => {
                      if (response) {
                        this.leadFormService.delete(id);
                      }
                    });
                }
              });
          } else {
            this.leadFormService.delete(id);
          }
        }
      });
  }

  getEmbededCode(form: LeadForm): void {
    this.dialog.open(CreateEmbededFormComponent, {
      width: '90vw',
      maxWidth: '480px',
      data: form
    });
  }

  getContactName(contact): any {
    if (contact?.first_name && contact?.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact?.first_name) {
      return contact.first_name;
    } else if (contact?.last_name) {
      return contact.last_name;
    }
    return 'Unnamed Contact';
  }

  downloadResponse(form: LeadForm): void {
    if (form.trackerCount && form.trackerCount > 0) {
      this.leadFormService
        .getFormDetailWithHistory(form._id, {})
        .subscribe((data) => {
          const form = data.data.form;
          if (data.status && form) {
            const formTracks = data.data.tracks;
            const csv = formTracks.map((row) => {
              let result = `${this.getContactName(row.contact)},${
                moment(row.created_at)?.format('MMM DD hh:mm A') || ''
              }`;

              form.fields.forEach((e) => {
                const fieldName =
                  e.match_field || e.name.toLowerCase().replace(' ', '_');
                const dataFieldName =
                  fieldName === 'phone' ? 'cell_phone' : fieldName;
                if (e.type === 'date') {
                  const date =
                    moment(row.data[dataFieldName])?.format(e.format) || '';
                  result = `${result},${date.replace(',', ' ')}`;
                } else {
                  result = `${result},${
                    row.data[dataFieldName]?.replace(',', '') || ''
                  }`;
                }
              });
              return result;
            });
            const header = `Contact Name,Created At,${form.fields
              .map((e) => e.name)
              .join(',')}`;
            csv.unshift(header);
            const csvArray = csv.join('\r\n');

            const blob = new Blob([csvArray], { type: 'text/csv' });
            const date = new Date();
            let prefix = 'crmgrow';
            if (environment.isSspa) {
              prefix = 'vortex';
            }
            const fileName = `${prefix} Form Tracks (${date.getDate()}-${
              date.getMonth() + 1
            }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
            saveAs(blob, fileName + '.csv');
          }
        });
    }
  }
}
