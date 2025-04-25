import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { LeadFormService } from '@app/services/lead-form.service';
import { Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import moment from 'moment-timezone';
import { MIN_ROW_COUNT } from '@app/constants/variable.constants';

@Component({
  selector: 'app-lead-capture-from-track',
  templateUrl: './lead-capture-from-track.component.html',
  styleUrls: ['./lead-capture-from-track.component.scss']
})
export class LeadCaptureFormTrackComponent implements OnInit {
  form: any;
  name = '';
  tags = [];
  fields = [];
  displayedColumns: string[] = ['contact_name', 'created_at'];
  automation = 'None';
  isLoading = true;

  formTracks = [];

  routeSubscription: Subscription;

  readonly PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  readonly MIN_ROW_COUNT = MIN_ROW_COUNT;

  pageSize = this.PAGE_COUNTS[1];
  page = 1;

  totalCount = 0;

  constructor(
    private leadFormService: LeadFormService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.getTrackingHistory(params['id']);
    });
  }

  getTrackingHistory(id = this.form?._id) {
    this.isLoading = true;
    const skip = this.pageSize.id * (this.page - 1);
    this.leadFormService
      .getFormDetailWithHistory(id, {
        skip,
        count: this.pageSize.id
      })
      .subscribe((data) => {
        this.isLoading = false;
        console.log(data);
        if (data.status && data.count) {
          this.totalCount = data.count;
        }
        if (data.status && data.data.form) {
          this.name = data.data.form.name;
          this.form = data.data.form;
          this.fields = this.form.fields.map(
            ({ match_field, name, type, format }) => {
              if (match_field) {
                return { match_field, name, type, format };
              } else {
                if (name === 'First Name') {
                  return { match_field: 'first_name', name, type, format };
                } else if (name === 'Last Name') {
                  return { match_field: 'last_name', name, type, format };
                } else if (name === 'Phone') {
                  return { match_field: 'cell_phone', name, type, format };
                } else {
                  return {
                    match_field: name.toLowerCase(),
                    name,
                    type,
                    format
                  };
                }
              }
            }
          );
          this.displayedColumns = [
            ...this.displayedColumns,
            ...this.fields.map((e) => e.match_field)
          ];
          if (this.form.automation) {
            this.automation = this.form.automation.title;
          }
          this.formTracks = data.data.tracks;
        }
      });
  }

  getAvatarName(contact): any {
    if (contact?.first_name && contact?.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact?.first_name && !contact?.last_name) {
      return contact.first_name[0];
    } else if (!contact?.first_name && contact?.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
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

  changePage(page: number): void {
    this.page = page;
    this.getTrackingHistory();
  }

  onOverPages(page: number): void {
    this.changePage(page);
  }

  changePageSize(size: any): void {
    const newPage =
      Math.floor((this.pageSize.id * (this.page - 1)) / size.id) + 1;

    this.pageSize = size;
    this.changePage(newPage);
  }

  createCSV(): void {
    if (this.isLoading) {
      return;
    }
    const csv = this.formTracks.map((row) =>
      this.displayedColumns
        .map((fieldName) => {
          let result = '';
          if (fieldName === 'contact_name') {
            result = this.getContactName(row.contact);
          }
          if (fieldName === 'created_at') {
            result = moment(row.created_at)?.format('MMM DD hh:mm A') || '';
          }
          const index = this.fields.findIndex(
            (e) => e.match_field === fieldName
          );

          if (index >= 0) {
            if (
              this.fields[index].type === 'date' &&
              this.fields[index].format
            ) {
              result =
                moment(row.data[fieldName])?.format(
                  this.fields[index].format
                ) || '';
            } else {
              result = row.data[fieldName] || '';
            }
          }
          return result.replace(',', ' ');
        })
        .join(',')
    );
    csv.unshift(this.displayedColumns.join(','));
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

  isOverflowing(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth;
  }
}
