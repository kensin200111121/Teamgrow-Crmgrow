import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { PaymentCardComponent } from '@components/payment-card/payment-card.component';
import { UserService } from '@services/user.service';
import { Contact } from '@models/contact.model';
import { Subscription } from 'rxjs';
import { ContactService } from '@services/contact.service';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import moment from 'moment-timezone';
import { DownloadContactsProgreeBarComponent } from '../contact-download-progress-bar/contact-download-progress-bar.component';
@Component({
  selector: 'app-upgrade-plan-error',
  templateUrl: './upgrade-plan-error.component.html',
  styleUrls: ['./upgrade-plan-error.component.scss']
})
export class UpgradePlanErrorComponent implements OnInit {
  card = {
    card_name: '',
    number: '',
    cvc: '',
    exp_year: '',
    exp_month: '',
    card_brand: '',
    last4: '',
    plan_id: '',
    card_id: '',
    token: ''
  };
  isSaving = false;
  contacts: Contact[] = [];
  selectSubscription: Subscription;

  DOWNLOAD_STATUS = {
    DOWNLOADING: 'downloading',
    COMPLETED: 'completed',
    NOT_START: 'not_start'
  };

  downloadStatus = this.DOWNLOAD_STATUS.NOT_START;
  cancelDate: string;
  constructor(
    public dialogRef: MatDialogRef<UpgradePlanErrorComponent>,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    public contactService: ContactService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userService.payment$.subscribe((res) => {
      if (res) {
        this.card = {
          ...res,
          number: res.last4
        };
      }
    });
    if (this.data?.cancelDate) {
      this.cancelDate = moment(this.data.cancelDate).format('MM/DD/YYYY');
    }
  }

  ngOnInit(): void {
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.contactService
      .selectAll()
      .subscribe((contacts) => {
        this.contacts = contacts;
      });
  }

  goToBilling(): void {
    this.dialogRef.close();
    this.router.navigate([`/profile/billing`]);
  }

  downloadCSV(): void {
    if (!this.contacts || !this.contacts.length) {
      this.toast.error("There isn't any contacts in your account");
      return;
    }
    this.dialog.open(DownloadContactsProgreeBarComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: {
        selection: this.contacts,
        custom_columns: []
      }
    });
  }

  gotoSleepMode(): void {
    this.dialog
      .open(PaymentCardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        disableClose: true,
        data: {
          card: this.card,
          sleep_mode: true
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dialogRef.close();
        }
        if (res.status) {
          location.reload();
        }
      });
  }
  csvEngin(contacts: any): void {
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
    const fileName = `crmgrow Contacts (${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }
}
